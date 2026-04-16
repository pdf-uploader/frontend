"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api";
import { FileDetails } from "@/lib/types";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

const PDFViewer = dynamic(() => import("@/components/pdf-viewer").then((mod) => mod.PDFViewer), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-600">Loading PDF viewer...</p>,
});

export default function FileViewerPage() {
  const params = useParams<{ fileId: string }>();
  const searchParams = useSearchParams();
  const fileId = params.fileId;
  const keyword = searchParams.get("keyword") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const initialPage = Number.isFinite(page) && page > 0 ? page : 1;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [bookmarkedPages, setBookmarkedPages] = useState<number[]>([]);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [isPseudoFullscreen, setIsPseudoFullscreen] = useState(false);
  const viewerSectionRef = useRef<HTMLElement | null>(null);
  const isFullscreen = isNativeFullscreen || isPseudoFullscreen;

  const fileQuery = useQuery({
    queryKey: ["file", fileId],
    queryFn: async () => (await api.get<FileDetails>(`/files/${fileId}`)).data,
    enabled: Boolean(fileId),
  });

  const pdfBlobQuery = useQuery({
    queryKey: ["file-pdf", fileId],
    queryFn: async () => (await api.get<Blob>(`/files/pdf/${fileId}`, { responseType: "blob" })).data,
    enabled: Boolean(fileId),
  });

  useEffect(() => {
    if (!pdfBlobQuery.data) {
      setBlobUrl(null);
      return;
    }

    const url = URL.createObjectURL(pdfBlobQuery.data);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfBlobQuery.data]);

  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  useEffect(() => {
    const bookmarkKey = getBookmarkStorageKey(fileId);
    const rawBookmarks = window.localStorage.getItem(bookmarkKey);
    if (!rawBookmarks) {
      setBookmarkedPages([]);
      return;
    }
    try {
      const parsed = JSON.parse(rawBookmarks);
      if (!Array.isArray(parsed)) {
        setBookmarkedPages([]);
        return;
      }
      const normalized = parsed
        .filter((item): item is number => typeof item === "number" && Number.isFinite(item) && item > 0)
        .sort((a, b) => a - b);
      setBookmarkedPages(Array.from(new Set(normalized)));
    } catch {
      setBookmarkedPages([]);
    }
  }, [fileId]);

  useEffect(() => {
    window.localStorage.setItem(getBookmarkStorageKey(fileId), JSON.stringify(bookmarkedPages));
  }, [bookmarkedPages, fileId]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const inFullscreen = document.fullscreenElement === viewerSectionRef.current;
      setIsNativeFullscreen(inFullscreen);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (isPseudoFullscreen) {
        setIsPseudoFullscreen(false);
        return;
      }
      if (document.fullscreenElement) {
        void document.exitFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isPseudoFullscreen]);

  useEffect(() => {
    if (!isPseudoFullscreen) {
      return;
    }
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isPseudoFullscreen]);

  const displayFilename = useMemo(
    () => fileQuery.data?.filename || `file-${fileId}.pdf`,
    [fileQuery.data?.filename, fileId]
  );

  if (fileQuery.isLoading || pdfBlobQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading file...</p>;
  }

  if (fileQuery.error || pdfBlobQuery.error || !fileQuery.data || !pdfBlobQuery.data) {
    const backendError = extractBackendError(fileQuery.error ?? pdfBlobQuery.error);
    return (
      <section className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50 p-7 shadow-sm">
        <p className="mb-2 inline-flex rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
          Unable to open PDF
        </p>
        <h1 className="text-xl font-semibold text-slate-900">File viewer failed to load</h1>
        <p className="mt-3 rounded-xl border border-rose-100 bg-white/80 p-4 text-sm leading-6 text-slate-700">
          {backendError || "The backend did not return a readable error message. Please try again."}
        </p>
        <div className="mt-5 flex items-center gap-3">
          <Link href="/" className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700">
            Back to library
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  const onDownload = () => {
    const downloadUrl = URL.createObjectURL(pdfBlobQuery.data);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = displayFilename.endsWith(".pdf") ? displayFilename : `${displayFilename}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const toggleBookmark = (page: number) => {
    setBookmarkedPages((prev) => {
      if (prev.includes(page)) {
        return prev.filter((item) => item !== page);
      }
      return [...prev, page].sort((a, b) => a - b);
    });
  };

  const isCurrentPageBookmarked = bookmarkedPages.includes(currentPage);

  const toggleFullscreen = async () => {
    if (!viewerSectionRef.current) {
      return;
    }
    if (isPseudoFullscreen) {
      setIsPseudoFullscreen(false);
      return;
    }
    if (document.fullscreenElement === viewerSectionRef.current) {
      await document.exitFullscreen();
      return;
    }
    const canUseNativeFullscreen =
      typeof viewerSectionRef.current.requestFullscreen === "function" && typeof document.exitFullscreen === "function";
    if (canUseNativeFullscreen) {
      try {
        await viewerSectionRef.current.requestFullscreen();
        return;
      } catch {
        // Fall back to pseudo fullscreen for browsers like iPhone Safari.
      }
    }
    setIsPseudoFullscreen(true);
  };

  return (
    <section
      ref={viewerSectionRef}
      className={[
        "space-y-4",
        isPseudoFullscreen ? "fixed inset-0 z-50 flex h-[100dvh] overflow-hidden bg-slate-950 text-white" : "",
        isNativeFullscreen && !isPseudoFullscreen ? "flex h-screen overflow-hidden bg-slate-950 text-white" : "",
      ].join(" ")}
    >
      <div
        className={[
          "rounded-xl border p-3 shadow-sm sm:p-4",
          isFullscreen
            ? "relative flex h-full w-full flex-col border-0 bg-slate-950 p-0 shadow-none"
            : "border-slate-200 bg-white",
        ].join(" ")}
      >
        <div
          className={[
            isFullscreen
              ? "absolute left-2 right-2 top-2 z-20 flex items-center justify-end gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 p-1.5 backdrop-blur sm:left-4 sm:right-4 sm:justify-between"
              : "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          ].join(" ")}
        >
          <div className={["min-w-0 space-y-1", isFullscreen ? "hidden" : ""].join(" ")}>
            <Link href="/" className={["inline-flex text-xs font-medium hover:underline", isFullscreen ? "text-blue-300" : "text-blue-700"].join(" ")}>
              ← Back to library
            </Link>
            <h1 className={["truncate text-base font-semibold sm:text-lg", isFullscreen ? "text-white max-w-[78vw] text-sm sm:max-w-[60vw] sm:text-base" : "text-slate-900"].join(" ")}>{displayFilename}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isFullscreen && (
              <button
                type="button"
                onClick={() => toggleBookmark(currentPage)}
                className={[
                  "rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition",
                  isCurrentPageBookmarked
                    ? "bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                    : "border border-slate-500 bg-slate-800 text-white hover:bg-slate-700",
                ].join(" ")}
              >
                {isCurrentPageBookmarked ? "Bookmarked" : "Bookmark"}
              </button>
            )}
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className={[
                "rounded-md px-3 py-2 text-xs font-medium",
                isFullscreen ? "border border-slate-500 bg-slate-800 text-white hover:bg-slate-700 sm:px-2.5 sm:py-1.5 sm:text-[11px]" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </button>
            <button
              onClick={onDownload}
              className={[
                "rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700",
                isFullscreen ? "hidden" : "",
              ].join(" ")}
            >
              Download PDF
            </button>
          </div>
        </div>
        {!isFullscreen && (
          <div
            className={[
              "mb-4 flex flex-col gap-3 rounded-xl border px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4",
              "border-slate-200 bg-gradient-to-r from-white to-slate-50",
            ].join(" ")}
          >
            <div className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
              <p className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                Page {currentPage} / {totalPages || "—"}
              </p>
              {keyword && (
                <p className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs text-slate-700">
                  Keyword highlight: <span className="font-semibold">{keyword}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleBookmark(currentPage)}
                className={[
                  "rounded-lg px-3 py-2 text-xs font-semibold transition",
                  isCurrentPageBookmarked
                    ? "bg-fuchsia-600 text-white hover:bg-fuchsia-500"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {isCurrentPageBookmarked ? "Remove bookmark" : "Bookmark this page"}
              </button>
            </div>
          </div>
        )}

        {!isFullscreen && bookmarkedPages.length > 0 && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Bookmarks</p>
            <div className="flex flex-wrap gap-2">
              {bookmarkedPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={[
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    page === currentPage
                      ? "border-fuchsia-300 bg-fuchsia-100 text-fuchsia-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  Page {page}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className={[
            "rounded-xl border border-slate-200 bg-slate-100 p-2 sm:p-4",
            isFullscreen ? "flex min-h-0 flex-1 rounded-none border-0 bg-slate-950 p-0 pt-[52px]" : "min-h-[58vh] sm:min-h-[70vh]",
          ].join(" ")}
        >
          {blobUrl && (
            <PDFViewer
              fileUrl={blobUrl}
              activePage={currentPage}
              keyword={keyword}
              isFullscreen={isFullscreen}
              onCurrentPageChange={setCurrentPage}
              onNumPagesChange={setTotalPages}
              bookmarkedPages={bookmarkedPages}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function extractBackendError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | string | undefined;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
    }
    return error.message || "Backend request failed.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error.";
}

function getBookmarkStorageKey(fileId: string): string {
  return `bookmarks:${fileId}`;
}
