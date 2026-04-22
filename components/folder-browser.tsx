"use client";

import Link from "next/link";
import { Fragment, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAdminUser } from "@/lib/auth-user";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { Folder } from "@/lib/types";

interface GlobalFindItem {
  id: string;
  filename: string;
  content?: Array<{
    page: number;
    content: string;
  }>;
}

const PAGE_CHUNK_SIZE = 5;

export function FolderBrowser() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const admin = isAdminUser(user);
  const urlKeyword = searchParams.get("keyword") ?? "";
  const [globalSearch, setGlobalSearch] = useState(urlKeyword);
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameDraft, setFolderNameDraft] = useState("");

  const [debouncedGlobalSearch] = useDebounce(globalSearch, 300);

  const foldersQuery = useQuery({
    queryKey: ["folders"],
    queryFn: async () => (await api.get<Folder[]>("/folders")).data,
  });

  const globalSearchQuery = useQuery({
    queryKey: ["global-file-search", debouncedGlobalSearch],
    queryFn: async () =>
      (await api.get<GlobalFindItem[]>("/files/find", { params: { keyword: debouncedGlobalSearch } })).data,
    enabled: debouncedGlobalSearch.trim().length > 0,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (foldername: string) => api.post("/folders", { foldername }),
    onSuccess: () => {
      setNewFolderName("");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({ folderId, foldername }: { folderId: string; foldername: string }) =>
      api.patch(`/folders/${folderId}`, { foldername }),
    onSuccess: () => {
      setEditingFolderId(null);
      setFolderNameDraft("");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["folder"] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => api.delete(`/folders/${folderId}`),
    onSuccess: () => {
      setEditingFolderId(null);
      setFolderNameDraft("");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const sortedFolders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);
  const searchContextHref = useMemo(() => {
    const params = new URLSearchParams();
    const trimmed = globalSearch.trim();
    if (trimmed) {
      params.set("keyword", trimmed);
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [globalSearch, pathname]);

  useEffect(() => {
    setGlobalSearch(urlKeyword);
  }, [urlKeyword]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = debouncedGlobalSearch.trim();
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
  }, [debouncedGlobalSearch, pathname, router, searchParams]);

  return (
    <section className="space-y-5">
      <div className="ui-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              🔍
            </span>
            <input
              id="globalSearch"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              className="ui-search-input"
              placeholder="Search files by keyword..."
            />
          </div>
          {admin && (
            <button
              onClick={() => setShowCreateFolder((prev) => !prev)}
              title="Create folder"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="relative inline-flex items-center justify-center">
                <span>📁</span>
                <span className="absolute -right-2 -top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                  +
                </span>
              </span>
            </button>
          )}
        </div>

        {admin && showCreateFolder && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <input
              id="newFolder"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              className="ui-input w-full max-w-sm"
              placeholder="Folder name"
            />
            <button
              onClick={() => createFolderMutation.mutate(newFolderName)}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
              className="ui-btn-primary"
            >
              {createFolderMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        )}

        {globalSearchQuery.isLoading && <p className="mt-2 text-xs text-slate-500">Searching...</p>}
        {globalSearchQuery.data && (
          <ul className="mt-3 space-y-2">
            {globalSearchQuery.data.map((item) => (
              <GlobalSearchItem
                key={item.id}
                item={item}
                keyword={debouncedGlobalSearch}
                returnTo={encodeURIComponent(searchContextHref)}
              />
            ))}
            {!globalSearchQuery.data.length && <li className="text-xs text-slate-500">No matching files.</li>}
          </ul>
        )}
      </div>

      {foldersQuery.isLoading && <p className="text-sm text-slate-600">Loading folders...</p>}
      {foldersQuery.error && <p className="text-sm text-red-600">Could not load folders.</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedFolders.map((folder) => (
          <Link
            key={folder.id}
            href={`/folders/${folder.id}`}
            className="block rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📁</span>
                <span className="text-sm font-semibold text-slate-900">{folder.foldername}</span>
              </div>
              {admin && (
                <button
                  onClick={(event) => {
                    event.preventDefault();
                    setEditingFolderId((prev) => (prev === folder.id ? null : folder.id));
                    setFolderNameDraft(folder.foldername);
                  }}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100"
                  title="Edit folder"
                >
                  ✏️
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {folder.files.length} file{folder.files.length === 1 ? "" : "s"}
            </p>
            {admin && editingFolderId === folder.id && (
              <div
                onClick={(event) => event.preventDefault()}
                className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5"
              >
                <input
                  value={folderNameDraft}
                  onChange={(event) => setFolderNameDraft(event.target.value)}
                  className="ui-input"
                  placeholder="Rename folder"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      renameFolderMutation.mutate({ folderId: folder.id, foldername: folderNameDraft })
                    }
                    className="ui-btn-primary px-3 py-1.5 text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => deleteFolderMutation.mutate(folder.id)}
                    className="inline-flex items-center justify-center rounded-full bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
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

function GlobalSearchItem({ item, keyword, returnTo }: { item: GlobalFindItem; keyword: string; returnTo: string }) {
  const [pageChunk, setPageChunk] = useState(0);
  const pageEntries = useMemo(
    () =>
      Array.from(
        new Map(
          (item.content ?? []).map((entry) => [
            Math.max(1, entry.page + 1),
            {
              page: Math.max(1, entry.page + 1),
              snippet: extractSentencePreview(entry.content, keyword),
            },
          ])
        ).values()
      ).sort((a, b) => a.page - b.page),
    [item.content]
  );
  const totalChunks = Math.max(1, Math.ceil(pageEntries.length / PAGE_CHUNK_SIZE));
  const pageStart = pageChunk * PAGE_CHUNK_SIZE;
  const pagedEntries = pageEntries.slice(pageStart, pageStart + PAGE_CHUNK_SIZE);

  return (
    <li className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
      <Link href={`/files/${item.id}`} className="text-base font-semibold text-slate-900 hover:underline sm:text-lg">
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
