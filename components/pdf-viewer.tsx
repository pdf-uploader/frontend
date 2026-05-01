"use client";

import { PdfDocumentRenderLoading } from "@/components/pdf-loading-ui";
import { useFixedChromeInverseScale } from "@/lib/hooks/use-fixed-chrome-inverse-scale";
import { primePdfJsMainThreadOnly } from "@/lib/pdf-main-thread";
import { authStore } from "@/lib/auth-store";
import { pdfStreamProxyRequestHeaders } from "@/lib/pdf-stream-proxy-auth";
import { getReaderPdfZoomChromePack } from "@/lib/reader-chat-room";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import type { PDFDocumentProxy } from "pdfjs-dist";

/**
 * Required by PDF.js if the fake-worker path ever falls back to a dynamic import.
 * When `globalThis.pdfjsWorker` is set first, no dedicated worker thread is created.
 */
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/** Fullscreen only: zoom as scale factors (100% = 1). +/- steps these; pinch clamps and snaps on release. */
const FULLSCREEN_ZOOM_SCALES = [1, 1.2, 1.4, 1.6, 1.8, 2, 2.2, 2.4, 2.6, 2.8, 3] as const;

function snapScaleToFullscreenPreset(scale: number): number {
  let best: (typeof FULLSCREEN_ZOOM_SCALES)[number] = FULLSCREEN_ZOOM_SCALES[0];
  let bestDiff = Math.abs(scale - best);
  for (const candidate of FULLSCREEN_ZOOM_SCALES) {
    const d = Math.abs(scale - candidate);
    if (d < bestDiff) {
      bestDiff = d;
      best = candidate;
    }
  }
  return best;
}

function fullscreenZoomPresetIndex(scale: number): number {
  const snapped = snapScaleToFullscreenPreset(scale);
  const i = FULLSCREEN_ZOOM_SCALES.findIndex((s) => Math.abs(s - snapped) < 1e-9);
  return i >= 0 ? i : 0;
}

interface PDFViewerProps {
  /**
   * Same-origin PDF URL (cookies attach automatically). Fetched once with `fetch(..., { credentials: "include" })`
   * and optional `Authorization` before passing bytes to `<Document>`; avoids PDF.js issuing an uncredentialled GET from a worker.
   */
  fileUrl: string | Blob;
  /** Sent on the prefetch `fetch`; HttpOnly cookies are still included when `credentials: "include"` and same-origin. */
  authorizationBearer?: string | null;
  /** Forwarded as `credentials: "include"` on the prefetch `fetch` when true (default). */
  pdfWithCredentials?: boolean;
  activePage?: number;
  keyword?: string;
  activeKeywordHitPage?: number;
  activeKeywordHitOccurrenceInPage?: number;
  highlightEnabled?: boolean;
  bookmarkColor?: BookmarkColorId;
  pageTone?: PageToneId;
  coverTone?: CoverToneId;
  isFullscreen?: boolean;
  /** Embedded / preview URLs: hide zoom UI and lock magnification to 100%. */
  previewMode?: boolean;
  onCurrentPageChange?: (page: number) => void;
  onNumPagesChange?: (total: number) => void;
  onVisiblePagesChange?: (pages: number[]) => void;
  bookmarkedPages?: number[];
  /** Optional error callback (logging, telemetry). Remount `<Document>` by changing `fileUrl`/auth if you need recovery. */
  onDocumentLoadError?: (error: Error) => void;
  /**
   * Reader FAB size in rem (fullscreen compact). When set with zoom UI, pill metrics match chat FAB proportionally.
   */
  readerFabSizeRem?: number;
}

type BookmarkColorId = "silver" | "sand" | "ice" | "sage";
type PageToneId = "white" | "ivory" | "mist";
type CoverToneId = "slate" | "stone" | "forest";

async function responseToBlobWithProgress(
  res: Response,
  signal: AbortSignal,
  onChunk: (loaded: number, total: number | null) => void,
): Promise<Blob> {
  const ct = res.headers.get("content-type") ?? "application/pdf";
  const cl = res.headers.get("content-length");
  const parsedTotal = cl ? Number.parseInt(cl, 10) : NaN;
  const totalKnown = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null;

  if (!res.body) {
    const blob = await res.blob();
    onChunk(blob.size, totalKnown ?? blob.size ?? null);
    return blob;
  }

  const reader = res.body.getReader();
  const chunks: BlobPart[] = [];
  let loaded = 0;
  onChunk(0, totalKnown);

  while (true) {
    const { done, value } = await reader.read();
    if (signal.aborted) {
      await reader.cancel();
      throw new DOMException("Aborted", "AbortError");
    }
    if (done) {
      break;
    }
    chunks.push(value);
    loaded += value.byteLength;
    onChunk(loaded, totalKnown);
  }

  return new Blob(chunks, { type: ct });
}

export function PDFViewer({
  fileUrl,
  authorizationBearer = null,
  pdfWithCredentials = true,
  activePage = 1,
  keyword = "",
  activeKeywordHitPage,
  activeKeywordHitOccurrenceInPage,
  highlightEnabled = true,
  bookmarkColor = "silver",
  pageTone = "white",
  coverTone = "slate",
  isFullscreen = false,
  previewMode = false,
  onCurrentPageChange,
  onNumPagesChange,
  onVisiblePagesChange,
  bookmarkedPages = [],
  onDocumentLoadError,
  readerFabSizeRem,
}: PDFViewerProps) {
  const onDocumentLoadErrorRef = useRef(onDocumentLoadError);
  onDocumentLoadErrorRef.current = onDocumentLoadError;

  const [pdfMainReady, setPdfMainReady] = useState(false);
  useEffect(() => {
    void primePdfJsMainThreadOnly().then(() => setPdfMainReady(true));
  }, []);

  const [urlFetchedPdfBlob, setUrlFetchedPdfBlob] = useState<Blob | null>(null);
  const [urlPdfFetchError, setUrlPdfFetchError] = useState<Error | null>(null);
  const [pdfFetchProgress, setPdfFetchProgress] = useState<{ loaded: number; total: number | null }>({
    loaded: 0,
    total: null,
  });

  useEffect(() => {
    if (typeof fileUrl !== "string") {
      setUrlFetchedPdfBlob(null);
      setUrlPdfFetchError(null);
      setPdfFetchProgress({ loaded: 0, total: null });
      return;
    }

    const trimmed = fileUrl.trim();
    if (!trimmed) {
      setUrlFetchedPdfBlob(null);
      setUrlPdfFetchError(null);
      setPdfFetchProgress({ loaded: 0, total: null });
      return;
    }

    if (!pdfMainReady) {
      return;
    }

    const ctrl = new AbortController();
    setUrlFetchedPdfBlob(null);
    setUrlPdfFetchError(null);
    setPdfFetchProgress({ loaded: 0, total: null });

    void (async () => {
      let loggedHttpFailure = false;
      try {
        const token =
          authorizationBearer?.trim() || authStore.getAccessToken()?.trim() || null;
        const headers = token ? pdfStreamProxyRequestHeaders(token) : undefined;
        const res = await fetch(trimmed, {
          signal: ctrl.signal,
          credentials: pdfWithCredentials ? "include" : "same-origin",
          cache: "no-store",
          headers,
        });
        if (!res.ok) {
          let message = `Could not load PDF (${res.status}).`;
          const ct = res.headers.get("content-type");
          if (ct?.includes("application/json")) {
            try {
              const j = (await res.json()) as { message?: unknown };
              if (typeof j.message === "string" && j.message.trim()) {
                message = j.message.trim();
              }
            } catch {
              //
            }
          }
          // Objects as 2nd arg collapse to "▶ Object" in DevTools; use strings so the line is readable at a glance.
          console.error(`[pdf-stream] HTTP ${res.status}: ${message}`);
          console.error(`[pdf-stream] URL: ${trimmed}`);
          loggedHttpFailure = true;
          throw new Error(message);
        }
        const blob = await responseToBlobWithProgress(res, ctrl.signal, (loaded, total) => {
          setPdfFetchProgress({ loaded, total });
        });
        setUrlFetchedPdfBlob(blob);
      } catch (e) {
        if (ctrl.signal.aborted) {
          return;
        }
        const err = e instanceof Error ? e : new Error(String(e));
        if (!loggedHttpFailure) {
          console.error(`[pdf-stream] ${err.message}`);
          console.error(`[pdf-stream] URL: ${trimmed}`);
        }
        setUrlFetchedPdfBlob(null);
        setUrlPdfFetchError(err);
        onDocumentLoadErrorRef.current?.(err);
      }
    })();

    return () => ctrl.abort();
  }, [pdfMainReady, fileUrl, authorizationBearer, pdfWithCredentials]);

  const documentPdfFile = useMemo((): Blob | undefined => {
    if (typeof fileUrl !== "string") {
      return fileUrl;
    }
    return urlFetchedPdfBlob ?? undefined;
  }, [fileUrl, urlFetchedPdfBlob]);

  const [parsePdfProgress, setParsePdfProgress] = useState<{ loaded: number; total: number }>({
    loaded: 0,
    total: 0,
  });

  useEffect(() => {
    setParsePdfProgress({ loaded: 0, total: 0 });
  }, [documentPdfFile]);

  const isPdfFromBlobProp = typeof fileUrl !== "string";
  const documentLoadingUi = useMemo(
    () => (
      <PdfDocumentRenderLoading
        fetchLoaded={isPdfFromBlobProp ? 0 : pdfFetchProgress.loaded}
        fetchTotal={isPdfFromBlobProp ? null : pdfFetchProgress.total}
        parseLoaded={parsePdfProgress.loaded}
        parseTotal={parsePdfProgress.total}
      />
    ),
    [isPdfFromBlobProp, pdfFetchProgress.loaded, pdfFetchProgress.total, parsePdfProgress.loaded, parsePdfProgress.total],
  );

  const MOBILE_BREAKPOINT = 1024;
  const TOUCH_DESKTOP_BREAKPOINT = 1280;
  const BOOK_PAGE_MAX_WIDTH = 520;
  const BOOK_GRID_GAP_PX = 12;
  /** Per-spread card chrome (borders + padding) so the PDF width fits two columns. */
  const DESKTOP_SPREAD_PAGE_FRAME = 20;
  const MOBILE_PAGE_MAX_WIDTH = 700;
  /** Tiny fudge so rounding/clipping doesn’t hide pixels; zoom HUD overlays PDF—no layout spacer. */
  const FULLSCREEN_LAYOUT_EPSILON_PX = 8;
  /** Until page 1 loads, assume near-A4 portrait for fullscreen contain math (PDF points ratio). */
  const FULLSCREEN_FALLBACK_PDF_HEIGHT_OVER_WIDTH = 1.414;
  const MIN_ZOOM = 1;
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(activePage);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);
  const [mobileTransition, setMobileTransition] = useState<{
    from: number;
    to: number;
    direction: "next" | "prev";
  } | null>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [pinchZoomScale, setPinchZoomScale] = useState(1);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [hasTouchInput, setHasTouchInput] = useState(false);
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  /** Page 1 viewport at scale 1 (PDF units); used so fullscreen fills width or height exactly. */
  const [pdfPageViewportSize, setPdfPageViewportSize] = useState<{ width: number; height: number } | null>(null);
  /** Multiplier from VisualViewport.scale when the engine exposes it (pinch-zoom); pairs with pinchZoomScale for HUD %. */
  const [visualViewportScale, setVisualViewportScale] = useState(1);
  const flipTimerRef = useRef<number | null>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const isPinchingRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panPointerIdRef = useRef<number | null>(null);
  const panLastClientRef = useRef({ x: 0, y: 0 });
  const panDragMovedRef = useRef(false);
  const [isPanningViewport, setIsPanningViewport] = useState(false);
  const normalizedKeyword = highlightEnabled ? keyword.trim().toLowerCase() : "";
  const bookmarkedSet = useMemo(() => new Set(bookmarkedPages), [bookmarkedPages]);
  const FLIP_DURATION = 460;
  const zoomPercent = Math.round(pinchZoomScale * visualViewportScale * 100);
  const zoomHudPercent = isFullscreen
    ? Math.round(snapScaleToFullscreenPreset(pinchZoomScale) * 100)
    : zoomPercent;
  const isSinglePageView =
    viewportWidth > 0 &&
    (viewportWidth < MOBILE_BREAKPOINT ||
      isStandalonePwa ||
      ((isCoarsePointer || hasTouchInput) && viewportWidth < TOUCH_DESKTOP_BREAKPOINT));
  const effectiveDesktopLeftPage = toSpreadStart(currentPage);
  const leftPage = isSinglePageView ? currentPage : effectiveDesktopLeftPage;
  const rightPage = !isSinglePageView && effectiveDesktopLeftPage + 1 <= numPages ? effectiveDesktopLeftPage + 1 : null;
  const isSinglePageFullscreen = isFullscreen && isSinglePageView;
  const isZoomedDocument = pinchZoomScale > MIN_ZOOM;
  /** Fullscreen desktop spread: single horizontal strip so zoomed pages keep intrinsic width and don’t overlap in a 50/50 grid. */
  const fullscreenSpreadCombinedZoom = isFullscreen && isZoomedDocument && !isSinglePageView;
  const shouldFitToFullscreenHeight =
    isSinglePageFullscreen && pinchZoomScale <= MIN_ZOOM && pdfPageViewportSize === null;
  const domBookContentWidth = getBookViewportContentWidth(viewportRef.current);
  /** Fullscreen: DOM rect can stay tiny under browser zoom while layout viewport is correct — align with measured vw. */
  const bookContentWidth =
    isFullscreen && viewportWidth > 0 ? Math.max(domBookContentWidth, viewportWidth) : domBookContentWidth;

  const pageWidth = useMemo(() => {
    /**
     * Fullscreen: fit width is computed at 100% zoom only; magnification is applied solely via
     * `<Page scale={pinchZoomScale}>`. Including pinchZoomScale in the width formula divides by z,
     * which cancels scale and makes +/- zoom appear broken.
     */
    const zFit = isFullscreen ? MIN_ZOOM : Math.max(pinchZoomScale, 0.01);
    const fullscreenPdfLaneHeight =
      isFullscreen && viewportHeight > 0 ? Math.max(0, viewportHeight - FULLSCREEN_LAYOUT_EPSILON_PX) : 0;
    const pdfVw = pdfPageViewportSize?.width ?? 1;
    const pdfVh = pdfPageViewportSize?.height ?? FULLSCREEN_FALLBACK_PDF_HEIGHT_OVER_WIDTH;

    if (bookContentWidth <= 0) {
      return BOOK_PAGE_MAX_WIDTH;
    }
    if (isSinglePageView) {
      const sideReserve = isFullscreen ? 8 : 12;
      if (isFullscreen && fullscreenPdfLaneHeight > 0) {
        const gapPx = 0;
        const fit = computeFullscreenContainPageWidthProp({
          availW: Math.max(0, bookContentWidth - sideReserve),
          availH: fullscreenPdfLaneHeight,
          pdfViewportWidth: pdfVw,
          pdfViewportHeight: pdfVh,
          zoomScale: zFit,
          columns: 1,
          gapPx,
        });
        return clampNumber(fit, 240, 8000);
      }
      return clampNumber(
        Math.floor((bookContentWidth - sideReserve) / zFit),
        240,
        isFullscreen ? 1200 : MOBILE_PAGE_MAX_WIDTH
      );
    }
    if (isFullscreen) {
      if (fullscreenPdfLaneHeight <= 0) {
        return clampNumber(Math.floor((bookContentWidth - 8) / (2 * zFit)), 320, 8000);
      }
      const gapPx = 0;
      const fit = computeFullscreenContainPageWidthProp({
        availW: Math.max(0, bookContentWidth - 8),
        availH: fullscreenPdfLaneHeight,
        pdfViewportWidth: pdfVw,
        pdfViewportHeight: pdfVh,
        zoomScale: zFit,
        columns: 2,
        gapPx,
      });
      return clampNumber(fit, 320, 8000);
    }
    return clampNumber(
      Math.floor((bookContentWidth - BOOK_GRID_GAP_PX - 2 * DESKTOP_SPREAD_PAGE_FRAME) / (2 * zFit)),
      200,
      BOOK_PAGE_MAX_WIDTH
    );
  }, [
    bookContentWidth,
    isSinglePageView,
    isFullscreen,
    pinchZoomScale,
    viewportHeight,
    pdfPageViewportSize,
  ]);
  const pageHeight = shouldFitToFullscreenHeight
    ? clampNumber(Math.floor(Math.max(0, viewportHeight - FULLSCREEN_LAYOUT_EPSILON_PX)), 240, 2600)
    : undefined;

  useEffect(() => {
    if (!isSinglePageFullscreen) {
      setPinchZoomScale(MIN_ZOOM);
      pinchStartDistanceRef.current = null;
      pinchStartScaleRef.current = MIN_ZOOM;
      isPinchingRef.current = false;
    }
  }, [MIN_ZOOM, isSinglePageFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }
    setPinchZoomScale((s) => {
      const lo = FULLSCREEN_ZOOM_SCALES[0];
      const hi = previewMode ? MIN_ZOOM : FULLSCREEN_ZOOM_SCALES[FULLSCREEN_ZOOM_SCALES.length - 1];
      return snapScaleToFullscreenPreset(clampNumber(s, lo, hi));
    });
  }, [isFullscreen, previewMode]);

  useEffect(() => {
    if (!previewMode) {
      return;
    }
    setPinchZoomScale(MIN_ZOOM);
    pinchStartDistanceRef.current = null;
    pinchStartScaleRef.current = MIN_ZOOM;
    isPinchingRef.current = false;
  }, [previewMode, MIN_ZOOM]);

  /** Inline (non-fullscreen) viewer is preview-style: no magnification. */
  useEffect(() => {
    if (isFullscreen) {
      return;
    }
    setPinchZoomScale(MIN_ZOOM);
  }, [isFullscreen, MIN_ZOOM]);

  useEffect(() => {
    setPinchZoomScale(MIN_ZOOM);
    setPdfPageViewportSize(null);
  }, [MIN_ZOOM, fileUrl]);

  useEffect(() => {
    if (!isSinglePageFullscreen || !viewportRef.current) {
      return;
    }
    viewportRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [currentPage, isSinglePageFullscreen]);

  useEffect(() => {
    if (!numPages) {
      return;
    }
    const normalizedPage = clampPage(activePage, numPages);
    setCurrentPage(normalizedPage);
  }, [activePage, numPages]);

  useEffect(() => {
    if (!onCurrentPageChange) {
      return;
    }
    onCurrentPageChange(currentPage);
  }, [currentPage, onCurrentPageChange]);

  useEffect(() => {
    if (!onVisiblePagesChange) {
      return;
    }
    onVisiblePagesChange(rightPage ? [leftPage, rightPage] : [leftPage]);
  }, [leftPage, onVisiblePagesChange, rightPage]);

  useEffect(() => {
    const updateBookViewport = () => {
      if (!viewportRef.current) {
        return;
      }
      const el = viewportRef.current;
      const rect = el.getBoundingClientRect();
      let vw = Math.max(0, Math.round(rect.width));
      let vh = Math.max(0, Math.round(rect.height));
      if (isFullscreen) {
        const fs = getFullscreenPdfAvailSizePx(rect);
        vw = fs.width;
        vh = fs.height;
      }
      setViewportWidth(vw);
      setViewportHeight(vh);

      if (typeof window !== "undefined" && window.visualViewport) {
        const s = window.visualViewport.scale;
        if (typeof s === "number" && Number.isFinite(s) && s > 0) {
          setVisualViewportScale(s);
        } else {
          setVisualViewportScale(1);
        }
      } else {
        setVisualViewportScale(1);
      }

      setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
      setHasTouchInput(window.matchMedia("(hover: none)").matches || navigator.maxTouchPoints > 0);
      setIsStandalonePwa(isStandaloneDisplayMode());
    };

    const scheduleRemeasure = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(updateBookViewport);
      });
    };

    updateBookViewport();
    const el = viewportRef.current;
    const ro =
      el &&
      new ResizeObserver(() => {
        updateBookViewport();
      });
    if (el && ro) {
      ro.observe(el);
    }
    window.addEventListener("resize", updateBookViewport);
    window.addEventListener("orientationchange", updateBookViewport);
    document.addEventListener("fullscreenchange", scheduleRemeasure);
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    vv?.addEventListener("resize", updateBookViewport);
    vv?.addEventListener("scroll", updateBookViewport);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateBookViewport);
      window.removeEventListener("orientationchange", updateBookViewport);
      document.removeEventListener("fullscreenchange", scheduleRemeasure);
      vv?.removeEventListener("resize", updateBookViewport);
      vv?.removeEventListener("scroll", updateBookViewport);
    };
  }, [fileUrl, isFullscreen]);

  useEffect(() => {
    if (!isSinglePageView) {
      return;
    }

    const preventPinchZoom = (event: TouchEvent) => {
      if (!isSinglePageFullscreen && event.touches.length > 1) {
        event.preventDefault();
      }
    };

    const preventDoubleTapZoom = (event: TouchEvent) => {
      const now = Date.now();
      const target = event.currentTarget as HTMLDivElement & { __lastTapTime?: number };
      if (target.__lastTapTime && now - target.__lastTapTime < 280) {
        event.preventDefault();
      }
      target.__lastTapTime = now;
    };

    const currentViewport = viewportRef.current;
    if (!currentViewport) {
      return;
    }

    currentViewport.addEventListener("touchstart", preventPinchZoom, { passive: false });
    currentViewport.addEventListener("touchend", preventDoubleTapZoom, { passive: false });
    return () => {
      currentViewport.removeEventListener("touchstart", preventPinchZoom);
      currentViewport.removeEventListener("touchend", preventDoubleTapZoom);
    };
  }, [isSinglePageFullscreen, isSinglePageView]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, []);

  const canFlipNext = isSinglePageView ? currentPage < numPages : effectiveDesktopLeftPage + 2 <= numPages;
  const canFlipPrev = isSinglePageView ? currentPage > 1 : effectiveDesktopLeftPage > 1;
  const fullscreenZoomMax = FULLSCREEN_ZOOM_SCALES[FULLSCREEN_ZOOM_SCALES.length - 1];
  /** Zoom chrome and pinch steps only in fullscreen; optional `preview` URL disables there too. */
  const showZoomUi = isFullscreen && !previewMode;
  const pinchZoomUpper = showZoomUi ? fullscreenZoomMax : MIN_ZOOM;

  const pdfZoomChromePack = useMemo(
    () =>
      showZoomUi && readerFabSizeRem != null && readerFabSizeRem > 0
        ? getReaderPdfZoomChromePack(readerFabSizeRem)
        : null,
    [readerFabSizeRem, showZoomUi]
  );
  const fixedChromeInverseScale = useFixedChromeInverseScale();

  const canZoomOut = showZoomUi && fullscreenZoomPresetIndex(pinchZoomScale) > 0;
  const canZoomIn = showZoomUi && fullscreenZoomPresetIndex(pinchZoomScale) < FULLSCREEN_ZOOM_SCALES.length - 1;

  const zoomOut = () => {
    if (!showZoomUi) {
      return;
    }
    setPinchZoomScale((prev) => {
      const i = fullscreenZoomPresetIndex(prev);
      return FULLSCREEN_ZOOM_SCALES[Math.max(0, i - 1)];
    });
  };

  const zoomIn = () => {
    if (!showZoomUi) {
      return;
    }
    setPinchZoomScale((prev) => {
      const i = fullscreenZoomPresetIndex(prev);
      return FULLSCREEN_ZOOM_SCALES[Math.min(FULLSCREEN_ZOOM_SCALES.length - 1, i + 1)];
    });
  };

  const resetZoom = () => {
    if (!showZoomUi) {
      return;
    }
    setPinchZoomScale(FULLSCREEN_ZOOM_SCALES[0]);
  };

  const canPanFullscreen = isFullscreen && pinchZoomScale > MIN_ZOOM;

  const onPanPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!canPanFullscreen || isPinchingRef.current) {
        return;
      }
      if (!event.isPrimary) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest("[data-pdf-zoom-controls]")) {
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      panPointerIdRef.current = event.pointerId;
      panLastClientRef.current = { x: event.clientX, y: event.clientY };
      panDragMovedRef.current = false;
      setIsPanningViewport(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [canPanFullscreen]
  );

  const onPanPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (panPointerIdRef.current !== event.pointerId) {
      return;
    }
    const vp = viewportRef.current;
    if (!vp) {
      return;
    }

    const dx = event.clientX - panLastClientRef.current.x;
    const dy = event.clientY - panLastClientRef.current.y;
    if (dx !== 0 || dy !== 0) {
      panDragMovedRef.current = true;
      vp.scrollLeft -= dx;
      vp.scrollTop -= dy;
      panLastClientRef.current = { x: event.clientX, y: event.clientY };
    }
  }, []);

  const endPanPointer = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (panPointerIdRef.current !== event.pointerId) {
      return;
    }
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    panPointerIdRef.current = null;
    setIsPanningViewport(false);
  }, []);

  const onPanPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      endPanPointer(event);
    },
    [endPanPointer]
  );

  const onPanPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      endPanPointer(event);
      panDragMovedRef.current = false;
    },
    [endPanPointer]
  );

  const onPanLostPointerCapture = useCallback(() => {
    panPointerIdRef.current = null;
    setIsPanningViewport(false);
  }, []);

  const onViewportClickCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!canPanFullscreen) {
        return;
      }
      if (panDragMovedRef.current) {
        event.preventDefault();
        event.stopPropagation();
        panDragMovedRef.current = false;
      }
    },
    [canPanFullscreen]
  );

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || !isFullscreen) {
      return;
    }
    if (pinchZoomScale <= MIN_ZOOM) {
      vp.scrollTo({ left: 0, top: 0, behavior: "auto" });
    }
  }, [pinchZoomScale, isFullscreen, MIN_ZOOM]);

  const goToNextSpread = () => {
    if (!canFlipNext || flipDirection) {
      return;
    }
    setFlipDirection("next");
    if (isSinglePageView) {
      const targetPage = Math.min(numPages, currentPage + 1);
      if (isZoomedDocument) {
        setMobileTransition(null);
      } else {
        setMobileTransition({ from: currentPage, to: targetPage, direction: "next" });
      }
      flipTimerRef.current = window.setTimeout(() => {
        setCurrentPage(targetPage);
        setMobileTransition(null);
        setFlipDirection(null);
      }, FLIP_DURATION);
      return;
    }
    flipTimerRef.current = window.setTimeout(() => {
      setCurrentPage((prev) => Math.min(numPages, prev + 2));
      setFlipDirection(null);
    }, FLIP_DURATION);
  };

  const goToPrevSpread = () => {
    if (!canFlipPrev || flipDirection) {
      return;
    }
    setFlipDirection("prev");
    if (isSinglePageView) {
      const targetPage = Math.max(1, currentPage - 1);
      if (isZoomedDocument) {
        setMobileTransition(null);
      } else {
        setMobileTransition({ from: currentPage, to: targetPage, direction: "prev" });
      }
      flipTimerRef.current = window.setTimeout(() => {
        setCurrentPage(targetPage);
        setMobileTransition(null);
        setFlipDirection(null);
      }, FLIP_DURATION);
      return;
    }
    flipTimerRef.current = window.setTimeout(() => {
      setCurrentPage((prev) => Math.max(1, prev - 2));
      setFlipDirection(null);
    }, FLIP_DURATION);
  };

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (flipDirection) {
        return;
      }

      // Volume key events are browser/device dependent, but supported when exposed.
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === "AudioVolumeUp") {
        event.preventDefault();
        goToNextSpread();
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp" || event.key === "AudioVolumeDown") {
        event.preventDefault();
        goToPrevSpread();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flipDirection, goToNextSpread, goToPrevSpread, isFullscreen]);

  const fullscreenDocWrapClass =
    isFullscreen
      ? "flex h-full min-h-0 w-full max-w-full flex-1 flex-col"
      : "w-full min-w-0 max-w-full space-y-4";

  if (!pdfMainReady) {
    return (
      <div className={fullscreenDocWrapClass}>
        <PdfDocumentRenderLoading />
      </div>
    );
  }

  if (typeof fileUrl === "string") {
    const trimmedSrc = fileUrl.trim();
    if (!trimmedSrc) {
      return null;
    }
    if (urlPdfFetchError) {
      return (
        <div className={fullscreenDocWrapClass}>
          <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-5 text-center text-sm text-rose-900">
            {urlPdfFetchError.message || "Unable to load the PDF."}
          </div>
        </div>
      );
    }
    if (!urlFetchedPdfBlob) {
      return (
        <div className={fullscreenDocWrapClass}>
          <PdfDocumentRenderLoading
            fetchLoaded={pdfFetchProgress.loaded}
            fetchTotal={pdfFetchProgress.total}
            parseLoaded={0}
            parseTotal={0}
          />
        </div>
      );
    }
  }

  return (
    <Document
      file={documentPdfFile}
      onLoadProgress={({ loaded, total }) => {
        setParsePdfProgress((prev) => ({
          loaded,
          total: typeof total === "number" && total > 0 ? total : prev.total > 0 ? prev.total : 0,
        }));
      }}
      onLoadSuccess={async (pdf: PDFDocumentProxy) => {
        const pages = pdf.numPages;
        setNumPages(pages);
        onNumPagesChange?.(pages);
        try {
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1 });
          setPdfPageViewportSize({ width: viewport.width, height: viewport.height });
        } catch {
          setPdfPageViewportSize(null);
        }
      }}
      onLoadError={
        onDocumentLoadError
          ? (err) => {
              onDocumentLoadError(err instanceof Error ? err : new Error(String(err)));
            }
          : undefined
      }
      loading={documentLoadingUi}
      className={fullscreenDocWrapClass}
    >
      <div
        ref={viewportRef}
        data-pdf-book-viewport
        className={[
          "pdf-book-viewport relative w-full min-w-0 max-w-full select-none",
          isFullscreen && pinchZoomScale > MIN_ZOOM
            ? ["touch-manipulation overscroll-contain overflow-auto", isPanningViewport ? "cursor-grabbing" : "cursor-grab"].join(
                " "
              )
            : "overflow-x-hidden overflow-y-hidden",
          !isZoomedDocument ? "touch-pan-y" : "",
          isFullscreen
            ? "flex h-full min-h-0 flex-1 flex-col rounded-none border-0 bg-white p-0"
            : "mx-auto h-auto max-w-[1120px] rounded-2xl border border-slate-200 p-3 shadow-inner lg:h-[760px] lg:p-4",
        ].join(" ")}
        style={{
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          touchAction: isSinglePageFullscreen ? "auto" : undefined,
          ...(!isFullscreen ? getCoverSurfaceStyle(coverTone) : {}),
        }}
        onClickCapture={onViewportClickCapture}
        onPointerDown={onPanPointerDown}
        onPointerMove={onPanPointerMove}
        onPointerUp={onPanPointerUp}
        onPointerCancel={onPanPointerCancel}
        onLostPointerCapture={onPanLostPointerCapture}
        onWheel={(event) => {
          if (isFullscreen && pinchZoomScale > MIN_ZOOM) {
            return;
          }
          if (isSinglePageView) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          if (Math.abs(event.deltaY) < 8 || flipDirection) {
            return;
          }
          if (event.deltaY > 0) {
            goToNextSpread();
          } else {
            goToPrevSpread();
          }
        }}
        onTouchStart={(event) => {
          if (!isSinglePageView) {
            return;
          }
          if (isZoomedDocument) {
            setTouchStartX(null);
            return;
          }
          if (isSinglePageFullscreen && event.touches.length === 2 && showZoomUi) {
            pinchStartDistanceRef.current = getTouchDistance(event.touches[0], event.touches[1]);
            pinchStartScaleRef.current = pinchZoomScale;
            isPinchingRef.current = true;
            setTouchStartX(null);
            return;
          }
          if (event.touches.length !== 1) {
            return;
          }
          setTouchStartX(event.touches[0]?.clientX ?? null);
        }}
        onTouchMove={(event) => {
          if (!isSinglePageFullscreen || !isPinchingRef.current || event.touches.length !== 2) {
            return;
          }

          const startDistance = pinchStartDistanceRef.current;
          if (!startDistance) {
            return;
          }

          const currentDistance = getTouchDistance(event.touches[0], event.touches[1]);
          const nextScale = clampNumber(
            pinchStartScaleRef.current * (currentDistance / startDistance),
            MIN_ZOOM,
            pinchZoomUpper
          );
          setPinchZoomScale(nextScale);
          event.preventDefault();
        }}
        onTouchEnd={(event) => {
          if (!isSinglePageView || flipDirection) {
            if (event.touches.length < 2) {
              pinchStartDistanceRef.current = null;
              pinchStartScaleRef.current = pinchZoomScale;
              isPinchingRef.current = false;
            }
            return;
          }
          if (isZoomedDocument) {
            setTouchStartX(null);
            if (event.touches.length < 2) {
              if (isSinglePageFullscreen && isPinchingRef.current) {
                setPinchZoomScale((s) => snapScaleToFullscreenPreset(s));
              }
              pinchStartDistanceRef.current = null;
              pinchStartScaleRef.current = pinchZoomScale;
              isPinchingRef.current = false;
            }
            return;
          }

          if (isSinglePageFullscreen && isPinchingRef.current) {
            if (event.touches.length < 2) {
              setPinchZoomScale((s) => snapScaleToFullscreenPreset(s));
              pinchStartDistanceRef.current = null;
              pinchStartScaleRef.current = pinchZoomScale;
              isPinchingRef.current = false;
            }
            setTouchStartX(null);
            return;
          }

          if (touchStartX === null) {
            return;
          }
          const touchEndX = event.changedTouches[0]?.clientX;
          if (typeof touchEndX !== "number") {
            return;
          }
          const deltaX = touchStartX - touchEndX;

          if (isSinglePageFullscreen) {
            if (Math.abs(deltaX) >= 30) {
              if (deltaX > 0) {
                goToNextSpread();
              } else {
                goToPrevSpread();
              }
            } else if (viewportRef.current) {
              const viewportRect = viewportRef.current.getBoundingClientRect();
              if (touchEndX < viewportRect.left + viewportRect.width / 2) {
                goToPrevSpread();
              } else {
                goToNextSpread();
              }
            }
          } else {
            if (Math.abs(deltaX) < 44) {
              return;
            }
            if (deltaX > 0) {
              goToNextSpread();
            } else {
              goToPrevSpread();
            }
          }
          setTouchStartX(null);
        }}
      >
        {!isSinglePageView && !fullscreenSpreadCombinedZoom && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300/70" />
        )}
        {!isSinglePageView && !fullscreenSpreadCombinedZoom && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-gradient-to-r from-slate-300/25 via-slate-400/30 to-slate-300/25 blur-lg" />
        )}
        {showZoomUi && (
          <div
            data-pdf-zoom-controls
            style={{
              ...(pdfZoomChromePack?.bar ?? {}),
              ...(fixedChromeInverseScale !== 1
                ? { transform: `scale(${fixedChromeInverseScale})`, transformOrigin: "top right" }
                : {}),
            }}
            className={[
              "z-50 flex items-center rounded-full border shadow-sm backdrop-blur",
              pdfZoomChromePack ? "" : "gap-1.5 px-1.5 py-1",
              isFullscreen && pinchZoomScale > MIN_ZOOM
                ? "fixed right-[max(0.75rem,env(safe-area-inset-right,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] border-slate-300 bg-white/95 text-slate-800 shadow-sm"
                : [
                    "absolute",
                    isFullscreen
                      ? "right-[max(0.75rem,env(safe-area-inset-right,0px))] top-[max(0.75rem,env(safe-area-inset-top,0px))] border-slate-300 bg-white/95 text-slate-800 shadow-sm"
                      : "right-3 top-3 border-slate-300 bg-white/95 text-slate-800",
                  ].join(" "),
            ].join(" ")}
          >
            <button
              type="button"
              onClick={resetZoom}
              style={pdfZoomChromePack?.emojiBtn}
              className={["font-semibold leading-none transition hover:opacity-80", pdfZoomChromePack ? "" : "px-1 text-[11px]"]
                .filter(Boolean)
                .join(" ")}
              title="Reset zoom to 100%"
              aria-label="Reset zoom to 100 percent"
            >
              🔎
            </button>
            <button
              type="button"
              onClick={zoomOut}
              disabled={!canZoomOut}
              style={pdfZoomChromePack?.circleBtn}
              className={[
                "flex shrink-0 items-center justify-center rounded-full font-semibold leading-none transition",
                "hover:bg-slate-100 disabled:text-slate-300",
                pdfZoomChromePack ? "" : "h-[28px] w-[28px] text-sm",
              ]
                .filter(Boolean)
                .join(" ")}
              title="Zoom out"
              aria-label="Zoom out"
            >
              -
            </button>
            <button
              type="button"
              onClick={resetZoom}
              style={pdfZoomChromePack?.pctBtn}
              className={[
                "rounded-full font-semibold leading-none transition hover:bg-slate-100",
                pdfZoomChromePack ? "" : "min-w-[2.375rem] px-2.5 py-1 text-[11px]",
              ]
                .filter(Boolean)
                .join(" ")}
              title="Reset viewer zoom (combines toolbar zoom with visual viewport scale when the browser reports it)"
              aria-label={`Viewer zoom ${zoomHudPercent} percent; reset to fitted size`}
            >
              {zoomHudPercent}%
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={!canZoomIn}
              style={pdfZoomChromePack?.circleBtn}
              className={[
                "flex shrink-0 items-center justify-center rounded-full font-semibold leading-none transition",
                "hover:bg-slate-100 disabled:text-slate-300",
                pdfZoomChromePack ? "" : "h-[28px] w-[28px] text-sm",
              ]
                .filter(Boolean)
                .join(" ")}
              title="Zoom in"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        )}
        <div
          className={[
            "min-h-0",
            fullscreenSpreadCombinedZoom
              ? "flex w-max max-w-none flex-1 flex-row flex-nowrap items-start gap-0 overflow-visible"
              : [
                  "min-w-0 grid w-full max-w-full grid-cols-1 gap-3 lg:grid-cols-2 lg:grid-rows-1",
                  isFullscreen && pinchZoomScale > MIN_ZOOM ? "min-h-0 overflow-visible" : "overflow-hidden",
                  isFullscreen ? "min-h-0 flex-1 gap-0 lg:auto-rows-fr" : "",
                ].join(" "),
          ].join(" ")}
        >
          <BookPage
            fullscreenSpreadStrip={fullscreenSpreadCombinedZoom}
            pageNumber={leftPage}
            isBookmarked={bookmarkedSet.has(leftPage)}
            bookmarkColor={bookmarkColor}
            pageTone={pageTone}
            normalizedKeyword={normalizedKeyword}
            activeKeywordHitPage={activeKeywordHitPage}
            activeKeywordHitOccurrenceInPage={activeKeywordHitOccurrenceInPage}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
            isMobileView={isSinglePageView}
            isFullscreen={isFullscreen}
            mobileIncomingPage={isSinglePageView && !isZoomedDocument ? mobileTransition?.to ?? null : null}
            mobileTransitionDirection={
              isSinglePageView && !isZoomedDocument ? mobileTransition?.direction ?? null : null
            }
            zoomScale={pinchZoomScale}
            onNavigatePrev={goToPrevSpread}
            onNavigateNext={goToNextSpread}
          />
          {rightPage ? (
            <BookPage
              fullscreenSpreadStrip={fullscreenSpreadCombinedZoom}
              pageNumber={rightPage}
              isBookmarked={bookmarkedSet.has(rightPage)}
              bookmarkColor={bookmarkColor}
              pageTone={pageTone}
              normalizedKeyword={normalizedKeyword}
              activeKeywordHitPage={activeKeywordHitPage}
              activeKeywordHitOccurrenceInPage={activeKeywordHitOccurrenceInPage}
              pageWidth={pageWidth}
              pageHeight={pageHeight}
              isMobileView={isSinglePageView}
              isFullscreen={isFullscreen}
              zoomScale={pinchZoomScale}
              onNavigatePrev={goToPrevSpread}
              onNavigateNext={goToNextSpread}
              isRightPage
            />
          ) : fullscreenSpreadCombinedZoom ? null : (
            <div className={["hidden lg:block", isFullscreen ? "min-h-0 bg-white" : "rounded-xl border border-dashed border-slate-300 bg-white/70"].join(" ")} />
          )}
        </div>

        {flipDirection && (
          <div
            className={[
              "pointer-events-none absolute top-4 hidden h-[calc(100%-2rem)] w-[calc(50%-1rem)] overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl lg:block",
              flipDirection === "next"
                ? "right-4 origin-left animate-[bookFlipNext_460ms_ease-in-out_forwards]"
                : "left-4 origin-right animate-[bookFlipPrev_460ms_ease-in-out_forwards]",
            ].join(" ")}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-white to-slate-100" />
            <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-slate-500/20 to-transparent" />
          </div>
        )}
      </div>

      {!isFullscreen && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goToPrevSpread}
            disabled={!canFlipPrev || Boolean(flipDirection)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSinglePageView ? "Previous page" : "Previous spread"}
          </button>
          <p className="text-xs text-slate-500">
            {isSinglePageView
              ? "Tap left/right side, swipe, or use buttons to navigate pages"
              : "Scroll or click left/right page edges to flip"}
          </p>
          <button
            type="button"
            onClick={goToNextSpread}
            disabled={!canFlipNext || Boolean(flipDirection)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSinglePageView ? "Next page" : "Next spread"}
          </button>
        </div>
      )}

      <style jsx global>{`
        @keyframes bookFlipNext {
          0% {
            transform: perspective(1800px) rotateY(0deg);
            opacity: 1;
          }
          55% {
            opacity: 0.96;
          }
          100% {
            transform: perspective(1800px) rotateY(-180deg);
            opacity: 0.72;
          }
        }

        @keyframes bookFlipPrev {
          0% {
            transform: perspective(1800px) rotateY(0deg);
            opacity: 1;
          }
          55% {
            opacity: 0.96;
          }
          100% {
            transform: perspective(1800px) rotateY(180deg);
            opacity: 0.72;
          }
        }

        @keyframes mobilePageSlideOutNext {
          0% {
            transform: translateX(0) scale(1);
            filter: brightness(1);
            opacity: 1;
          }
          100% {
            transform: translateX(-24%) scale(0.985);
            filter: brightness(0.92);
            opacity: 0.75;
          }
        }

        @keyframes mobilePageSlideOutPrev {
          0% {
            transform: translateX(0) scale(1);
            filter: brightness(1);
            opacity: 1;
          }
          100% {
            transform: translateX(24%) scale(0.985);
            filter: brightness(0.92);
            opacity: 0.75;
          }
        }

        @keyframes mobilePageSlideInNext {
          0% {
            transform: translateX(100%) scale(0.985);
            opacity: 0.96;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes mobilePageSlideInPrev {
          0% {
            transform: translateX(-100%) scale(0.985);
            opacity: 0.96;
          }
          100% {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Document>
  );
}

interface BookPageProps {
  pageNumber: number;
  normalizedKeyword: string;
  activeKeywordHitPage?: number;
  activeKeywordHitOccurrenceInPage?: number;
  isBookmarked: boolean;
  bookmarkColor: BookmarkColorId;
  pageTone: PageToneId;
  pageWidth: number;
  pageHeight?: number;
  isMobileView: boolean;
  isFullscreen: boolean;
  isRightPage?: boolean;
  mobileIncomingPage?: number | null;
  mobileTransitionDirection?: "next" | "prev" | null;
  zoomScale: number;
  /** Fullscreen zoomed desktop: page sits in a horizontal strip (intrinsic width), not a 50/50 grid cell. */
  fullscreenSpreadStrip?: boolean;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
}

function BookPage({
  pageNumber,
  normalizedKeyword,
  activeKeywordHitPage,
  activeKeywordHitOccurrenceInPage,
  isBookmarked,
  bookmarkColor,
  pageTone,
  pageWidth,
  pageHeight,
  isMobileView,
  isFullscreen,
  isRightPage = false,
  mobileIncomingPage = null,
  mobileTransitionDirection = null,
  zoomScale,
  fullscreenSpreadStrip = false,
  onNavigateNext,
  onNavigatePrev,
}: BookPageProps) {
  const pageSurface = getPageSurfaceStyle(pageTone);
  const isZoomed = zoomScale > 1;

  const renderPdfPage = (pageToRender: number) => {
    let pageKeywordOccurrenceCounter = 0;
    const isActiveTargetPage = pageToRender === activeKeywordHitPage;
    const activeOccurrence = isActiveTargetPage ? activeKeywordHitOccurrenceInPage : undefined;
    const regex = normalizedKeyword ? new RegExp(`(${escapeRegExp(normalizedKeyword)})`, "gi") : null;

    return (
      <Page
        pageNumber={pageToRender}
        width={pageHeight ? undefined : pageWidth}
        height={pageHeight}
        scale={zoomScale}
        renderAnnotationLayer={false}
        renderTextLayer
        customTextRenderer={({ str }) => {
          if (!normalizedKeyword || !regex) {
            return str;
          }

          const lower = str.toLowerCase();
          if (!lower.includes(normalizedKeyword)) {
            return str;
          }

          return str.replace(regex, (_match) => {
            pageKeywordOccurrenceCounter += 1;
            const isActiveMatch = isActiveTargetPage && activeOccurrence === pageKeywordOccurrenceCounter;
            const highlightColor = isActiveMatch ? "#bbf7d0" : "#fde68a";
            return `<mark style="background:${highlightColor};padding:0 2px;">${_match}</mark>`;
          });
        }}
      />
    );
  };

  return (
    <div
      className={[
        "group relative flex min-w-0 max-w-full flex-col rounded-xl border border-slate-200 p-2 shadow-sm transition hover:shadow-md",
        isFullscreen && isZoomed ? "overflow-visible" : "overflow-hidden",
        isFullscreen
          ? fullscreenSpreadStrip
            ? "h-full min-h-0 w-auto shrink-0 max-w-none rounded-none border-0 p-0 shadow-none"
            : "h-full min-h-0 w-full max-w-full rounded-none border-0 p-0 shadow-none"
          : "",
        isFullscreen && isZoomed
          ? "cursor-grab active:cursor-grabbing"
          : isZoomed && isMobileView
            ? "cursor-default"
            : isRightPage
              ? "cursor-e-resize"
              : "cursor-w-resize",
      ].join(" ")}
      style={!isFullscreen ? { backgroundColor: pageSurface.pageBodyColor } : undefined}
      onClick={(event) => {
        if (isFullscreen && isZoomed) {
          return;
        }
        if (isMobileView) {
          if (isFullscreen) {
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          if (x < rect.width / 2) {
            onNavigatePrev();
          } else {
            onNavigateNext();
          }
          return;
        }
        if (isRightPage) {
          onNavigateNext();
        } else {
          onNavigatePrev();
        }
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (isMobileView) {
          return;
        }
        if (isFullscreen && isZoomed) {
          return;
        }
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (isRightPage) {
            onNavigateNext();
          } else {
            onNavigatePrev();
          }
        }
      }}
    >
      {!isFullscreen && (
        <div className="mb-2 px-1">
          <p className="text-xs font-medium text-slate-500">Page {pageNumber}</p>
        </div>
      )}
      <div
        className={[
          "relative flex items-start rounded-md border border-slate-200",
          /* Centered layout looks nicer at 1×; when zoomed, centering overflows left of the scroll
           origin so scrollLeft≥0 cannot reveal it — align start so overflow is pan-scrollable. */
          isFullscreen && isZoomed ? "justify-start" : "justify-center",
          isFullscreen && isZoomed ? "overflow-visible" : "overflow-hidden",
          isMobileView
            ? isFullscreen
              ? "h-full min-h-0 p-0"
              : "min-h-[56vh] p-2"
            : isFullscreen
              ? [
                  fullscreenSpreadStrip
                    ? "flex h-full min-h-0 w-auto max-w-none flex-none flex-row items-start rounded-none border-0 p-0"
                    : "flex min-h-0 h-full w-full max-w-full flex-1 flex-row items-start rounded-none border-0 p-0",
                  isZoomed ? "justify-start overflow-visible" : "justify-center overflow-hidden",
                ].join(" ")
              : "h-[700px]",
        ].join(" ")}
        style={{
          backgroundColor: isFullscreen ? "#ffffff" : pageSurface.pageCanvasColor,
        }}
      >
        {!isFullscreen && isBookmarked && <BookmarkRibbon color={bookmarkColor} />}
        {isMobileView && mobileIncomingPage && mobileTransitionDirection ? (
          <>
            <div
              className={[
                "relative z-10",
                mobileTransitionDirection === "next"
                  ? "animate-[mobilePageSlideOutNext_460ms_ease-in-out]"
                  : "animate-[mobilePageSlideOutPrev_460ms_ease-in-out]",
              ].join(" ")}
            >
              {renderPdfPage(pageNumber)}
            </div>
            <div
              className={[
                "absolute z-20 flex items-start justify-center",
                isFullscreen ? "inset-0 rounded-none" : "inset-2 rounded-md",
                mobileTransitionDirection === "next"
                  ? "animate-[mobilePageSlideInNext_460ms_ease-in-out]"
                  : "animate-[mobilePageSlideInPrev_460ms_ease-in-out]",
              ].join(" ")}
              style={{ backgroundColor: pageSurface.pageCanvasColor }}
            >
              {renderPdfPage(mobileIncomingPage)}
            </div>
          </>
        ) : (
          renderPdfPage(pageNumber)
        )}
      </div>
      {!isFullscreen && (
        <div
          className={[
            "pointer-events-none absolute inset-y-0 w-14 bg-gradient-to-r opacity-0 transition group-hover:opacity-100",
            isRightPage ? "right-0 from-transparent to-slate-300/30" : "left-0 from-slate-300/30 to-transparent",
          ].join(" ")}
        />
      )}
    </div>
  );
}

function BookmarkRibbon({ color }: { color: BookmarkColorId }) {
  const source = getBookmarkImageSource(color);

  return (
    <img
      src={source}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 z-20 h-10 w-auto object-contain drop-shadow-[0_2px_3px_rgba(15,23,42,0.35)]"
    />
  );
}

function getBookmarkImageSource(color: BookmarkColorId): string {
  switch (color) {
    case "sand":
      return "/bookmarkers/bookmarker_sand.png";
    case "ice":
      return "/bookmarkers/bookmarker_ice.png";
    case "sage":
      return "/bookmarkers/bookmarker_sage.png";
    case "silver":
    default:
      return "/bookmarkers/bookmarker_silver.png";
  }
}

function getPageSurfaceStyle(pageTone: PageToneId): { pageBodyColor: string; pageCanvasColor: string } {
  switch (pageTone) {
    case "ivory":
      return {
        pageBodyColor: "#fcfaf4",
        pageCanvasColor: "#f7f1e6",
      };
    case "mist":
      return {
        pageBodyColor: "#f8faff",
        pageCanvasColor: "#eef3fb",
      };
    case "white":
    default:
      return {
        pageBodyColor: "#ffffff",
        pageCanvasColor: "#ffffff",
      };
  }
}

function getCoverSurfaceStyle(coverTone: CoverToneId): { background: string } {
  switch (coverTone) {
    case "stone":
      return {
        background: "linear-gradient(135deg, #efe5dc 0%, #f8f3ee 48%, #e8ddd0 100%)",
      };
    case "forest":
      return {
        background: "linear-gradient(135deg, #d9e5d7 0%, #edf3eb 48%, #d0decf 100%)",
      };
    case "slate":
    default:
      return {
        background: "linear-gradient(135deg, #e2e8f0 0%, #f8fafc 48%, #dbe3ee 100%)",
      };
  }
}

function clampPage(page: number, numPages: number): number {
  return Math.min(Math.max(1, page), Math.max(1, numPages));
}

function toSpreadStart(page: number): number {
  return page % 2 === 0 ? Math.max(1, page - 1) : Math.max(1, page);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getTouchDistance(
  first: { clientX: number; clientY: number },
  second: { clientX: number; clientY: number }
): number {
  const deltaX = first.clientX - second.clientX;
  const deltaY = first.clientY - second.clientY;
  return Math.hypot(deltaX, deltaY);
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Fullscreen + browser page zoom: nested flex can report a tiny `getBoundingClientRect()` on the book viewport
 * while `window.innerWidth` / VisualViewport still reflect the real layout viewport. Take the max so PDF fit math
 * uses the full screen (CSS px — stable across browser zoom).
 */
function getFullscreenPdfAvailSizePx(rect: DOMRectReadOnly): { width: number; height: number } {
  let w = rect.width;
  let h = rect.height;
  if (typeof window === "undefined") {
    return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) };
  }
  const docEl = document.documentElement;
  const layoutW = Math.max(window.innerWidth, docEl.clientWidth);
  const layoutH = Math.max(window.innerHeight, docEl.clientHeight);
  w = Math.max(w, layoutW);
  h = Math.max(h, layoutH);
  const vv = window.visualViewport;
  if (vv) {
    w = Math.max(w, vv.width);
    h = Math.max(h, vv.height);
  }
  return {
    width: Math.max(1, Math.round(w)),
    height: Math.max(1, Math.round(h)),
  };
}

/**
 * react-pdf `<Page width={w} scale={z} />` renders ~css width `z * w` and height `z * w * (pdfVh/pdfVw)`.
 * Pick `w` so a 1- or 2-column spread fits (contain): touches one viewport axis without clipping.
 */
function computeFullscreenContainPageWidthProp(params: {
  availW: number;
  availH: number;
  pdfViewportWidth: number;
  pdfViewportHeight: number;
  zoomScale: number;
  columns: 1 | 2;
  gapPx: number;
}): number {
  const z = Math.max(params.zoomScale, 0.01);
  const pdfW = Math.max(params.pdfViewportWidth, 1e-6);
  const pdfH = Math.max(params.pdfViewportHeight, 1e-6);
  const ar = pdfH / pdfW;
  const { availW, availH, gapPx, columns } = params;
  const byWidth = (availW - gapPx) / (columns * z);
  const byHeight = availH / (z * ar);
  return Math.floor(Math.min(byWidth, byHeight));
}

function getBookViewportContentWidth(element: HTMLDivElement | null): number {
  if (!element) {
    return 0;
  }
  const s = getComputedStyle(element);
  const pl = parseFloat(s.paddingLeft) || 0;
  const pr = parseFloat(s.paddingRight) || 0;
  const w = element.getBoundingClientRect().width;
  return Math.max(0, w - pl - pr);
}

function isStandaloneDisplayMode(): boolean {
  const browserStandalone =
    typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    typeof navigator !== "undefined" &&
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return browserStandalone || iosStandalone;
}
