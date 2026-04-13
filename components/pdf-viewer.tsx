"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  initialPage?: number;
  keyword?: string;
  onCurrentPageChange?: (page: number) => void;
}

const WINDOW_SIZE = 8;

export function PDFViewer({ fileUrl, initialPage = 1, keyword = "", onCurrentPageChange }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [renderWindow, setRenderWindow] = useState({
    start: Math.max(1, initialPage - 1),
    end: Math.max(WINDOW_SIZE, initialPage + WINDOW_SIZE - 1),
  });
  const [jumpCompleted, setJumpCompleted] = useState(initialPage === 1);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hasJumpedRef = useRef(false);
  const pageObserverRef = useRef<IntersectionObserver | null>(null);
  const normalizedKeyword = keyword.trim().toLowerCase();

  useEffect(() => {
    // Render around the target page first for reliable teleport.
    setRenderWindow({
      start: Math.max(1, initialPage - 1),
      end: Math.max(WINDOW_SIZE, initialPage + WINDOW_SIZE - 1),
    });
    hasJumpedRef.current = false;
    setJumpCompleted(initialPage === 1);
  }, [initialPage]);

  useEffect(() => {
    if (initialPage < renderWindow.start || initialPage > renderWindow.end || hasJumpedRef.current) {
      return;
    }

    let attempts = 0;
    let timerId: number | null = null;
    const MAX_ATTEMPTS = 120;

    const tryScroll = () => {
      const pageElement = pageRefs.current.get(initialPage);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: "auto", block: "start" });
        hasJumpedRef.current = true;
        setJumpCompleted(true);
        return;
      }
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) {
        // Rendering many pages can take time; keep trying until target page mounts.
        timerId = window.setTimeout(tryScroll, 75);
      }
    };

    timerId = window.setTimeout(tryScroll, 0);
    return () => {
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [initialPage, renderWindow.start, renderWindow.end, numPages]);

  useEffect(() => {
    if (pageObserverRef.current) {
      pageObserverRef.current.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => ({
            page: Number((entry.target as HTMLElement).dataset.pageNumber ?? "0"),
            ratio: entry.intersectionRatio,
          }))
          .filter((entry) => entry.page > 0)
          .sort((a, b) => b.ratio - a.ratio);

        if (visible.length && onCurrentPageChange) {
          onCurrentPageChange(visible[0].page);
        }
      },
      { threshold: [0.25, 0.5, 0.75] }
    );

    pageRefs.current.forEach((element) => observer.observe(element));
    pageObserverRef.current = observer;

    return () => observer.disconnect();
  }, [onCurrentPageChange, renderWindow.start, renderWindow.end, numPages]);

  const pagesToRender = useMemo(() => {
    if (!numPages) {
      return [];
    }
    const list: number[] = [];
    for (let i = renderWindow.start; i <= Math.min(renderWindow.end, numPages); i += 1) {
      list.push(i);
    }
    return list;
  }, [numPages, renderWindow]);

  useEffect(() => {
    if (!numPages || !jumpCompleted || !topSentinelRef.current || !sentinelRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (entry.target === topSentinelRef.current) {
            setRenderWindow((prev) => {
              if (prev.start <= 1) {
                return prev;
              }
              return {
                start: Math.max(1, prev.start - WINDOW_SIZE),
                end: prev.end,
              };
            });
          }

          if (entry.target === sentinelRef.current) {
            setRenderWindow((prev) => {
              if (prev.end >= numPages) {
                return prev;
              }
              return {
                start: prev.start,
                end: Math.min(numPages, prev.end + WINDOW_SIZE),
              };
            });
          }
        });
      },
      { root: null, rootMargin: "400px", threshold: 0.1 }
    );

    observer.observe(topSentinelRef.current);
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [numPages, renderWindow.start, renderWindow.end, jumpCompleted]);

  return (
    <div className="space-y-3">
      {renderWindow.start > 1 && <div ref={topSentinelRef} className="h-8 w-full" />}
      <Document file={fileUrl} onLoadSuccess={({ numPages: pages }) => setNumPages(pages)} loading={<p>Loading PDF...</p>}>
        {pagesToRender.map((pageNumber) => (
          <div
            key={pageNumber}
            ref={(element) => {
              if (element) {
                element.dataset.pageNumber = String(pageNumber);
                pageRefs.current.set(pageNumber, element);
              }
            }}
            className="rounded-lg border border-slate-200 bg-white p-2"
          >
            <p className="mb-2 text-xs text-slate-500">Page {pageNumber}</p>
            <Page
              pageNumber={pageNumber}
              width={860}
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
        ))}
      </Document>

      {numPages > renderWindow.end && <div ref={sentinelRef} className="h-8 w-full" />}
    </div>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
