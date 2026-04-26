"use client";

import Link from "next/link";
import {
  ChangeEvent,
  DragEvent,
  Fragment,
  type RefObject,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import axios from "axios";
import { isAdminUser } from "@/lib/auth-user";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { Folder, FolderFile } from "@/lib/types";

interface FileVersionItem {
  id: string;
  filename: string;
  createdAt: string;
  content?: Array<{
    page: number;
    content: string;
  }>;
}

const PAGE_CHUNK_SIZE = 5;
type FileSortField = "filename" | "createdAt" | "number";
type SortDirection = "desc" | "asc";

type UploadUiPhase = "idle" | "uploading" | "done" | "error";

export default function FolderPage() {
  const params = useParams<{ folderId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderId = params.folderId;
  const { user } = useAuth();
  const admin = isAdminUser(user);
  const urlKeyword = searchParams.get("keyword") ?? "";
  const [folderSearch, setFolderSearch] = useState(urlKeyword);
  const [dragging, setDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [orderedFiles, setOrderedFiles] = useState<FolderFile[]>([]);
  const [fileSortField, setFileSortField] = useState<FileSortField | null>(null);
  const [fileSortDirection, setFileSortDirection] = useState<SortDirection>("desc");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadUi, setUploadUi] = useState<{
    phase: UploadUiPhase;
    percent: number;
    indeterminate: boolean;
    fileCount: number;
  }>({ phase: "idle", percent: 0, indeterminate: false, fileCount: 0 });
  const [debouncedFolderSearch] = useDebounce(folderSearch, 300);

  const folderQuery = useQuery({
    queryKey: ["folder", folderId],
    queryFn: async () => {
      try {
        return (await api.get<Folder>(`/folders/${folderId}`)).data;
      } catch {
        const folders = (await api.get<Folder[]>("/folders")).data;
        const matched = folders.find((folder) => folder.id === folderId);
        if (!matched) {
          throw new Error("Folder not found");
        }
        return matched;
      }
    },
    enabled: Boolean(folderId),
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("pdf", file));
      await api.post(`/files/upload/${folderId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          const total = event.total ?? 0;
          if (total > 0) {
            const percent = Math.min(100, Math.round((event.loaded / total) * 100));
            setUploadUi((previous) => ({
              ...previous,
              phase: "uploading",
              percent,
              indeterminate: false,
            }));
          }
        },
      });
    },
    onMutate: (files: File[]) => {
      setUploadUi({
        phase: "uploading",
        percent: 0,
        indeterminate: true,
        fileCount: files.length,
      });
    },
    onSuccess: () => {
      setUploadUi((previous) => ({
        ...previous,
        phase: "done",
        percent: 100,
        indeterminate: false,
      }));
      void folderQuery.refetch();
    },
    onError: () => {
      setUploadUi((previous) => ({
        ...previous,
        phase: "error",
        percent: 0,
        indeterminate: false,
      }));
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => api.delete(`/files/${fileId}`),
    onSuccess: (_, deletedFileId) => {
      setOrderedFiles((prev) => prev.filter((file) => file.id !== deletedFileId));
      folderQuery.refetch();
    },
  });

  const folderSearchQuery = useQuery({
    queryKey: ["folder-search", folderId, debouncedFolderSearch],
    queryFn: async () =>
      (await api.get<FileVersionItem[]>(`/folders/${folderId}/find`, { params: { keyword: debouncedFolderSearch } }))
        .data,
    enabled: debouncedFolderSearch.trim().length > 0,
  });

  const folder = folderQuery.data;
  const fileOrderSignature = folder?.files.map((file) => file.id).join("|") ?? "";
  const searchContextHref = (() => {
    const params = new URLSearchParams();
    const trimmed = folderSearch.trim();
    if (trimmed) {
      params.set("keyword", trimmed);
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  })();

  useEffect(() => {
    if (folder) {
      setOrderedFiles(folder.files);
    }
  }, [fileOrderSignature, folder]);

  useEffect(() => {
    setFolderSearch(urlKeyword);
  }, [urlKeyword]);

  useEffect(() => {
    if (uploadUi.phase !== "done") {
      return;
    }
    const timer = window.setTimeout(() => {
      setUploadUi({ phase: "idle", percent: 0, indeterminate: false, fileCount: 0 });
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [uploadUi.phase]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = debouncedFolderSearch.trim();
    if (trimmed) {
      params.set("keyword", trimmed);
    } else {
      params.delete("keyword");
    }

    const currentQuery = searchParams.toString();
    const nextQuery = params.toString();
    if (currentQuery === nextQuery) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [debouncedFolderSearch, pathname, router, searchParams]);

  const visibleFiles = useMemo(() => {
    if (!fileSortField) {
      return orderedFiles;
    }

    const sorted = [...orderedFiles];
    sorted.sort((a, b) => {
      if (fileSortField === "number") {
        const compared = compareVersionLikeFilename(a.filename, b.filename);
        return fileSortDirection === "desc" ? -compared : compared;
      }

      if (fileSortField === "filename") {
        const compared = a.filename.localeCompare(b.filename, "ko", { sensitivity: "base" });
        return fileSortDirection === "desc" ? -compared : compared;
      }

      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      const compared = left - right;
      return fileSortDirection === "desc" ? -compared : compared;
    });
    return sorted;
  }, [fileSortDirection, fileSortField, orderedFiles]);

  if (folderQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading folder...</p>;
  }

  if (folderQuery.error || !folder) {
    return <p className="text-sm text-red-600">Folder not found or unavailable.</p>;
  }

  const folderLocked = folder.lock === true;

  const onDropped = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    setDragCounter(0);
    if (!admin || folderLocked) return;
    const files = collectPdfFiles(event.dataTransfer.files);
    if (files.length) {
      uploadMutation.mutate(files);
    }
  };

  const onFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    if (!admin || folderLocked) return;
    const files = collectPdfFiles(event.target.files ?? []);
    if (files.length) {
      uploadMutation.mutate(files);
    }
    event.target.value = "";
  };

  const toggleFileSort = (field: FileSortField) => {
    if (fileSortField !== field) {
      setFileSortField(field);
      setFileSortDirection("desc");
      return;
    }
    setFileSortDirection((previous) => (previous === "desc" ? "asc" : "desc"));
  };

  return (
    <section
      className={`ui-shell space-y-5 ${dragging ? "rounded-2xl ring-2 ring-slate-300 ring-offset-2" : ""}`}
      onDragOver={(event) => {
        if (!admin || folderLocked) return;
        event.preventDefault();
      }}
      onDragEnter={(event) => {
        if (!admin || folderLocked) return;
        event.preventDefault();
        setDragCounter((prev) => prev + 1);
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!admin || folderLocked) return;
        event.preventDefault();
        setDragCounter((prev) => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            setDragging(false);
          }
          return next;
        });
      }}
      onDrop={(event) => {
        if (!admin || folderLocked) return;
        onDropped(event);
      }}
    >
      {admin && !folderLocked && dragging && (
        <div className="sticky top-20 z-10 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
          Drop files anywhere on this page to upload to this folder.
        </div>
      )}

      <div className="space-y-2">
        <Link href="/" className="ui-btn-back w-fit">
          Back to library
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {folderLocked ? "🔒" : "📁"} {folder.foldername}
          </h1>
          {folderLocked && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium uppercase text-amber-800">
              Locked
            </span>
          )}
        </div>
        {folderLocked && (
          <p className="max-w-2xl text-sm text-slate-600">
            This folder is locked. Uploads and file deletion are disabled until an admin unlocks it from the library
            home.
          </p>
        )}
      </div>

      <div className="ui-card p-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔍</span>
          <input
            value={folderSearch}
            onChange={(event) => setFolderSearch(event.target.value)}
            className="ui-search-input"
            placeholder="Search filename in this folder..."
          />
        </div>
        {folderSearchQuery.data && (
          <ul className="mt-2 space-y-2 text-sm">
            {folderSearchQuery.data.map((item) => (
              <FolderSearchItem
                key={item.id}
                item={item}
                keyword={debouncedFolderSearch}
                returnTo={encodeURIComponent(searchContextHref)}
              />
            ))}
            {!folderSearchQuery.data.length && <li className="text-xs text-slate-500">No matching files.</li>}
          </ul>
        )}
      </div>

      {admin && (
        <PdfUploadDropZone
          locked={folderLocked}
          fileInputRef={fileInputRef}
          uploadPhase={uploadUi.phase}
          uploadPercent={uploadUi.percent}
          uploadIndeterminate={uploadUi.indeterminate}
          uploadFileCount={uploadUi.fileCount}
          onFilePick={onFilePick}
          onUploadFiles={(files) => uploadMutation.mutate(files)}
        />
      )}

      <div className="ui-card-soft border-dashed p-4 text-sm">
        {admin ? (
          <div className="space-y-3">
            {!folderLocked && (
              <p className="text-xs text-slate-500">
                You can also drop PDF files anywhere on this page while viewing this folder.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
              <p className="mr-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sort</p>
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => toggleFileSort("filename")}
                  className={[
                    "rounded-full px-3 py-1.5 font-medium transition",
                    fileSortField === "filename"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900",
                  ].join(" ")}
                >
                  Filename {fileSortField === "filename" ? (fileSortDirection === "desc" ? "↓" : "↑") : ""}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFileSort("number")}
                  className={[
                    "rounded-full px-3 py-1.5 font-medium transition",
                    fileSortField === "number"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900",
                  ].join(" ")}
                >
                  Number {fileSortField === "number" ? (fileSortDirection === "desc" ? "↓" : "↑") : ""}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFileSort("createdAt")}
                  className={[
                    "rounded-full px-3 py-1.5 font-medium transition",
                    fileSortField === "createdAt"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-white hover:text-slate-900",
                  ].join(" ")}
                >
                  Created {fileSortField === "createdAt" ? (fileSortDirection === "desc" ? "↓" : "↑") : ""}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p>Files in this folder</p>
        )}
      </div>

      <ul className="ui-card space-y-2 p-3">
        {visibleFiles.map((file) => (
          <li
            key={file.id}
            className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm transition"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Link href={`/files/${file.id}`} className="truncate break-keep text-slate-700 hover:underline">
                📄 {file.filename}
              </Link>
            </div>
            {admin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => deleteFileMutation.mutate(file.id)}
                  className="rounded px-1 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  title={folderLocked ? "Folder is locked" : "Delete file"}
                  disabled={folderLocked}
                >
                  🗑
                </button>
              </div>
            )}
          </li>
        ))}
        {!orderedFiles.length && <li className="text-xs text-slate-500">No files in this folder yet.</li>}
      </ul>
    </section>
  );
}

function uploadFileCountLabel(count: number): string {
  if (count <= 0) {
    return "";
  }
  return count === 1 ? "1 file" : `${count} files`;
}

function collectPdfFiles(source: FileList | File[] | null | undefined): File[] {
  if (!source) {
    return [];
  }
  return Array.from(source).filter(
    (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function PdfUploadDropZone({
  locked,
  fileInputRef,
  uploadPhase,
  uploadPercent,
  uploadIndeterminate,
  uploadFileCount,
  onFilePick,
  onUploadFiles,
}: {
  locked: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploadPhase: UploadUiPhase;
  uploadPercent: number;
  uploadIndeterminate: boolean;
  uploadFileCount: number;
  onFilePick: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadFiles: (files: File[]) => void;
}) {
  const [active, setActive] = useState(false);
  const isUploading = uploadPhase === "uploading";

  if (locked) {
    return (
      <div
        className="ui-card-soft flex min-h-[52px] flex-col items-center justify-center border-2 border-dashed border-slate-200 px-4 py-2.5 text-center"
        aria-live="polite"
      >
        <p className="max-w-md text-xs text-slate-600 sm:text-sm">
          This folder is locked. Unlock it from the library home to upload PDFs.
        </p>
      </div>
    );
  }

  return (
    <div
      className={[
        "ui-card flex flex-col border-2 border-dashed px-3 py-2.5 text-center transition sm:px-4",
        active ? "border-sky-400 bg-sky-50/50 ring-2 ring-sky-200/60" : "border-slate-300/90 bg-white/95",
        isUploading ? "pointer-events-none opacity-95" : "",
      ].join(" ")}
      onDragEnter={(event) => {
        if (isUploading) return;
        event.preventDefault();
        event.stopPropagation();
        setActive(true);
      }}
      onDragOver={(event) => {
        if (isUploading) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        const next = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(next)) {
          setActive(false);
        }
      }}
      onDrop={(event) => {
        if (isUploading) return;
        event.preventDefault();
        event.stopPropagation();
        setActive(false);
        const files = collectPdfFiles(event.dataTransfer.files);
        if (files.length) {
          onUploadFiles(files);
        }
      }}
    >
      <div className="flex min-h-[4.5rem] flex-col items-stretch justify-center gap-2 sm:min-h-[4.25rem] sm:flex-row sm:items-center sm:gap-3 sm:text-left">
        <div
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-xl border border-slate-200 bg-slate-50 text-lg text-sky-500 sm:self-auto sm:text-xl"
          aria-hidden
        >
          📄
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">Upload PDF files</p>
          <p className="mt-0.5 max-w-xl text-[11px] leading-snug text-slate-600 sm:text-xs">
            Drag and drop PDFs here or choose files. Multiple files allowed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="ui-btn-primary mt-1 inline-flex w-full shrink-0 gap-2 py-2 text-xs sm:mt-0 sm:w-auto sm:py-2 sm:text-sm"
        >
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Choose files
        </button>
      </div>

      <div className="mt-3 w-full max-w-md px-0.5" aria-live="polite">
        {uploadPhase === "uploading" && (
          <div className="space-y-2 text-left">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
              {uploadIndeterminate ? (
                <div className="pdf-upload-indeterminate-bar h-full w-[38%] rounded-full bg-sky-500" />
              ) : (
                <div
                  className="h-full rounded-full bg-sky-500 transition-[width] duration-200 ease-out"
                  style={{ width: `${Math.max(2, uploadPercent)}%` }}
                />
              )}
            </div>
            <p className="text-center text-xs font-medium text-slate-600">
              {uploadFileCount > 0
                ? `Uploading ${uploadFileCountLabel(uploadFileCount)}${uploadIndeterminate ? "…" : ""}`
                : "Uploading…"}
              {!uploadIndeterminate && uploadPercent > 0 ? ` · ${uploadPercent}%` : ""}
            </p>
          </div>
        )}
        {uploadPhase === "done" && (
          <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-medium text-emerald-800">
            <div className="flex items-center justify-center gap-2">
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
                aria-hidden
              >
                ✓
              </span>
              Upload complete
            </div>
            {uploadFileCount > 0 && (
              <p className="text-xs font-normal text-emerald-700/90">
                {uploadFileCountLabel(uploadFileCount)} uploaded
              </p>
            )}
          </div>
        )}
        {uploadPhase === "error" && (
          <p className="rounded-xl border border-red-200 bg-red-50 py-2.5 text-center text-sm text-red-700">
            {uploadFileCount > 0
              ? `Upload failed (${uploadFileCountLabel(uploadFileCount)}). Please try again.`
              : "Upload failed. Please try again."}
          </p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={onFilePick}
        disabled={isUploading}
      />
      <style jsx>{`
        @keyframes pdf-upload-indeterminate-slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(350%);
          }
        }
        .pdf-upload-indeterminate-bar {
          animation: pdf-upload-indeterminate-slide 1.15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function compareVersionLikeFilename(leftFilename: string, rightFilename: string): number {
  const leftTokens = extractLeadingNumberTokens(leftFilename);
  const rightTokens = extractLeadingNumberTokens(rightFilename);
  const maxLength = Math.max(leftTokens.length, rightTokens.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftPart = leftTokens[index];
    const rightPart = rightTokens[index];

    if (leftPart === undefined && rightPart === undefined) {
      break;
    }
    if (leftPart === undefined) {
      return -1;
    }
    if (rightPart === undefined) {
      return 1;
    }
    if (leftPart !== rightPart) {
      return leftPart - rightPart;
    }
  }

  return leftFilename.localeCompare(rightFilename, "ko", { numeric: true, sensitivity: "base" });
}

function extractLeadingNumberTokens(filename: string): number[] {
  const matched = filename.trim().match(/^\d+(?:\.\d+)*/)?.[0];
  if (!matched) {
    return [];
  }
  return matched
    .split(".")
    .map((part) => Number(part))
    .filter((part) => Number.isFinite(part));
}

function FolderSearchItem({ item, keyword, returnTo }: { item: FileVersionItem; keyword: string; returnTo: string }) {
  const [pageChunk, setPageChunk] = useState(0);
  const pageEntries = Array.from(
    new Map(
      (item.content ?? []).map((entry) => [
        Math.max(1, entry.page + 1),
        {
          page: Math.max(1, entry.page + 1),
          snippet: extractSentencePreview(entry.content, keyword),
        },
      ])
    ).values()
  ).sort((a, b) => a.page - b.page);

  const totalChunks = Math.max(1, Math.ceil(pageEntries.length / PAGE_CHUNK_SIZE));
  const pageStart = pageChunk * PAGE_CHUNK_SIZE;
  const pagedEntries = pageEntries.slice(pageStart, pageStart + PAGE_CHUNK_SIZE);

  return (
    <li className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
      <Link href={`/files/${item.id}`} className="break-keep break-words text-base font-semibold text-slate-900 hover:underline sm:text-lg">
        {item.filename}
      </Link>
      {pagedEntries.length > 0 && (
        <div className="mt-2 space-y-2">
          <ul className="space-y-1 text-xs">
            {pagedEntries.map((entry) => (
              <li key={`${item.id}-${entry.page}`}>
                <Link
                  href={`/files/${item.id}?page=${entry.page}&keyword=${encodeURIComponent(keyword)}&returnTo=${returnTo}`}
                  className="block rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800 sm:text-base">Page {entry.page}</span>
                    <span className="text-[11px] text-slate-500">Open</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {highlightKeyword(entry.snippet, keyword)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {pageEntries.length > PAGE_CHUNK_SIZE && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setPageChunk((prev) => Math.max(0, prev - 1))}
                disabled={pageChunk === 0}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-slate-500">
                {pageChunk + 1} / {totalChunks}
              </span>
              <button
                onClick={() => setPageChunk((prev) => Math.min(totalChunks - 1, prev + 1))}
                disabled={pageChunk >= totalChunks - 1}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function highlightKeyword(text: string, keyword: string): ReactNode {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) {
    return text;
  }

  const escapedKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedKeyword})`, "gi");
  const segments = text.split(regex);

  return segments.map((segment, index) =>
    segment.toLowerCase() === trimmedKeyword.toLowerCase() ? (
      <mark key={`${segment}-${index}`} className="rounded bg-amber-200 px-0.5">
        {segment}
      </mark>
    ) : (
      <Fragment key={`${segment}-${index}`}>{segment}</Fragment>
    )
  );
}

function extractSentencePreview(content: string, keyword: string): string {
  const normalized = normalizePreviewText(content);
  if (!normalized) {
    return "...";
  }
  const lowerKeyword = keyword.trim().toLowerCase();
  const maxLength = 220;
  const contextRadius = 110;

  if (!lowerKeyword) {
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }

  const matchIndex = normalized.toLowerCase().indexOf(lowerKeyword);
  if (matchIndex < 0) {
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }

  const start = Math.max(0, matchIndex - contextRadius);
  const end = Math.min(normalized.length, matchIndex + lowerKeyword.length + contextRadius);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

function normalizePreviewText(content: string): string {
  return content
    .replace(/\s+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([^\x00-\x7F])/g, "$1 $2")
    .replace(/([^\x00-\x7F])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([,.;:!?])(?=\S)/g, "$1 ")
    .trim();
}
