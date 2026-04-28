"use client";

import { PdfDocumentRenderLoading } from "@/components/pdf-loading-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  activePage?: number;
  keyword?: string;
  activeKeywordHitPage?: number;
  activeKeywordHitOccurrenceInPage?: number;
  highlightEnabled?: boolean;
  bookmarkColor?: BookmarkColorId;
  pageTone?: PageToneId;
  coverTone?: CoverToneId;
  isFullscreen?: boolean;
  onCurrentPageChange?: (page: number) => void;
  onNumPagesChange?: (total: number) => void;
  onVisiblePagesChange?: (pages: number[]) => void;
  bookmarkedPages?: number[];
}

type BookmarkColorId = "silver" | "sand" | "ice" | "sage";
type PageToneId = "white" | "ivory" | "mist";
type CoverToneId = "slate" | "stone" | "forest";

export function PDFViewer({
  fileUrl,
  activePage = 1,
  keyword = "",
  activeKeywordHitPage,
  activeKeywordHitOccurrenceInPage,
  highlightEnabled = true,
  bookmarkColor = "silver",
  pageTone = "white",
  coverTone = "slate",
  isFullscreen = false,
  onCurrentPageChange,
  onNumPagesChange,
  onVisiblePagesChange,
  bookmarkedPages = [],
}: PDFViewerProps) {
  const MOBILE_BREAKPOINT = 1024;
  const TOUCH_DESKTOP_BREAKPOINT = 1280;
  const BOOK_PAGE_MAX_WIDTH = 520;
  const BOOK_GRID_GAP_PX = 12;
  /** Per-spread card chrome (borders + padding) so the PDF width fits two columns. */
  const DESKTOP_SPREAD_PAGE_FRAME = 20;
  const MOBILE_PAGE_MAX_WIDTH = 700;
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.2;
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
  const flipTimerRef = useRef<number | null>(null);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const isPinchingRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const normalizedKeyword = highlightEnabled ? keyword.trim().toLowerCase() : "";
  const bookmarkedSet = useMemo(() => new Set(bookmarkedPages), [bookmarkedPages]);
  const FLIP_DURATION = 460;
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
  const shouldFitToFullscreenHeight = isSinglePageFullscreen && pinchZoomScale <= MIN_ZOOM;
  const bookContentWidth = getBookViewportContentWidth(viewportRef.current);
  /** react-pdf Page width × scale; fullscreen desktop two-page also uses 1.4. */
  const desktopFullscreenPageScale = isFullscreen && !isSinglePageView ? 1.4 : 1;

  const pageWidth = useMemo(() => {
    const z = Math.max(pinchZoomScale, 0.01);
    if (bookContentWidth <= 0) {
      return BOOK_PAGE_MAX_WIDTH;
    }
    if (isSinglePageView) {
      const sideReserve = isFullscreen ? 8 : 12;
      return clampNumber(
        Math.floor((bookContentWidth - sideReserve) / z),
        240,
        isFullscreen ? 1200 : MOBILE_PAGE_MAX_WIDTH
      );
    }
    if (isFullscreen) {
      return clampNumber(
        Math.floor((bookContentWidth - 8) / (2 * z * desktopFullscreenPageScale)),
        320,
        1800
      );
    }
    return clampNumber(
      Math.floor(
        (bookContentWidth - BOOK_GRID_GAP_PX - 2 * DESKTOP_SPREAD_PAGE_FRAME) / (2 * z)
      ),
      200,
      BOOK_PAGE_MAX_WIDTH
    );
  }, [bookContentWidth, isSinglePageView, isFullscreen, pinchZoomScale, desktopFullscreenPageScale]);
  const pageHeight = shouldFitToFullscreenHeight ? clampNumber(Math.floor(viewportHeight - 6), 240, 2600) : undefined;

  useEffect(() => {
    if (!isSinglePageFullscreen) {
      setPinchZoomScale(MIN_ZOOM);
      pinchStartDistanceRef.current = null;
      pinchStartScaleRef.current = MIN_ZOOM;
      isPinchingRef.current = false;
    }
  }, [MIN_ZOOM, isSinglePageFullscreen]);

  useEffect(() => {
    setPinchZoomScale(MIN_ZOOM);
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
      setViewportWidth(el.clientWidth);
      setViewportHeight(el.clientHeight);
      setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
      setHasTouchInput(window.matchMedia("(hover: none)").matches || navigator.maxTouchPoints > 0);
      setIsStandalonePwa(isStandaloneDisplayMode());
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
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    vv?.addEventListener("resize", updateBookViewport);
    vv?.addEventListener("scroll", updateBookViewport);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateBookViewport);
      window.removeEventListener("orientationchange", updateBookViewport);
      vv?.removeEventListener("resize", updateBookViewport);
      vv?.removeEventListener("scroll", updateBookViewport);
    };
  }, [fileUrl]);

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
  const canZoomOut = pinchZoomScale > MIN_ZOOM;
  const canZoomIn = pinchZoomScale < MAX_ZOOM;
  const zoomPercent = Math.round(pinchZoomScale * 100);

  const zoomOut = () => {
    setPinchZoomScale((prev) => clampNumber(Number((prev - ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  };

  const zoomIn = () => {
    setPinchZoomScale((prev) => clampNumber(Number((prev + ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  };

  const resetZoom = () => {
    setPinchZoomScale(MIN_ZOOM);
  };

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

  return (
    <Document
      file={fileUrl}
      onLoadSuccess={({ numPages: pages }) => {
        setNumPages(pages);
        onNumPagesChange?.(pages);
      }}
      loading={<PdfDocumentRenderLoading />}
      className={isFullscreen ? "flex h-full w-full min-w-0 max-w-full flex-col" : "w-full min-w-0 max-w-full space-y-4"}
    >
      <div
        ref={viewportRef}
        data-pdf-book-viewport
        className={[
          "pdf-book-viewport relative w-full min-w-0 max-w-full select-none border overflow-x-hidden overflow-y-hidden",
          !isZoomedDocument ? "touch-pan-y" : "",
          isFullscreen
            ? "h-full w-full min-h-0 rounded-none border-0 bg-slate-950 p-0"
            : "mx-auto h-auto w-full min-w-0 max-w-[1120px] rounded-2xl border-slate-200 p-3 shadow-inner lg:h-[760px] lg:p-4",
        ].join(" ")}
        style={{
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          touchAction: isSinglePageFullscreen ? "auto" : undefined,
          ...(!isFullscreen ? getCoverSurfaceStyle(coverTone) : {}),
        }}
        onWheel={(event) => {
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
          if (isSinglePageFullscreen && event.touches.length === 2) {
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
            MAX_ZOOM
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
              pinchStartDistanceRef.current = null;
              pinchStartScaleRef.current = pinchZoomScale;
              isPinchingRef.current = false;
            }
            return;
          }

          if (isSinglePageFullscreen && isPinchingRef.current) {
            if (event.touches.length < 2) {
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
        {!isSinglePageView && <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300/70" />}
        {!isSinglePageView && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-gradient-to-r from-slate-300/25 via-slate-400/30 to-slate-300/25 blur-lg" />
        )}
        <div
          data-pdf-zoom-controls
          className={[
            "absolute right-3 top-3 z-30 flex items-center gap-1.5 rounded-full border px-1.5 py-1 shadow-sm backdrop-blur",
            isFullscreen ? "border-slate-600 bg-slate-900/85 text-white" : "border-slate-300 bg-white/95 text-slate-800",
          ].join(" ")}
        >
          <span className="px-1 text-[11px] font-semibold">🔎</span>
          <button
            type="button"
            onClick={zoomOut}
            disabled={!canZoomOut}
            className={[
              "h-7 w-7 rounded-full text-sm font-semibold transition",
              isFullscreen ? "hover:bg-slate-700 disabled:text-slate-500" : "hover:bg-slate-100 disabled:text-slate-300",
            ].join(" ")}
            title="Zoom out"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className={[
              "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
              isFullscreen ? "hover:bg-slate-700" : "hover:bg-slate-100",
            ].join(" ")}
            title="Reset zoom"
            aria-label="Reset zoom"
          >
            {zoomPercent}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={!canZoomIn}
            className={[
              "h-7 w-7 rounded-full text-sm font-semibold transition",
              isFullscreen ? "hover:bg-slate-700 disabled:text-slate-500" : "hover:bg-slate-100 disabled:text-slate-300",
            ].join(" ")}
            title="Zoom in"
            aria-label="Zoom in"
          >
            +
          </button>
        </div>
        <div
          className={[
            "grid min-h-0 w-full min-w-0 max-w-full grid-cols-1 gap-3 overflow-hidden lg:grid-cols-2",
            isFullscreen ? "h-full min-h-0 gap-0" : "",
          ].join(" ")}
        >
          <BookPage
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
          ) : (
            <div className={["hidden lg:block", isFullscreen ? "bg-white" : "rounded-xl border border-dashed border-slate-300 bg-white/70"].join(" ")} />
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
            {" • "}Use zoom controls for detailed reading
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
  onNavigateNext,
  onNavigatePrev,
}: BookPageProps) {
  const desktopFullscreenScale = isFullscreen && !isMobileView ? 1.4 : 1;
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
        scale={desktopFullscreenScale * zoomScale}
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
        "group relative flex min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-slate-200 p-2 shadow-sm transition hover:shadow-md",
        isFullscreen ? "h-full min-h-0 w-full max-w-full rounded-none border-0 p-0 shadow-none" : "",
        isZoomed && isMobileView
          ? "cursor-default"
          : isRightPage
            ? "cursor-e-resize"
            : "cursor-w-resize",
      ].join(" ")}
      style={!isFullscreen ? { backgroundColor: pageSurface.pageBodyColor } : undefined}
      onClick={(event) => {
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
          "relative flex items-start justify-center overflow-hidden rounded-md border border-slate-200",
          isMobileView
            ? isFullscreen
              ? "h-full min-h-0 p-0"
              : "min-h-[56vh] p-2"
            : isFullscreen
              ? "min-h-0 w-full min-w-0 max-w-full flex-1 items-center justify-center overflow-hidden rounded-none border-0 p-0"
              : "h-[700px]",
        ].join(" ")}
        style={{
          backgroundColor: pageSurface.pageCanvasColor,
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
        pageCanvasColor: "#f8fafc",
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

function getBookViewportContentWidth(element: HTMLDivElement | null): number {
  if (!element) {
    return 0;
  }
  const s = getComputedStyle(element);
  const pl = parseFloat(s.paddingLeft) || 0;
  const pr = parseFloat(s.paddingRight) || 0;
  return Math.max(0, element.clientWidth - pl - pr);
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
