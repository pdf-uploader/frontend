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
  const BOOK_PAGE_WIDTH = 520;
  const BOOK_VIEWPORT_HEIGHT = 760;
  const [numPages, setNumPages] = useState(0);
  const [spreadStart, setSpreadStart] = useState(toSpreadStart(activePage));
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);
  const flipTimerRef = useRef<number | null>(null);
  const normalizedKeyword = keyword.trim().toLowerCase();
  const bookmarkedSet = useMemo(() => new Set(bookmarkedPages), [bookmarkedPages]);
  const leftPage = spreadStart;
  const rightPage = spreadStart + 1 <= numPages ? spreadStart + 1 : null;
  const FLIP_DURATION = 460;

  useEffect(() => {
    if (!numPages) {
      return;
    }
    const normalizedPage = clampPage(activePage, numPages);
    setSpreadStart(toSpreadStart(normalizedPage));
  }, [activePage, numPages]);

  useEffect(() => {
    if (!onCurrentPageChange) {
      return;
    }
    onCurrentPageChange(spreadStart);
  }, [spreadStart, onCurrentPageChange]);

  useEffect(() => {
    return () => {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
      }
    };
  }, []);

  const canFlipNext = rightPage !== null && rightPage < numPages;
  const canFlipPrev = leftPage > 1;

  const goToNextSpread = () => {
    if (!canFlipNext || flipDirection) {
      return;
    }
    setFlipDirection("next");
    flipTimerRef.current = window.setTimeout(() => {
      setSpreadStart((prev) => Math.min(Math.max(1, prev + 2), Math.max(1, numPages - (numPages % 2 === 0 ? 1 : 0))));
      setFlipDirection(null);
    }, FLIP_DURATION);
  };

  const goToPrevSpread = () => {
    if (!canFlipPrev || flipDirection) {
      return;
    }
    setFlipDirection("prev");
    flipTimerRef.current = window.setTimeout(() => {
      setSpreadStart((prev) => Math.max(1, prev - 2));
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
        className="relative mx-auto h-[760px] max-w-[1120px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-inner"
        onWheel={(event) => {
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
      >
        <div className="pointer-events-none absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-slate-300/70" />
        <div className="pointer-events-none absolute inset-y-4 left-1/2 w-10 -translate-x-1/2 bg-gradient-to-r from-slate-300/25 via-slate-400/30 to-slate-300/25 blur-lg" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <BookPage
            pageNumber={leftPage}
            isBookmarked={bookmarkedSet.has(leftPage)}
            normalizedKeyword={normalizedKeyword}
            pageWidth={BOOK_PAGE_WIDTH}
            pageViewportHeight={BOOK_VIEWPORT_HEIGHT}
            onNavigatePrev={goToPrevSpread}
            onNavigateNext={goToNextSpread}
          />
          {rightPage ? (
            <BookPage
              pageNumber={rightPage}
              isBookmarked={bookmarkedSet.has(rightPage)}
              normalizedKeyword={normalizedKeyword}
              pageWidth={BOOK_PAGE_WIDTH}
              pageViewportHeight={BOOK_VIEWPORT_HEIGHT}
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

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevSpread}
          disabled={!canFlipPrev || Boolean(flipDirection)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous spread
        </button>
        <p className="text-xs text-slate-500">Scroll or click left/right page edges to flip</p>
        <button
          type="button"
          onClick={goToNextSpread}
          disabled={!canFlipNext || Boolean(flipDirection)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next spread
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
      `}</style>
    </Document>
  );
}

interface BookPageProps {
  pageNumber: number;
  normalizedKeyword: string;
  isBookmarked: boolean;
  pageWidth: number;
  pageViewportHeight: number;
  isRightPage?: boolean;
  onNavigateNext: () => void;
  onNavigatePrev: () => void;
}

function BookPage({
  pageNumber,
  normalizedKeyword,
  isBookmarked,
  pageWidth,
  pageViewportHeight,
  isRightPage = false,
  onNavigateNext,
  onNavigatePrev,
}: BookPageProps) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition hover:shadow-md",
        isRightPage ? "cursor-e-resize" : "cursor-w-resize",
      ].join(" ")}
      onClick={isRightPage ? onNavigateNext : onNavigatePrev}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
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
      <div className="flex h-[700px] items-start justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        <Page
          pageNumber={pageNumber}
          width={pageWidth}
          height={pageViewportHeight}
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
