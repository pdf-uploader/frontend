"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  activePage?: number;
  keyword?: string;
  onCurrentPageChange?: (page: number) => void;
  onNumPagesChange?: (total: number) => void;
  bookmarkedPages?: number[];
}

export function PDFViewer({
  fileUrl,
  activePage = 1,
  keyword = "",
  onCurrentPageChange,
  onNumPagesChange,
  bookmarkedPages = [],
}: PDFViewerProps) {
  const MOBILE_BREAKPOINT = 1024;
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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const flipTimerRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const bookmarkedSet = useMemo(() => new Set(bookmarkedPages), [bookmarkedPages]);
  const FLIP_DURATION = 460;
  const isMobileView = viewportWidth > 0 && viewportWidth < MOBILE_BREAKPOINT;
  const effectiveDesktopLeftPage = toSpreadStart(currentPage);
  const leftPage = isMobileView ? currentPage : effectiveDesktopLeftPage;
  const rightPage = !isMobileView && effectiveDesktopLeftPage + 1 <= numPages ? effectiveDesktopLeftPage + 1 : null;
  const pageWidth = isMobileView
    ? clampNumber(Math.floor(viewportWidth - 56), 240, MOBILE_PAGE_MAX_WIDTH)
    : BOOK_PAGE_WIDTH;

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
    const updateViewportWidth = () => {
      if (!viewportRef.current) {
        return;
      }
      setViewportWidth(viewportRef.current.clientWidth);
    };

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, []);

  const canFlipNext = isMobileView ? currentPage < numPages : effectiveDesktopLeftPage + 2 <= numPages;
  const canFlipPrev = isMobileView ? currentPage > 1 : effectiveDesktopLeftPage > 1;

  const goToNextSpread = () => {
    if (!canFlipNext || flipDirection) {
      return;
    }
    setFlipDirection("next");
    if (isMobileView) {
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
    if (isMobileView) {
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

  return (
    <Document
      file={fileUrl}
      onLoadSuccess={({ numPages: pages }) => {
        setNumPages(pages);
        onNumPagesChange?.(pages);
      }}
      loading={<p className="text-sm text-slate-600">Loading PDF...</p>}
      className="space-y-4"
    >
      <div
        ref={viewportRef}
        className="relative mx-auto h-auto max-w-[1120px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-3 shadow-inner lg:h-[760px] lg:p-4"
        onWheel={(event) => {
          if (isMobileView) {
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
          if (!isMobileView) {
            return;
          }
          setTouchStartX(event.touches[0]?.clientX ?? null);
        }}
        onTouchEnd={(event) => {
          if (!isMobileView || touchStartX === null || flipDirection) {
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
        {!isMobileView && <div className="pointer-events-none absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-slate-300/70" />}
        {!isMobileView && (
          <div className="pointer-events-none absolute inset-y-4 left-1/2 w-10 -translate-x-1/2 bg-gradient-to-r from-slate-300/25 via-slate-400/30 to-slate-300/25 blur-lg" />
        )}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <BookPage
            pageNumber={leftPage}
            isBookmarked={bookmarkedSet.has(leftPage)}
            normalizedKeyword={normalizedKeyword}
            pageWidth={pageWidth}
            isMobileView={isMobileView}
            mobileIncomingPage={isMobileView ? mobileTransition?.to ?? null : null}
            mobileTransitionDirection={isMobileView ? mobileTransition?.direction ?? null : null}
            onNavigatePrev={goToPrevSpread}
            onNavigateNext={goToNextSpread}
          />
          {rightPage ? (
            <BookPage
              pageNumber={rightPage}
              isBookmarked={bookmarkedSet.has(rightPage)}
              normalizedKeyword={normalizedKeyword}
              pageWidth={pageWidth}
              isMobileView={isMobileView}
              onNavigatePrev={goToPrevSpread}
              onNavigateNext={goToNextSpread}
              isRightPage
            />
          ) : (
            <div className="hidden rounded-xl border border-dashed border-slate-300 bg-white/70 lg:block" />
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goToPrevSpread}
          disabled={!canFlipPrev || Boolean(flipDirection)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isMobileView ? "Previous page" : "Previous spread"}
        </button>
        <p className="text-xs text-slate-500">
          {isMobileView ? "Swipe left/right or use buttons to navigate pages" : "Scroll or click left/right page edges to flip"}
        </p>
        <button
          type="button"
          onClick={goToNextSpread}
          disabled={!canFlipNext || Boolean(flipDirection)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isMobileView ? "Next page" : "Next spread"}
        </button>
      </div>

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
  isBookmarked: boolean;
  pageWidth: number;
  isMobileView: boolean;
  isRightPage?: boolean;
  mobileIncomingPage?: number | null;
  mobileTransitionDirection?: "next" | "prev" | null;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
}

function BookPage({
  pageNumber,
  normalizedKeyword,
  isBookmarked,
  pageWidth,
  isMobileView,
  isRightPage = false,
  mobileIncomingPage = null,
  mobileTransitionDirection = null,
  onNavigateNext,
  onNavigatePrev,
}: BookPageProps) {
  const renderPdfPage = (pageToRender: number) => (
    <Page
      pageNumber={pageToRender}
      width={pageWidth}
      renderAnnotationLayer={false}
      renderTextLayer
      customTextRenderer={({ str }) => {
        if (!normalizedKeyword) {
          return str;
        }

        const lower = str.toLowerCase();
        if (!lower.includes(normalizedKeyword)) {
          return str;
        }

        const regex = new RegExp(`(${escapeRegExp(normalizedKeyword)})`, "gi");
        return str.replace(regex, '<mark style="background:#fde68a;padding:0 2px;">$1</mark>');
      }}
    />
  );

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md",
        isMobileView ? "cursor-default" : isRightPage ? "cursor-e-resize" : "cursor-w-resize",
      ].join(" ")}
      onClick={() => {
        if (isMobileView) {
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
      {isBookmarked && <BookmarkRibbon />}
      <p className="mb-2 px-1 text-xs font-medium text-slate-500">Page {pageNumber}</p>
      <div
        className={[
          "relative flex items-start justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50",
          isMobileView ? "min-h-[56vh] p-2" : "h-[700px]",
        ].join(" ")}
      >
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
                "absolute inset-2 z-20 flex items-start justify-center rounded-md bg-slate-50",
                mobileTransitionDirection === "next"
                  ? "animate-[mobilePageSlideInNext_460ms_ease-in-out]"
                  : "animate-[mobilePageSlideInPrev_460ms_ease-in-out]",
              ].join(" ")}
            >
              {renderPdfPage(mobileIncomingPage)}
            </div>
          </>
        ) : (
          renderPdfPage(pageNumber)
        )}
      </div>
      <div
        className={[
          "pointer-events-none absolute inset-y-0 w-14 bg-gradient-to-r opacity-0 transition group-hover:opacity-100",
          isRightPage ? "right-0 from-transparent to-slate-300/30" : "left-0 from-slate-300/30 to-transparent",
        ].join(" ")}
      />
    </div>
  );
}

function BookmarkRibbon() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-0 z-10 h-12 w-5 -translate-x-1/2 bg-fuchsia-500 shadow-md"
      style={{ clipPath: "polygon(0 0,100% 0,100% 76%,50% 100%,0 76%)" }}
    />
  );
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
