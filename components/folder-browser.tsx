"use client";

import Link from "next/link";
import { Fragment, ReactNode } from "react";
import { DragEvent, MutableRefObject, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAdminUser } from "@/lib/auth-user";
import { api } from "@/lib/api";
import { DocumentChatWidget } from "@/components/document-chat-widget";
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
  const [newFolderLock, setNewFolderLock] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameDraft, setFolderNameDraft] = useState("");
  const [folderLockDraft, setFolderLockDraft] = useState(false);
  const [orderedFolders, setOrderedFolders] = useState<Folder[]>([]);
  const orderedFoldersRef = useRef<Folder[]>([]);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const folderDragGhostRef = useRef<HTMLDivElement | null>(null);
  const folderDragPointerOffsetRef = useRef({ x: 0, y: 0 });

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
    mutationFn: async ({ foldername, lock, order }: { foldername: string; lock: boolean; order: number }) =>
      api.post("/folders", { foldername, lock, order }),
    onSuccess: () => {
      setNewFolderName("");
      setNewFolderLock(false);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({
      folderId,
      foldername,
      lock,
    }: {
      folderId: string;
      foldername: string;
      lock: boolean;
    }) => api.patch(`/folders/${folderId}`, { foldername, lock }),
    onSuccess: () => {
      setEditingFolderId(null);
      setFolderNameDraft("");
      setFolderLockDraft(false);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["folder"] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => api.delete(`/folders/${folderId}`),
    onSuccess: () => {
      setEditingFolderId(null);
      setFolderNameDraft("");
      setFolderLockDraft(false);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const saveFolderOrdersMutation = useMutation({
    mutationFn: async (orders: { folderId: string; order: number }[]) => {
      await api.patch("/folders/order", { orders });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const serverFolderListSignature = useMemo(
    () =>
      (foldersQuery.data ?? [])
        .map((folder) => `${folder.id}:${folder.order ?? folder.sortOrder ?? 0}`)
        .join("|"),
    [foldersQuery.data]
  );
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
    orderedFoldersRef.current = orderedFolders;
  }, [orderedFolders]);

  useEffect(() => {
    return () => {
      folderDragGhostRef.current?.remove();
      folderDragGhostRef.current = null;
    };
  }, []);

  useEffect(() => {
    const data = foldersQuery.data;
    if (!data) {
      setOrderedFolders([]);
      return;
    }
    const sorted = sortFoldersByOrder([...data]);
    setOrderedFolders(sorted);
  }, [serverFolderListSignature, foldersQuery.data]);

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

  const onFolderDrop = (event: DragEvent<HTMLElement>, targetFolderId: string) => {
    event.preventDefault();
    if (!admin || !draggedFolderId || draggedFolderId === targetFolderId) {
      setDragOverFolderId(null);
      return;
    }

    const next = trySwapFolderList(orderedFoldersRef.current, draggedFolderId, targetFolderId);
    if (!next) {
      setDragOverFolderId(null);
      setDraggedFolderId(null);
      return;
    }
    setOrderedFolders(next);
    saveFolderOrdersMutation.mutate(
      next.map((folder, index) => ({ folderId: folder.id, order: index }))
    );
    setDragOverFolderId(null);
    setDraggedFolderId(null);
  };

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
          <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                id="newFolder"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
                className="ui-input w-full max-w-sm"
                placeholder="Folder name"
              />
              <button
                onClick={() =>
                  createFolderMutation.mutate({
                    foldername: newFolderName.trim(),
                    lock: newFolderLock,
                    order: (foldersQuery.data?.length ?? 0) + 1,
                  })
                }
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                className="ui-btn-primary"
              >
                {createFolderMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
            <label className="flex max-w-md cursor-pointer select-none items-start gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                className="folder-lock-checkbox mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0"
                checked={newFolderLock}
                onChange={(event) => setNewFolderLock(event.target.checked)}
              />
              <span>
                <span className="font-medium text-slate-800">Locked</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  When locked, the folder is marked as protected in the app. You can change this when editing the folder.
                </span>
              </span>
            </label>
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
      {admin && saveFolderOrdersMutation.isPending && (
        <p className="text-xs text-slate-500">Saving folder order…</p>
      )}
      {admin && saveFolderOrdersMutation.isError && (
        <p className="text-xs text-red-600">
          Could not save folder order. The list was refreshed from the server; try again if needed.
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orderedFolders.map((folder) => {
          const isEditing = admin && editingFolderId === folder.id;
          const cardClass = [
            "block rounded-2xl border bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
            admin && !isEditing ? "cursor-grab active:cursor-grabbing" : "",
            dragOverFolderId === folder.id ? "border-slate-400 bg-slate-100" : "border-slate-200/90",
            draggedFolderId === folder.id ? "opacity-[0.38]" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const cardBody = (
            <>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  {admin && (
                    <span className="shrink-0 select-none text-sm text-slate-400" aria-hidden>
                      ⋮⋮
                    </span>
                  )}
                  <span className="shrink-0 text-xl">{folder.lock ? "🔒" : "📁"}</span>
                  <span className="min-w-0 truncate text-sm font-semibold text-slate-900">{folder.foldername}</span>
                  {folder.lock && (
                    <span
                      className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800"
                      title="Locked"
                    >
                      Locked
                    </span>
                  )}
                </div>
                {admin && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setEditingFolderId((prev) => (prev === folder.id ? null : folder.id));
                        setFolderNameDraft(folder.foldername);
                        setFolderLockDraft(!!folder.lock);
                      }}
                      className="rounded p-1 text-slate-500 hover:bg-slate-100"
                      title="Edit folder"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {folder.files.length} file{folder.files.length === 1 ? "" : "s"}
              </p>
              {isEditing && (
                <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
                  <input
                    value={folderNameDraft}
                    onChange={(event) => setFolderNameDraft(event.target.value)}
                    className="ui-input"
                    placeholder="Rename folder"
                  />
                  <label className="flex cursor-pointer select-none items-start gap-2.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      className="folder-lock-checkbox mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer"
                      checked={folderLockDraft}
                      onChange={(event) => setFolderLockDraft(event.target.checked)}
                    />
                    <span>Lock folder (protected)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        renameFolderMutation.mutate({
                          folderId: folder.id,
                          foldername: folderNameDraft.trim() || folder.foldername,
                          lock: folderLockDraft,
                        })
                      }
                      className="ui-btn-primary px-3 py-1.5 text-xs"
                      disabled={!folderNameDraft.trim() || renameFolderMutation.isPending}
                    >
                      {renameFolderMutation.isPending ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFolderMutation.mutate(folder.id)}
                      className="inline-flex items-center justify-center rounded-full bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </>
          );

          const dropTargetProps = admin
            ? {
                onDragOver: (event: DragEvent<HTMLElement>) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (draggedFolderId && draggedFolderId !== folder.id) {
                    setDragOverFolderId(folder.id);
                  }
                },
                onDragLeave: (event: DragEvent<HTMLElement>) => {
                  const next = event.relatedTarget as Node | null;
                  if (!event.currentTarget.contains(next)) {
                    setDragOverFolderId((previous) => (previous === folder.id ? null : previous));
                  }
                },
                onDrop: (event: DragEvent<HTMLElement>) => onFolderDrop(event, folder.id),
              }
            : {};

          if (isEditing) {
            return (
              <div key={folder.id} className={cardClass} {...dropTargetProps}>
                {cardBody}
              </div>
            );
          }

          if (admin) {
            return (
              <div
                key={folder.id}
                className={cardClass}
                draggable
                title="Drag to swap order with another folder"
                onDragStart={(event) => {
                  event.stopPropagation();
                  setDraggedFolderId(folder.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", folder.id);
                  beginFolderCardDragPreview(event, event.currentTarget, folderDragGhostRef, folderDragPointerOffsetRef);
                }}
                onDrag={(event) => {
                  const ghost = folderDragGhostRef.current;
                  if (!ghost) {
                    return;
                  }
                  if (event.clientX === 0 && event.clientY === 0) {
                    return;
                  }
                  const { x, y } = folderDragPointerOffsetRef.current;
                  ghost.style.left = `${event.clientX - x}px`;
                  ghost.style.top = `${event.clientY - y}px`;
                }}
                onDragEnd={() => {
                  folderDragGhostRef.current?.remove();
                  folderDragGhostRef.current = null;
                  setDragOverFolderId(null);
                  setDraggedFolderId(null);
                }}
                {...dropTargetProps}
              >
                <Link
                  href={`/folders/${folder.id}`}
                  className="block rounded-2xl text-inherit no-underline outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2"
                >
                  {cardBody}
                </Link>
              </div>
            );
          }

          return (
            <Link key={folder.id} href={`/folders/${folder.id}`} className={cardClass} {...dropTargetProps}>
              {cardBody}
            </Link>
          );
        })}
      </div>

      <DocumentChatWidget />
    </section>
  );
}

function sortFoldersByOrder(folders: Folder[]): Folder[] {
  return folders.sort((a, b) => {
    const ao = a.order ?? a.sortOrder ?? 0;
    const bo = b.order ?? b.sortOrder ?? 0;
    if (ao !== bo) {
      return ao - bo;
    }
    return a.foldername.localeCompare(b.foldername, "en", { sensitivity: "base" });
  });
}

function sanitizeFolderDragGhostRoot(ghost: HTMLDivElement) {
  const classes = ghost.className.split(/\s+/).filter(Boolean);
  ghost.className = classes
    .filter(
      (c) =>
        c !== "transition" &&
        !c.startsWith("hover:") &&
        !c.startsWith("active:") &&
        !c.startsWith("cursor-") &&
        !/^opacity-/.test(c) &&
        c !== "bg-white/95" &&
        !c.startsWith("shadow"),
    )
    .concat(["bg-white", "shadow-xl"])
    .join(" ");
}

/**
 * Native `setDragImage(DOM)` is often scaled/blurred by the browser. We use a 1×1 transparent
 * canvas as the system drag image and move a real `position:fixed` clone on `drag` for a sharp preview.
 */
function beginFolderCardDragPreview(
  event: DragEvent<HTMLElement>,
  cardEl: HTMLElement,
  ghostRef: MutableRefObject<HTMLDivElement | null>,
  pointerOffsetRef: MutableRefObject<{ x: number; y: number }>,
) {
  ghostRef.current?.remove();
  ghostRef.current = null;

  const rect = cardEl.getBoundingClientRect();
  const offsetX = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
  const offsetY = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
  pointerOffsetRef.current = { x: offsetX, y: offsetY };

  const hideNativeDrag = document.createElement("canvas");
  hideNativeDrag.width = 1;
  hideNativeDrag.height = 1;
  event.dataTransfer.setDragImage(hideNativeDrag, 0, 0);

  const ghost = cardEl.cloneNode(true) as HTMLDivElement;
  ghost.removeAttribute("id");
  ghost.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  sanitizeFolderDragGhostRoot(ghost);

  ghost.style.boxSizing = "border-box";
  ghost.style.position = "fixed";
  ghost.style.left = `${event.clientX - offsetX}px`;
  ghost.style.top = `${event.clientY - offsetY}px`;
  ghost.style.width = `${rect.width}px`;
  ghost.style.margin = "0";
  ghost.style.pointerEvents = "none";
  ghost.style.zIndex = "2147483647";
  ghost.style.setProperty("filter", "none", "important");
  ghost.style.setProperty("backdrop-filter", "none", "important");
  ghost.style.setProperty("-webkit-backdrop-filter", "none", "important");
  ghost.style.setProperty("opacity", "1", "important");
  ghost.style.setProperty("background-color", "#ffffff", "important");
  ghost.style.setProperty("box-shadow", "0 28px 55px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.08)");
  ghost.draggable = false;
  ghost.querySelectorAll<HTMLElement>("[draggable]").forEach((el) => el.removeAttribute("draggable"));
  ghost.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.style.setProperty("filter", "none", "important");
    el.style.setProperty("backdrop-filter", "none", "important");
    el.style.setProperty("-webkit-backdrop-filter", "none", "important");
  });

  document.body.appendChild(ghost);
  ghostRef.current = ghost;
}

/** Swap two folders in place (drop target = exchange positions). Matches “exchange A and B” UX. */
function trySwapFolderList(folders: Folder[], draggedId: string, targetId: string): Folder[] | null {
  const i = folders.findIndex((item) => item.id === draggedId);
  const j = folders.findIndex((item) => item.id === targetId);
  if (i < 0 || j < 0 || i === j) {
    return null;
  }
  const next = [...folders];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
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
