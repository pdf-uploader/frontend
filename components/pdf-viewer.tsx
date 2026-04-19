"use client";

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
  const BOOK_PAGE_WIDTH = 520;
  const MOBILE_PAGE_MAX_WIDTH = 700;
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
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [hasTouchInput, setHasTouchInput] = useState(false);
  const [isStandalonePwa, setIsStandalonePwa] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const flipTimerRef = useRef<number | null>(null);
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
  const pageWidth = isSinglePageView
    ? clampNumber(
        Math.floor(viewportWidth - (isFullscreen ? 8 : 56)),
        240,
        isFullscreen ? 1200 : MOBILE_PAGE_MAX_WIDTH
      )
    : isFullscreen
      ? clampNumber(Math.floor((viewportWidth - 8) / 2), 320, 1800)
      : BOOK_PAGE_WIDTH;
  const pageHeight = isSinglePageFullscreen ? clampNumber(Math.floor(viewportHeight - 6), 240, 2600) : undefined;

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
    const updateViewportWidth = () => {
      if (!viewportRef.current) {
        return;
      }
      setViewportWidth(viewportRef.current.clientWidth);
      setViewportHeight(viewportRef.current.clientHeight);
      setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
      setHasTouchInput(window.matchMedia("(hover: none)").matches || navigator.maxTouchPoints > 0);
      setIsStandalonePwa(isStandaloneDisplayMode());
    };

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    window.addEventListener("orientationchange", updateViewportWidth);
    return () => {
      window.removeEventListener("resize", updateViewportWidth);
      window.removeEventListener("orientationchange", updateViewportWidth);
    };
  }, []);

  useEffect(() => {
    if (!isSinglePageView) {
      return;
    }

    const preventPinchZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
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
  }, [isSinglePageView]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, []);

  const canFlipNext = isSinglePageView ? currentPage < numPages : effectiveDesktopLeftPage + 2 <= numPages;
  const canFlipPrev = isSinglePageView ? currentPage > 1 : effectiveDesktopLeftPage > 1;

  const goToNextSpread = () => {
    if (!canFlipNext || flipDirection) {
      return;
    }
    setFlipDirection("next");
    if (isSinglePageView) {
      const targetPage = Math.min(numPages, currentPage + 1);
      setMobileTransition({ from: currentPage, to: targetPage, direction: "next" });
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
      setMobileTransition({ from: currentPage, to: targetPage, direction: "prev" });
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
      loading={<p className="text-sm text-slate-600">Loading PDF...</p>}
      className={isFullscreen ? "flex h-full w-full flex-col" : "space-y-4"}
    >
      <div
        ref={viewportRef}
        className={[
          "relative overflow-hidden border touch-pan-y",
          isFullscreen
            ? "h-full w-full rounded-none border-0 bg-slate-950 p-0"
            : "mx-auto h-auto max-w-[1120px] rounded-2xl border-slate-200 p-3 shadow-inner lg:h-[760px] lg:p-4",
        ].join(" ")}
        style={{
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
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
          setTouchStartX(event.touches[0]?.clientX ?? null);
        }}
        onTouchEnd={(event) => {
          if (!isSinglePageView || touchStartX === null || flipDirection) {
            return;
          }
          const touchEndX = event.changedTouches[0]?.clientX;
          if (typeof touchEndX !== "number") {
            return;
          }
          const deltaX = touchStartX - touchEndX;
          if (Math.abs(deltaX) < 44) {
            return;
          }
          if (deltaX > 0) {
            goToNextSpread();
          } else {
            goToPrevSpread();
          }
          setTouchStartX(null);
        }}
      >
        {!isSinglePageView && <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300/70" />}
        {!isSinglePageView && (
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-gradient-to-r from-slate-300/25 via-slate-400/30 to-slate-300/25 blur-lg" />
        )}
        <div className={["grid grid-cols-1 gap-3 lg:grid-cols-2", isFullscreen ? "h-full w-full gap-0" : ""].join(" ")}>
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
            mobileIncomingPage={isSinglePageView ? mobileTransition?.to ?? null : null}
            mobileTransitionDirection={isSinglePageView ? mobileTransition?.direction ?? null : null}
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
  onNavigateNext,
  onNavigatePrev,
}: BookPageProps) {
  const desktopFullscreenScale = isFullscreen && !isMobileView ? 1.4 : 1;
  const pageSurface = getPageSurfaceStyle(pageTone);

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
        scale={desktopFullscreenScale}
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
        "group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 p-2 shadow-sm transition hover:shadow-md",
        isFullscreen ? "h-full rounded-none border-0 p-0 shadow-none" : "",
        isMobileView ? "cursor-default" : isRightPage ? "cursor-e-resize" : "cursor-w-resize",
      ].join(" ")}
      style={!isFullscreen ? { backgroundColor: pageSurface.pageBodyColor } : undefined}
      onClick={(event) => {
        if (isMobileView) {
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
              ? "min-h-0 flex-1 items-center rounded-none border-0 p-0"
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

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
