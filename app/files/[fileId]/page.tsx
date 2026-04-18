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

type BookmarkColorId = "silver" | "sand" | "ice" | "sage";
type PageToneId = "white" | "ivory" | "mist";
type CoverToneId = "slate" | "stone" | "forest";
type PopoverPanelId = "bookmark" | "settings" | null;

const BOOKMARK_COLOR_OPTIONS: Array<{ id: BookmarkColorId; label: string; swatch: string }> = [
  { id: "silver", label: "Silver", swatch: "#dfe1e5" },
  { id: "sand", label: "Sand", swatch: "#e8dfd2" },
  { id: "ice", label: "Ice", swatch: "#d7e4ec" },
  { id: "sage", label: "Sage", swatch: "#e2e7dc" },
];

const PAGE_TONE_OPTIONS: Array<{ id: PageToneId; label: string; swatch: string }> = [
  { id: "white", label: "White", swatch: "#ffffff" },
  { id: "ivory", label: "Ivory", swatch: "#f8f2e6" },
  { id: "mist", label: "Mist", swatch: "#f2f5fb" },
];

const COVER_TONE_OPTIONS: Array<{ id: CoverToneId; label: string; swatch: string }> = [
  { id: "slate", label: "Slate", swatch: "#e2e8f0" },
  { id: "stone", label: "Stone", swatch: "#e7ddd2" },
  { id: "forest", label: "Forest", swatch: "#dbe5d8" },
];

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
  const [bookmarkColor, setBookmarkColor] = useState<BookmarkColorId>("silver");
  const [pageTone, setPageTone] = useState<PageToneId>("white");
  const [coverTone, setCoverTone] = useState<CoverToneId>("slate");
  const [hoveredPanel, setHoveredPanel] = useState<PopoverPanelId>(null);
  const [pinnedPanel, setPinnedPanel] = useState<PopoverPanelId>(null);
  const [showFullscreenMenu, setShowFullscreenMenu] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [visiblePages, setVisiblePages] = useState<number[]>([]);
  const [bookmarkTargetPage, setBookmarkTargetPage] = useState<number | null>(null);
  const viewerSectionRef = useRef<HTMLElement | null>(null);
  const lastTapTimeRef = useRef(0);
  const hideFullscreenMenuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const storedColor = window.localStorage.getItem(getBookmarkColorStorageKey(fileId));
    if (!storedColor || !isBookmarkColorId(storedColor)) {
      setBookmarkColor("silver");
      return;
    }
    setBookmarkColor(storedColor);
  }, [fileId]);

  useEffect(() => {
    window.localStorage.setItem(getBookmarkColorStorageKey(fileId), bookmarkColor);
  }, [bookmarkColor, fileId]);

  useEffect(() => {
    const storedPageTone = window.localStorage.getItem(getPageToneStorageKey(fileId));
    if (!storedPageTone || !isPageToneId(storedPageTone)) {
      setPageTone("white");
      return;
    }
    setPageTone(storedPageTone);
  }, [fileId]);

  useEffect(() => {
    window.localStorage.setItem(getPageToneStorageKey(fileId), pageTone);
  }, [fileId, pageTone]);

  useEffect(() => {
    const storedCoverTone = window.localStorage.getItem(getCoverToneStorageKey(fileId));
    if (!storedCoverTone || !isCoverToneId(storedCoverTone)) {
      setCoverTone("slate");
      return;
    }
    setCoverTone(storedCoverTone);
  }, [fileId]);

  useEffect(() => {
    window.localStorage.setItem(getCoverToneStorageKey(fileId), coverTone);
  }, [coverTone, fileId]);

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

  useEffect(() => {
    if (!visiblePages.length) {
      setBookmarkTargetPage(null);
      return;
    }

    setBookmarkTargetPage((previous) => {
      if (previous && visiblePages.includes(previous)) {
        return previous;
      }
      return visiblePages[0];
    });
  }, [visiblePages]);

  useEffect(() => {
    setHoveredPanel(null);
    setPinnedPanel(null);
    setShowFullscreenMenu(false);
  }, [isFullscreen]);

  useEffect(() => {
    setIsCoarsePointer(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    return () => {
      if (hideFullscreenMenuTimerRef.current) {
        clearTimeout(hideFullscreenMenuTimerRef.current);
      }
    };
  }, []);

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

  const selectedBookmarkPage = bookmarkTargetPage ?? currentPage;
  const isSelectedPageBookmarked = bookmarkedPages.includes(selectedBookmarkPage);
  const canChooseBookmarkPage = visiblePages.length > 0;
  const bookmarkButtonLabel = "Bookmark";
  const bookmarkButtonStyle = getBookmarkButtonStyle(bookmarkColor, isSelectedPageBookmarked);
  const showBookmarkPagePicker = (hoveredPanel === "bookmark" || pinnedPanel === "bookmark") && canChooseBookmarkPage;
  const showBookmarkSettings = hoveredPanel === "settings" || pinnedPanel === "settings";

  const onBookmarkPrimaryAction = () => {
    setPinnedPanel((previous) => (previous === "bookmark" ? null : "bookmark"));
  };

  const onChooseBookmarkPage = (pageNumber: number) => {
    setBookmarkTargetPage(pageNumber);
    toggleBookmark(pageNumber);
  };

  const onToggleSettings = () => {
    setPinnedPanel((previous) => (previous === "settings" ? null : "settings"));
  };

  const revealFullscreenMenuTemporarily = () => {
    setShowFullscreenMenu(true);
    if (hideFullscreenMenuTimerRef.current) {
      clearTimeout(hideFullscreenMenuTimerRef.current);
    }
    hideFullscreenMenuTimerRef.current = setTimeout(() => {
      setShowFullscreenMenu(false);
    }, 3200);
  };

  const onFullscreenSurfaceDoubleActivate = () => {
    if (!isFullscreen) {
      return;
    }
    revealFullscreenMenuTemporarily();
  };

  const onFullscreenTouchEndCapture = () => {
    if (!isFullscreen || !isCoarsePointer) {
      return;
    }

    const now = Date.now();
    if (now - lastTapTimeRef.current < 320) {
      lastTapTimeRef.current = 0;
      onFullscreenSurfaceDoubleActivate();
      return;
    }
    lastTapTimeRef.current = now;
  };

  return (
    <section
      ref={viewerSectionRef}
      onDoubleClick={onFullscreenSurfaceDoubleActivate}
      onTouchEndCapture={onFullscreenTouchEndCapture}
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
        {isFullscreen ? (
          <>
            <div className="peer absolute inset-x-0 top-0 z-20 h-16" />
            <div
              className={[
                "absolute left-1/2 top-2 z-30 flex w-max -translate-x-1/2 -translate-y-3 flex-col items-center gap-2 transition-all duration-200 peer-hover:pointer-events-auto peer-hover:translate-y-0 peer-hover:opacity-100 hover:pointer-events-auto hover:translate-y-0 hover:opacity-100",
                showFullscreenMenu
                  ? "pointer-events-auto translate-y-0 opacity-100"
                  : "pointer-events-none opacity-0",
              ].join(" ")}
            >
              <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 p-1.5 backdrop-blur">
                <div
                  className="relative"
                  onMouseEnter={() => setHoveredPanel("bookmark")}
                  onMouseLeave={() => setHoveredPanel((previous) => (previous === "bookmark" ? null : previous))}
                >
                  <button
                    type="button"
                    onClick={onBookmarkPrimaryAction}
                    className="rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition"
                    style={bookmarkButtonStyle}
                  >
                    {bookmarkButtonLabel}
                  </button>
                  {showBookmarkPagePicker && canChooseBookmarkPage && (
                    <div className="absolute left-1/2 top-[calc(100%+8px)] z-40 flex -translate-x-1/2 items-center gap-1 rounded-md border border-slate-600 bg-slate-900/95 p-1.5 shadow-xl backdrop-blur">
                      {visiblePages.map((pageNumber) => {
                        const selected = selectedBookmarkPage === pageNumber;
                        const alreadyBookmarked = bookmarkedPages.includes(pageNumber);
                        return (
                          <button
                            key={`bookmark-target-fullscreen-${pageNumber}`}
                            type="button"
                            onClick={() => onChooseBookmarkPage(pageNumber)}
                            className={[
                              "rounded px-2 py-1 text-[11px] font-medium transition",
                              selected ? "bg-slate-100 text-slate-900" : "text-slate-100 hover:bg-slate-700",
                            ].join(" ")}
                          >
                            {alreadyBookmarked ? `Page ${pageNumber} ✓` : `Page ${pageNumber}`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="rounded-md border border-slate-500 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-slate-700"
                >
                  Exit full screen
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <Link href="/" className="inline-flex text-xs font-medium text-blue-700 hover:underline">
                ← Back to library
              </Link>
              <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{displayFilename}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Full screen
              </button>
              <button
                onClick={onDownload}
                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        )}
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
              <div
                className="relative"
                onMouseEnter={() => setHoveredPanel("bookmark")}
                onMouseLeave={() => setHoveredPanel((previous) => (previous === "bookmark" ? null : previous))}
              >
                <button
                  type="button"
                  onClick={onBookmarkPrimaryAction}
                  className="rounded-lg px-3 py-2 text-xs font-semibold transition"
                  style={bookmarkButtonStyle}
                >
                  {bookmarkButtonLabel}
                </button>
                {showBookmarkPagePicker && canChooseBookmarkPage && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-1 shadow-lg">
                    {visiblePages.map((pageNumber) => {
                      const selected = selectedBookmarkPage === pageNumber;
                      const alreadyBookmarked = bookmarkedPages.includes(pageNumber);
                      return (
                        <button
                          key={`bookmark-target-default-${pageNumber}`}
                          type="button"
                          onClick={() => onChooseBookmarkPage(pageNumber)}
                          className={[
                            "rounded-md px-2 py-1 text-xs font-medium transition",
                            selected ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
                          ].join(" ")}
                        >
                          {alreadyBookmarked ? `Page ${pageNumber} ✓` : `Page ${pageNumber}`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div
                className="relative"
                onMouseEnter={() => setHoveredPanel("settings")}
                onMouseLeave={() => setHoveredPanel((previous) => (previous === "settings" ? null : previous))}
              >
                <button
                  type="button"
                  aria-label="Bookmark settings"
                  title="Bookmark settings"
                  onClick={onToggleSettings}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-base text-slate-700 transition hover:bg-slate-50"
                >
                  ⚙
                </button>
                {showBookmarkSettings && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-72 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Bookmark color</p>
                    <div className="grid grid-cols-2 gap-2">
                      {BOOKMARK_COLOR_OPTIONS.map((option) => {
                        const selected = bookmarkColor === option.id;
                        return (
                          <button
                            key={`bookmark-color-default-${option.id}`}
                            type="button"
                            onClick={() => setBookmarkColor(option.id)}
                            className={[
                              "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs transition",
                              selected
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <span className="inline-flex h-4 w-4 rounded-full border border-slate-300" style={{ backgroundColor: option.swatch }} />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Page color</p>
                    <div className="grid grid-cols-3 gap-2">
                      {PAGE_TONE_OPTIONS.map((option) => {
                        const selected = pageTone === option.id;
                        return (
                          <button
                            key={`page-tone-default-${option.id}`}
                            type="button"
                            onClick={() => setPageTone(option.id)}
                            className={[
                              "flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-[11px] transition",
                              selected
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <span className="inline-flex h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: option.swatch }} />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Book cover color</p>
                    <div className="grid grid-cols-3 gap-2">
                      {COVER_TONE_OPTIONS.map((option) => {
                        const selected = coverTone === option.id;
                        return (
                          <button
                            key={`cover-tone-default-${option.id}`}
                            type="button"
                            onClick={() => setCoverTone(option.id)}
                            className={[
                              "flex items-center justify-center gap-2 rounded-md border px-2 py-1.5 text-[11px] transition",
                              selected
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <span className="inline-flex h-3.5 w-3.5 rounded-full border border-slate-300" style={{ backgroundColor: option.swatch }} />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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
                  className="rounded-full border px-3 py-1 text-xs font-medium transition hover:brightness-95"
                  style={getBookmarkChipStyle(bookmarkColor, page === currentPage)}
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
            isFullscreen ? "flex min-h-0 flex-1 rounded-none border-0 bg-slate-950 p-0" : "min-h-[58vh] sm:min-h-[70vh]",
          ].join(" ")}
        >
          {blobUrl && (
            <PDFViewer
              fileUrl={blobUrl}
              activePage={currentPage}
              keyword={keyword}
              bookmarkColor={bookmarkColor}
              pageTone={pageTone}
              coverTone={coverTone}
              isFullscreen={isFullscreen}
              onCurrentPageChange={setCurrentPage}
              onNumPagesChange={setTotalPages}
              onVisiblePagesChange={setVisiblePages}
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

function getBookmarkColorStorageKey(fileId: string): string {
  return `bookmarkColor:${fileId}`;
}

function getPageToneStorageKey(fileId: string): string {
  return `pageTone:${fileId}`;
}

function getCoverToneStorageKey(fileId: string): string {
  return `coverTone:${fileId}`;
}

function isBookmarkColorId(value: string): value is BookmarkColorId {
  return BOOKMARK_COLOR_OPTIONS.some((option) => option.id === value);
}

function isPageToneId(value: string): value is PageToneId {
  return PAGE_TONE_OPTIONS.some((option) => option.id === value);
}

function isCoverToneId(value: string): value is CoverToneId {
  return COVER_TONE_OPTIONS.some((option) => option.id === value);
}

function getBookmarkButtonStyle(
  color: BookmarkColorId,
  isBookmarked: boolean
): { border: string; backgroundColor: string; color: string } {
  if (!isBookmarked) {
    return {
      border: "1px solid #cbd5e1",
      backgroundColor: "#ffffff",
      color: "#334155",
    };
  }

  const tone = {
    silver: { background: "#e2e3e6", text: "#3a4458", border: "#c5c8cf" },
    sand: { background: "#ece5db", text: "#6f5a43", border: "#d4c7b7" },
    ice: { background: "#dbe7ef", text: "#43627b", border: "#bfcfda" },
    sage: { background: "#e4e8df", text: "#476046", border: "#c8d0c3" },
  }[color];

  return {
    border: `1px solid ${tone.border}`,
    backgroundColor: tone.background,
    color: tone.text,
  };
}

function getBookmarkChipStyle(color: BookmarkColorId, isActive: boolean): {
  borderColor: string;
  backgroundColor: string;
  color: string;
} {
  const palette = {
    silver: { active: "#eef0f4", border: "#c5c8cf", text: "#3a4458" },
    sand: { active: "#f4eee6", border: "#d6cabd", text: "#6f5a43" },
    ice: { active: "#eaf2f7", border: "#bfd0dc", text: "#43627b" },
    sage: { active: "#edf2e9", border: "#c8d1c0", text: "#476046" },
  }[color];

  if (isActive) {
    return {
      borderColor: palette.border,
      backgroundColor: palette.active,
      color: palette.text,
    };
  }

  return {
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    color: "#334155",
  };
}

