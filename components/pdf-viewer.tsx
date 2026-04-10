"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileUrl: string;
  initialPage?: number;
  keyword?: string;
}

const WINDOW_SIZE = 8;

export function PDFViewer({ fileUrl, initialPage = 1, keyword = "" }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [renderWindow, setRenderWindow] = useState({ start: 1, end: WINDOW_SIZE });
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const normalizedKeyword = keyword.trim().toLowerCase();

  useEffect(() => {
    // Start the render window from the requested page so deep links land exactly.
    setRenderWindow({
      start: Math.max(1, initialPage),
      end: Math.max(WINDOW_SIZE, initialPage + WINDOW_SIZE - 1),
    });
    pageRefs.current.clear();
  }, [initialPage]);

  useEffect(() => {
    if (initialPage < renderWindow.start || initialPage > renderWindow.end) {
      return;
    }

    let attempts = 0;
    let rafId = 0;

    const tryScroll = () => {
      const pageElement = pageRefs.current.get(initialPage);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      attempts += 1;
      if (attempts < 12) {
        rafId = window.requestAnimationFrame(tryScroll);
      }
    };

    rafId = window.requestAnimationFrame(tryScroll);
    return () => window.cancelAnimationFrame(rafId);
  }, [initialPage, renderWindow.start, renderWindow.end, numPages]);

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

  return (
    <div className="space-y-3">
      <Document file={fileUrl} onLoadSuccess={({ numPages: pages }) => setNumPages(pages)} loading={<p>Loading PDF...</p>}>
        {pagesToRender.map((pageNumber) => (
          <div
            key={pageNumber}
            ref={(element) => {
              if (element) pageRefs.current.set(pageNumber, element);
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

      {numPages > renderWindow.end && (
        <button
          onClick={() =>
            setRenderWindow((prev) => ({
              start: prev.start,
              end: Math.min(numPages, prev.end + WINDOW_SIZE),
            }))
          }
          className="rounded-md bg-slate-900 px-3 py-2 text-xs text-white hover:bg-slate-700"
        >
          Load more pages
        </button>
      )}
    </div>
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
