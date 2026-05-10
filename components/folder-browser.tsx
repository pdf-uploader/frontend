"use client";

import Link from "next/link";
import { Fragment, ReactNode, useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { DragEvent, MouseEvent as ReactMouseEvent, MutableRefObject } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAdminUser } from "@/lib/auth-user";
import { api } from "@/lib/api";
import { DocumentChatWidget } from "@/components/document-chat-widget";
import { useAuth } from "@/lib/hooks/use-auth";
import { pickRandomSpineColor, resolveShelfSpineColor } from "@/lib/folder-spine-color";
import { Folder } from "@/lib/types";

/* ── Design tokens (matches BookHomepage.jsx) ── */
const fontSerif = "'Playfair Display', Georgia, serif";
const fontBody = "'Source Serif 4', Georgia, serif";
const C = {
  navy: "#1a2744",
  gold: "#c97c2a",
  paper: "#faf8f3",
  bg: "#f4f1ec",
  border: "#d0c4aa",
  muted: "#a07848",
  spine: "#f0e8d8", // page-edge cream
};

const BOOKS_PER_SHELF = 5;
const PAGE_CHUNK_SIZE = 5;

/** Keep OS-style folder context menus inside the viewport */
function clampFolderContextMenuPosition(x: number, y: number, menuW: number, menuH: number) {
  if (typeof window === "undefined") return { x, y };
  const pad = 8;
  return {
    x: Math.max(pad, Math.min(x, window.innerWidth - menuW - pad)),
    y: Math.max(pad, Math.min(y, window.innerHeight - menuH - pad)),
  };
}

/** Same idea as folder interior: dim spines that do not match the search string (folder name or any PDF filename). */
function folderMatchesFileNameFilter(folder: Folder, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (folder.foldername.toLowerCase().includes(q)) return true;
  return folder.files.some((f) => f.filename.toLowerCase().includes(q));
}

interface GlobalFindItem {
  id: string;
  filename: string;
  content?: Array<{ page: number; content: string }>;
}

const folderCtxMenuItemNeutralStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  textAlign: "left" as const,
  padding: "8px 20px",
  border: "none",
  background: "transparent",
  cursor: "default",
  font: "inherit",
  color: "inherit",
};

const folderCtxMenuItemDangerStyle = {
  ...folderCtxMenuItemNeutralStyle,
  color: "#c2392b",
};

/* ═══════════════════════════════════════════════════════════════
   FolderBrowser (top-level export — data & state unchanged)
═══════════════════════════════════════════════════════════════ */
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
  const [orderedFolders, setOrderedFolders] = useState<Folder[]>([]);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [lockedModal, setLockedModal] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const orderedFoldersRef = useRef<Folder[]>([]);
  const folderDragGhostRef = useRef<HTMLDivElement | null>(null);
  const folderDragPointerOffsetRef = useRef({ x: 0, y: 0 });
  const folderContextMenuRef = useRef<HTMLDivElement | null>(null);

  /** Folder context: Rename · Lock/unlock · Delete */
  const [folderContextMenu, setFolderContextMenu] = useState<{
    folderId: string;
    x: number;
    y: number;
  } | null>(null);

  /** Inline rename on the spine (Windows Explorer–style). */
  const [inlineRenamingFolderId, setInlineRenamingFolderId] = useState<string | null>(null);
  const [inlineRenameDraft, setInlineRenameDraft] = useState("");

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
      api.post("/folders", { foldername, lock, order, spineColor: pickRandomSpineColor() }),
    onSuccess: () => {
      setNewFolderName(""); setNewFolderLock(false);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
  const renameFolderMutation = useMutation({
    mutationFn: async ({ folderId, foldername, lock }: { folderId: string; foldername: string; lock: boolean }) =>
      api.patch(`/folders/${folderId}`, { foldername, lock }),
    onSuccess: () => {
      setInlineRenamingFolderId(null); setInlineRenameDraft("");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["folder"] });
    },
  });
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => api.delete(`/folders/${folderId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });
  const saveFolderOrdersMutation = useMutation({
    mutationFn: async (orders: { folderId: string; order: number }[]) =>
      api.patch("/folders/order", { orders }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["folders"] }); },
    onError: () => { void queryClient.invalidateQueries({ queryKey: ["folders"] }); },
  });

  const serverFolderListSignature = useMemo(
    () => (foldersQuery.data ?? []).map((f) => `${f.id}:${f.order ?? f.sortOrder ?? 0}`).join("|"),
    [foldersQuery.data]
  );
  const searchContextHref = useMemo(() => {
    const params = new URLSearchParams();
    const t = globalSearch.trim();
    if (t) params.set("keyword", t);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [globalSearch, pathname]);

  useEffect(() => { setGlobalSearch(urlKeyword); }, [urlKeyword]);
  useEffect(() => { orderedFoldersRef.current = orderedFolders; }, [orderedFolders]);
  useEffect(() => () => { folderDragGhostRef.current?.remove(); folderDragGhostRef.current = null; }, []);
  useEffect(() => {
    const data = foldersQuery.data;
    if (!data) { setOrderedFolders([]); return; }
    setOrderedFolders(sortFoldersByOrder([...data]));
  }, [serverFolderListSignature, foldersQuery.data]);
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const t = debouncedGlobalSearch.trim();
    if (t) params.set("keyword", t); else params.delete("keyword");
    const currentQ = searchParams.toString();
    const nextQ = params.toString();
    if (currentQ !== nextQ) {
      router.replace(nextQ ? `${pathname}?${nextQ}` : pathname, { scroll: false });
    }
  }, [debouncedGlobalSearch, pathname, router, searchParams]);

  useEffect(() => {
    if (!folderContextMenu) return;
    const close = () => setFolderContextMenu(null);
    const onMouseDown = (ev: globalThis.MouseEvent) => {
      const root = folderContextMenuRef.current;
      if (root && !root.contains(ev.target as Node)) close();
    };
    const onKeyDown = (ev: globalThis.KeyboardEvent) => {
      if (ev.key === "Escape") close();
    };
    document.addEventListener("mousedown", onMouseDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", onMouseDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", close, true);
    };
  }, [folderContextMenu]);

  const cancelInlineRename = () => {
    setInlineRenamingFolderId(null);
    setInlineRenameDraft("");
  };

  const commitInlineRename = (folder: Folder) => {
    if (renameFolderMutation.isPending) return;
    const draft = inlineRenameDraft.trim();
    if (!draft) {
      cancelInlineRename();
      return;
    }
    if (draft === folder.foldername) {
      cancelInlineRename();
      return;
    }
    renameFolderMutation.mutate({
      folderId: folder.id,
      foldername: draft,
      lock: !!folder.lock,
    });
  };

  const onFolderDrop = (event: DragEvent<HTMLElement>, targetFolderId: string) => {
    event.preventDefault();
    if (!admin || !draggedFolderId || draggedFolderId === targetFolderId) {
      setDragOverFolderId(null); return;
    }
    const next = trySwapFolderList(orderedFoldersRef.current, draggedFolderId, targetFolderId);
    if (!next) { setDragOverFolderId(null); setDraggedFolderId(null); return; }
    setOrderedFolders(next);
    saveFolderOrdersMutation.mutate(next.map((f, i) => ({ folderId: f.id, order: i })));
    setDragOverFolderId(null); setDraggedFolderId(null);
  };

  /* split folders into shelves */
  const shelves: Folder[][] = [];
  for (let i = 0; i < orderedFolders.length; i += BOOKS_PER_SHELF) {
    shelves.push(orderedFolders.slice(i, i + BOOKS_PER_SHELF));
  }

  const folderContextMenuTarget =
    folderContextMenu && orderedFolders.find((f) => f.id === folderContextMenu.folderId);

  /** Keep spine “raised” while the context menu is open or while inline-renaming */
  const pinnedHoverFolderId = folderContextMenu?.folderId ?? inlineRenamingFolderId ?? null;

  return (
    <section style={{ fontFamily: fontBody }}>

      {/* ── Search bar ── */}
      <div style={{
        background: C.paper, border: `1px solid ${C.border}`,
        borderRadius: 9, padding: "24px 30px", marginBottom: 42,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Search input */}
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{
              position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)",
              pointerEvents: "none", color: C.navy, opacity: 0.5, display: "flex",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              id="globalSearch"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Search manuals, chapters, keywords…"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "14px 18px 14px 57px",
                fontFamily: fontBody, fontSize: 21, fontStyle: "italic",
                color: C.navy,
                background: "white",
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                outline: "none",
                transition: "border-color 200ms, box-shadow 200ms",
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = C.gold;
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,124,42,0.12)";
                e.currentTarget.style.fontStyle = "normal";
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.fontStyle = globalSearch ? "normal" : "italic";
              }}
            />
          </div>

          {/* Admin: create folder button */}
          {admin && (
            <button
              type="button"
              onClick={() => setShowCreateFolder(v => !v)}
              title="New folder"
              style={{
                display: "flex", alignItems: "center", gap: 9,
                padding: "12px 21px",
                fontFamily: fontBody, fontSize: 20, color: C.navy,
                background: "transparent", border: `1px solid ${C.navy}`,
                borderRadius: 6, cursor: "pointer", whiteSpace: "nowrap",
                transition: "background 200ms",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(26,39,68,0.06)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              + New Folder
            </button>
          )}
        </div>

        {/* Create folder panel */}
        {admin && showCreateFolder && (
          <div style={{
            marginTop: 14, padding: "14px 16px",
            background: "#f0ebe0", border: `1px solid ${C.border}`,
            borderRadius: 4,
          }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                style={{
                  flex: 1, minWidth: 200,
                  padding: "8px 10px", fontFamily: fontBody, fontSize: 13,
                  border: `1px solid ${C.border}`, borderRadius: 4,
                  background: "white", color: C.navy, outline: "none",
                }}
              />
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: fontBody, fontSize: 13, color: C.navy, cursor: "pointer"
              }}>
                <input
                  type="checkbox" checked={newFolderLock}
                  onChange={e => setNewFolderLock(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: C.navy }}
                />
                Lock folder
              </label>
              <button
                type="button"
                disabled={!newFolderName.trim() || createFolderMutation.isPending}
                onClick={() => createFolderMutation.mutate({
                  foldername: newFolderName.trim(), lock: newFolderLock,
                  order: (foldersQuery.data?.length ?? 0) + 1,
                })}
                style={{
                  padding: "8px 16px", fontFamily: fontBody, fontSize: 13,
                  background: C.navy, color: "white", border: "none",
                  borderRadius: 4, cursor: "pointer",
                  opacity: !newFolderName.trim() ? 0.5 : 1,
                  transition: "opacity 150ms",
                }}
              >
                {createFolderMutation.isPending ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        )}

        {/* Search results */}
        {globalSearchQuery.isLoading && (
          <p style={{ marginTop: 10, fontFamily: fontBody, fontSize: 12, color: C.muted }}>Searching…</p>
        )}
        {globalSearchQuery.data && (
          <ul style={{ marginTop: 14, listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {globalSearchQuery.data.map(item => (
              <GlobalSearchItem
                key={item.id} item={item}
                keyword={debouncedGlobalSearch}
                returnTo={encodeURIComponent(searchContextHref)}
              />
            ))}
            {!globalSearchQuery.data.length && (
              <li style={{ fontFamily: fontBody, fontSize: 13, color: C.muted }}>No matching files.</li>
            )}
          </ul>
        )}
      </div>

      {/* ── Loading / error states ── */}
      {foldersQuery.isLoading && (
        <p style={{ fontFamily: fontBody, fontSize: 14, color: C.muted }}>Loading library…</p>
      )}
      {foldersQuery.error && (
        <p style={{ fontFamily: fontBody, fontSize: 14, color: "#c0392b" }}>Could not load folders.</p>
      )}
      {admin && saveFolderOrdersMutation.isPending && (
        <p style={{ fontFamily: fontBody, fontSize: 12, color: C.muted, marginBottom: 8 }}>Saving order…</p>
      )}

      {/* ── Bookshelf ── */}
      {shelves.map((shelfFolders, shelfIndex) => (
        <Shelf
          key={shelfIndex}
          folders={shelfFolders}
          shelfIndex={shelfIndex}
          fileNameFilter={globalSearch}
          admin={admin}
          draggedFolderId={draggedFolderId}
          dragOverFolderId={dragOverFolderId}
          pinnedHoverFolderId={pinnedHoverFolderId}
          inlineRenamingFolderId={inlineRenamingFolderId}
          inlineRenameDraft={inlineRenameDraft}
          onInlineRenameDraftChange={setInlineRenameDraft}
          onCommitInlineRename={commitInlineRename}
          onCancelInlineRename={cancelInlineRename}
          renameFolderPending={renameFolderMutation.isPending}
          renameFolderTargetId={renameFolderMutation.variables?.folderId ?? null}
          onOpenLocked={setLockedModal}
          onFolderContextMenu={(folderId, e) => {
            const MENU_W = 172;
            const MENU_H = admin ? 152 : 112;
            const pt = clampFolderContextMenuPosition(e.clientX, e.clientY, MENU_W, MENU_H);
            setFolderContextMenu({ folderId, x: pt.x, y: pt.y });
          }}
          onDragStart={(folderId, event, cardEl) => {
            setDraggedFolderId(folderId);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", folderId);
            beginFolderCardDragPreview(event, cardEl, folderDragGhostRef, folderDragPointerOffsetRef);
          }}
          onDrag={(event) => {
            const ghost = folderDragGhostRef.current;
            if (!ghost || (event.clientX === 0 && event.clientY === 0)) return;
            const { x, y } = folderDragPointerOffsetRef.current;
            ghost.style.left = `${event.clientX - x}px`;
            ghost.style.top = `${event.clientY - y}px`;
          }}
          onDragEnd={() => {
            folderDragGhostRef.current?.remove(); folderDragGhostRef.current = null;
            setDragOverFolderId(null); setDraggedFolderId(null);
          }}
          onDragOver={(folderId, event) => {
            event.preventDefault(); event.dataTransfer.dropEffect = "move";
            if (draggedFolderId && draggedFolderId !== folderId) setDragOverFolderId(folderId);
          }}
          onDragLeave={(folderId, event) => {
            const next = event.relatedTarget as Node | null;
            if (!event.currentTarget.contains(next)) {
              setDragOverFolderId(prev => prev === folderId ? null : prev);
            }
          }}
          onDrop={onFolderDrop}
          globalStartIndex={shelfIndex * BOOKS_PER_SHELF}
        />
      ))}

      {/* ── Locked book modal ── */}
      {lockedModal && (
        <div
          role="dialog"
          aria-modal
          onClick={() => setLockedModal(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(10,16,34,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: C.paper, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: "28px 32px", maxWidth: 360,
              boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 14 }}>🔒</div>
            <h3 style={{ fontFamily: fontSerif, fontSize: 18, color: C.navy, marginBottom: 10 }}>
              Restricted Manual
            </h3>
            <p style={{ fontFamily: fontBody, fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.55 }}>
              This manual is restricted.
              <br />
              Contact{" "}
              <a href="mailto:kisong3007@kecbd.com" style={{ color: C.gold }}>
                kisong3007@kecbd.com
              </a>{" "}
              to request access.
            </p>
            <button
              type="button"
              onClick={() => setLockedModal(null)}
              style={{
                fontFamily: fontBody, fontSize: 13, color: C.navy,
                background: "transparent", border: `1px solid ${C.navy}`,
                borderRadius: 4, padding: "7px 20px", cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm delete folder ── */}
      {deleteConfirm && (
        <div
          role="alertdialog"
          aria-modal
          aria-labelledby="delete-folder-title"
          onClick={() => setDeleteConfirm(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(10,16,34,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.paper, border: `1px solid ${C.border}`,
              borderRadius: 6, padding: "26px 28px", maxWidth: 400, width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
            }}
          >
            <h3 id="delete-folder-title" style={{
              fontFamily: fontSerif, fontSize: 18, color: C.navy, marginBottom: 12,
            }}>
              Delete folder?
            </h3>
            <p style={{ fontFamily: fontBody, fontSize: 14, color: C.muted, lineHeight: 1.55, marginBottom: 20 }}>
              This will permanently delete <strong style={{ color: C.navy }}>{deleteConfirm.name}</strong>
              {" "}and remove its volumes from the library. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  fontFamily: fontBody, fontSize: 13, color: C.navy,
                  background: "white", border: `1px solid ${C.border}`,
                  borderRadius: 4, padding: "8px 16px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteFolderMutation.isPending}
                onClick={() => deleteFolderMutation.mutate(deleteConfirm.id, {
                  onSettled: () => setDeleteConfirm(null),
                })}
                style={{
                  fontFamily: fontBody, fontSize: 13, color: "white",
                  background: "#c0392b", border: "none",
                  borderRadius: 4, padding: "8px 16px", cursor: "pointer",
                  opacity: deleteFolderMutation.isPending ? 0.7 : 1,
                }}
              >
                {deleteFolderMutation.isPending ? "Deleting…" : "Delete folder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {folderContextMenu && folderContextMenuTarget && (
        <div
          ref={folderContextMenuRef}
          role="menu"
          aria-label="Folder actions"
          style={{
            position: "fixed",
            left: folderContextMenu.x,
            top: folderContextMenu.y,
            zIndex: 955,
            minWidth: 168,
            padding: "4px 0",
            background: "#ffffff",
            border: "1px solid #cacaca",
            borderRadius: 4,
            boxShadow: "0 8px 24px rgba(0,0,0,0.16), 0 0 1px rgba(0,0,0,0.08)",
            fontFamily: "\"Segoe UI\", system-ui, -apple-system, sans-serif",
            fontSize: 13,
            color: "#242424",
          }}
        >
          <>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setInlineRenamingFolderId(folderContextMenuTarget.id);
                setInlineRenameDraft(folderContextMenuTarget.foldername);
                setFolderContextMenu(null);
              }}
              style={folderCtxMenuItemNeutralStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ebebeb"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              Rename…
            </button>
            {admin && (
              <button
                type="button"
                role="menuitem"
                disabled={renameFolderMutation.isPending}
                onClick={() => {
                  const f = folderContextMenuTarget;
                  setFolderContextMenu(null);
                  renameFolderMutation.mutate({
                    folderId: f.id,
                    foldername: f.foldername,
                    lock: !f.lock,
                  });
                }}
                style={{
                  ...folderCtxMenuItemNeutralStyle,
                  opacity: renameFolderMutation.isPending ? 0.5 : 1,
                  cursor: renameFolderMutation.isPending ? "default" : "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#ebebeb"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {folderContextMenuTarget.lock ? "Unlock" : "Lock"}
              </button>
            )}
            <div style={{ height: 1, background: "#e0e0e0", margin: "2px 6px" }} role="separator" />
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setFolderContextMenu(null);
                setDeleteConfirm({ id: folderContextMenuTarget.id, name: folderContextMenuTarget.foldername });
              }}
              style={folderCtxMenuItemDangerStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fce8e8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              Delete
            </button>
          </>
        </div>
      )}

      <DocumentChatWidget />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Shelf — one row of books + wooden board
═══════════════════════════════════════════════════════════════ */
type ShelfProps = {
  folders: Folder[];
  shelfIndex: number;
  globalStartIndex: number;
  /** When non-empty, spines that do not match folder name or any file name are dimmed (see folder interior). */
  fileNameFilter: string;
  admin: boolean;
  draggedFolderId: string | null;
  dragOverFolderId: string | null;
  /** Keeps spine hover lift while context menu open or inline rename active */
  pinnedHoverFolderId: string | null;
  inlineRenamingFolderId: string | null;
  inlineRenameDraft: string;
  onInlineRenameDraftChange: (value: string) => void;
  onCommitInlineRename: (folder: Folder) => void;
  onCancelInlineRename: () => void;
  renameFolderPending: boolean;
  renameFolderTargetId: string | null;
  onOpenLocked: (id: string) => void;
  onFolderContextMenu: (folderId: string, e: ReactMouseEvent) => void;
  onDragStart: (id: string, event: DragEvent<HTMLElement>, el: HTMLElement) => void;
  onDrag: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragOver: (id: string, event: DragEvent<HTMLElement>) => void;
  onDragLeave: (id: string, event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>, id: string) => void;
};

function Shelf({
  folders, shelfIndex, globalStartIndex, fileNameFilter, admin,
  draggedFolderId, dragOverFolderId,
  pinnedHoverFolderId, inlineRenamingFolderId, inlineRenameDraft,
  onInlineRenameDraftChange, onCommitInlineRename, onCancelInlineRename,
  renameFolderPending, renameFolderTargetId,
  onOpenLocked, onFolderContextMenu,
  onDragStart, onDrag, onDragEnd, onDragOver, onDragLeave, onDrop,
}: ShelfProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pullingId, setPullingId] = useState<string | null>(null); // "pull off shelf" exit anim

  const handleBookClick = (folder: Folder) => {
    if (inlineRenamingFolderId === folder.id) return;
    if (folder.lock && !admin) { onOpenLocked(folder.id); return; }
    setPullingId(folder.id);
    setTimeout(() => {
      router.push(`/folders/${folder.id}`);
    }, 220);
  };

  /** Capture phase: required so `preventDefault` runs before the browser menu when the hit target is inside `draggable`. */
  const handleShelfWallContextMenuCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    const hit = t.closest("[data-folder-card]");
    if (!hit) return;
    const folderId = hit.getAttribute("data-folder-id");
    if (!folderId) return;
    if (inlineRenamingFolderId === folderId) return;
    e.preventDefault();
    e.stopPropagation();
    onFolderContextMenu(folderId, e);
  };

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Wall behind books — subtle warm tone */}
      <div style={{
        background: C.bg,
        borderRadius: "6px 6px 0 0",
        padding: "24px 24px 0",
        display: "flex", alignItems: "flex-end", gap: 6,
        flexWrap: "wrap",
        minHeight: 390,
        position: "relative",
        /* vertical woodgrain */
        backgroundImage:
          "repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(0,0,0,0.018) 48px, rgba(0,0,0,0.018) 49px)",
      }}
        onContextMenuCapture={handleShelfWallContextMenuCapture}
      >
        {folders.map((folder, idx) => {
          const absIdx = globalStartIndex + idx;
          const color = resolveShelfSpineColor(folder);
          const isLocked = !!folder.lock && !admin;
          const isHovered =
            !pullingId && (hoveredId === folder.id || pinnedHoverFolderId === folder.id);
          const isDraggingThis = inlineRenamingFolderId !== folder.id;
          const isRenaming = inlineRenamingFolderId === folder.id;
          const isPulling = pullingId === folder.id;
          const isDragged = draggedFolderId === folder.id;
          const isDragOver = dragOverFolderId === folder.id;
          const renamePendingHere = renameFolderPending && renameFolderTargetId === folder.id;

          const fileFilterMatches = folderMatchesFileNameFilter(folder, fileNameFilter);

          const bookEl = (
            <BookSpine
              folder={folder}
              color={color}
              folderSealed={!!folder.lock}
              isLocked={isLocked}
              isHovered={isHovered}
              isPulling={isPulling}
              isDragged={isDragged}
              isDragOver={isDragOver}
              fileFilterMatches={fileFilterMatches}
              admin={admin}
              isRenaming={isRenaming}
              inlineRenameDraft={inlineRenameDraft}
              onInlineRenameDraftChange={onInlineRenameDraftChange}
              onCommitInlineRename={() => onCommitInlineRename(folder)}
              onCancelInlineRename={onCancelInlineRename}
              renamePending={renamePendingHere}
              onHoverIn={() => setHoveredId(folder.id)}
              onHoverOut={() => setHoveredId(null)}
              onClick={() => handleBookClick(folder)}
            />
          );

          if (admin) {
            return (
              <div
                key={folder.id}
                data-folder-card
                data-folder-id={folder.id}
                draggable={isDraggingThis}
                title="Drag to reorder"
                onDragStart={e => onDragStart(folder.id, e as unknown as DragEvent<HTMLElement>, e.currentTarget)}
                onDrag={e => onDrag(e as unknown as DragEvent<HTMLElement>)}
                onDragEnd={onDragEnd}
                onDragOver={e => onDragOver(folder.id, e as unknown as DragEvent<HTMLElement>)}
                onDragLeave={e => onDragLeave(folder.id, e as unknown as DragEvent<HTMLElement>)}
                onDrop={e => onDrop(e as unknown as DragEvent<HTMLElement>, folder.id)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                {bookEl}
              </div>
            );
          }

          return (
            <div
              key={folder.id}
              data-folder-card
              data-folder-id={folder.id}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              {bookEl}
            </div>
          );
        })}
      </div>

      {/* Wooden shelf board */}
      <div style={{
        height: 18, borderRadius: "0 0 4px 4px",
        background: "linear-gradient(180deg,#c8a87a 0%,#a07848 40%,#8a6030 100%)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25), inset 0 -2px 4px rgba(0,0,0,0.15)",
      }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BookSpine — single book on the shelf
═══════════════════════════════════════════════════════════════ */
type BookSpineProps = {
  folder: Folder;
  color: string;
  /** Locked at folder level — sealed leather-style spine vs open paper reference */
  folderSealed: boolean;
  isLocked: boolean;
  isHovered: boolean;
  isPulling: boolean;
  isDragged: boolean;
  isDragOver: boolean;
  /** False when the dashboard search box is non-empty and this folder/name does not match. */
  fileFilterMatches: boolean;
  admin: boolean;
  isRenaming: boolean;
  inlineRenameDraft: string;
  onInlineRenameDraftChange: (value: string) => void;
  onCommitInlineRename: () => void;
  onCancelInlineRename: () => void;
  renamePending: boolean;
  onHoverIn: () => void;
  onHoverOut: () => void;
  onClick: () => void;
};

function BookSpine({
  folder, color, folderSealed, isLocked,
  isHovered, isPulling, isDragged, isDragOver, fileFilterMatches,
  admin, isRenaming, inlineRenameDraft,
  onInlineRenameDraftChange, onCommitInlineRename, onCancelInlineRename, renamePending,
  onHoverIn, onHoverOut, onClick,
}: BookSpineProps) {
  /* Detect touch device to replace hover→tap scale */
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => { setIsTouch(window.matchMedia("(hover: none)").matches); }, []);

  const renameCommitOnBlurRef = useRef(true);
  useEffect(() => {
    if (isRenaming) renameCommitOnBlurRef.current = true;
  }, [isRenaming]);

  const renameTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const W = 228; // spine width (3× baseline 76px)
  const H = 330; // spine height (1.5× baseline 220px)
  const titleAreaMaxH = H - 95;
  useEffect(() => {
    if (!isRenaming) return;
    const el = renameTextareaRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [isRenaming]);
  useLayoutEffect(() => {
    if (!isRenaming) return;
    const el = renameTextareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, titleAreaMaxH)}px`;
  }, [isRenaming, inlineRenameDraft, titleAreaMaxH]);

  const transform =
    isPulling ? "translateY(-30px)" :
      isHovered ? (isTouch ? "scale(1.03)" : "translateZ(20px) translateY(-10px)") :
        isDragOver ? "translateY(-6px)" :
          "none";
  const shadow =
    isHovered
      ? "-4px 10px 24px rgba(0,0,0,0.32), inset -4px 0 8px rgba(0,0,0,0.18)"
      : "-2px 4px 10px rgba(0,0,0,0.18), inset -4px 0 8px rgba(0,0,0,0.12)";

  const openReferenceSpine = !folderSealed;

  return (
    /* perspective per book so translateZ works */
    <div
      style={{
        perspective: 500,
        marginBottom: 2,
        opacity: fileFilterMatches ? 1 : 0.22,
        transform: fileFilterMatches ? "none" : "scale(0.96)",
        transition: "opacity 250ms ease, transform 250ms ease",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          cursor:
            isRenaming ? "text" :
              isLocked && !admin ? "not-allowed" : "pointer",
          opacity: isDragged ? 0.35 : 1,
          transition: "transform 150ms ease-out, box-shadow 150ms, opacity 200ms",
          transform,
        }}
        onMouseEnter={onHoverIn}
        onMouseLeave={onHoverOut}
        onClick={isRenaming ? undefined : onClick}
      >
        {/* Main spine face */}
        <div
          style={{
            width: W, height: H,
            background: openReferenceSpine
              ? `linear-gradient(160deg,#faf8f3 0%,#ebe3d6 42%,#e0d4c8 100%)`
              : color,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "18px 0 15px",
            boxShadow: shadow,
            borderRadius: "2px 0 0 2px",
            overflow: "hidden",
            transition: "box-shadow 150ms",
            borderTop:
              openReferenceSpine ? "1px solid rgba(26,39,68,0.12)" : "none",
            borderLeft:
              openReferenceSpine ? "1px solid rgba(26,39,68,0.12)" : "none",
            borderBottom:
              openReferenceSpine ? "1px solid rgba(26,39,68,0.12)" : "none",
            borderRight: "none",
          }}
        >
          {/* Accent stripe */}
          <div style={{
            position: "absolute", top: 21, left: 0, right: 0,
            height: 5,
            background: openReferenceSpine ? "rgba(201,124,42,0.55)" : C.gold,
            opacity: openReferenceSpine ? 1 : 0.9,
          }} />

          {/* Top cap */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 12,
            background: openReferenceSpine ? "rgba(26,39,68,0.06)" : "rgba(0,0,0,0.22)",
          }} />

          {/* Title — horizontal (Windows-style inline rename) */}
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 10px",
            overflow: "hidden",
            width: "100%",
            boxSizing: "border-box",
            minHeight: 0,
          }}>
            {isRenaming ? (
              <textarea
                ref={renameTextareaRef}
                value={inlineRenameDraft}
                onChange={(e) =>
                  onInlineRenameDraftChange(e.target.value.replace(/\r\n|\r|\n/g, " "))
                }
                onBlur={() => {
                  if (!renameCommitOnBlurRef.current) {
                    renameCommitOnBlurRef.current = true;
                    return;
                  }
                  onCommitInlineRename();
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    (e.currentTarget as HTMLTextAreaElement).blur();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    renameCommitOnBlurRef.current = false;
                    onCancelInlineRename();
                  }
                }}
                disabled={renamePending}
                aria-label="Folder name"
                rows={1}
                style={{
                  width: "100%",
                  minWidth: 0,
                  minHeight: "2.75em",
                  maxHeight: titleAreaMaxH,
                  boxSizing: "border-box",
                  textAlign: "center",
                  fontFamily: fontSerif,
                  fontSize: inlineRenameDraft.length > 20 ? 20 : 24,
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  lineHeight: 1.3,
                  color: openReferenceSpine ? C.navy : "rgba(255,255,255,0.95)",
                  background: openReferenceSpine ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.22)",
                  border: `1px solid ${openReferenceSpine ? C.gold : "rgba(255,255,255,0.35)"}`,
                  borderRadius: 2,
                  padding: "4px 6px",
                  outline: "none",
                  resize: "none",
                  overflowY: "auto",
                  overflowX: "hidden",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              />
            ) : (
              <span style={{
                display: "block",
                fontFamily: fontSerif,
                fontSize: folder.foldername.length > 20 ? 20 : 24,
                fontWeight: 600,
                color: openReferenceSpine ? C.navy : "rgba(255,255,255,0.92)",
                letterSpacing: "0.03em",
                lineHeight: 1.3,
                textAlign: "center",
                wordBreak: "break-word",
                overflow: "hidden",
                maxHeight: titleAreaMaxH,
              }}>
                {folder.foldername}
              </span>
            )}
          </div>

          {/* Lock / file count / open label */}
          <div style={{
            fontFamily: fontBody, fontSize: 18,
            color: openReferenceSpine ? C.muted : "rgba(255,255,255,0.65)",
            letterSpacing: "0.04em",
            textAlign: "center",
            paddingBottom: 2,
          }}>
            {folder.lock ? "🔒" : `${folder.files.length} file${folder.files.length === 1 ? "" : "s"}`}
          </div>
        </div>

        {/* Right face — stacked pages edge */}
        <div style={{
          width: 27, height: H,
          background: openReferenceSpine ? "#f5eee2" : "#f0e8d8",
          backgroundImage: openReferenceSpine
            ? "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(26,39,68,0.06) 2px,rgba(26,39,68,0.06) 3px)"
            : "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 3px)",
          borderRadius: "0 2px 2px 0",
          boxShadow: "inset -1px 0 3px rgba(0,0,0,0.08)",
        }} />
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GlobalSearchItem — unchanged logic, restyled
═══════════════════════════════════════════════════════════════ */
function GlobalSearchItem({ item, keyword, returnTo }: { item: GlobalFindItem; keyword: string; returnTo: string }) {
  const [pageChunk, setPageChunk] = useState(0);
  const pageEntries = useMemo(() =>
    Array.from(new Map(
      (item.content ?? []).map(entry => [
        Math.max(1, entry.page + 1),
        { page: Math.max(1, entry.page + 1), snippet: extractSentencePreview(entry.content, keyword) },
      ])
    ).values()).sort((a, b) => a.page - b.page),
    [item.content, keyword]
  );
  const totalChunks = Math.max(1, Math.ceil(pageEntries.length / PAGE_CHUNK_SIZE));
  const pageStart = pageChunk * PAGE_CHUNK_SIZE;
  const pagedEntries = pageEntries.slice(pageStart, pageStart + PAGE_CHUNK_SIZE);

  return (
    <li style={{
      background: "white", border: `1px solid ${C.border}`,
      borderRadius: 4, padding: "12px 14px",
      fontFamily: fontBody,
    }}>
      <Link href={`/files/${item.id}`}
        style={{ fontFamily: fontSerif, fontSize: 15, fontWeight: 600, color: C.navy, textDecoration: "none" }}>
        {item.filename}
      </Link>
      {pagedEntries.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {pagedEntries.map(entry => (
            <Link key={`${item.id}-${entry.page}`}
              href={`/files/${item.id}?page=${entry.page}&keyword=${encodeURIComponent(keyword)}&returnTo=${returnTo}`}
              style={{
                display: "block",
                border: `1px solid ${C.border}`, borderRadius: 3,
                padding: "8px 12px", textDecoration: "none",
                background: C.paper, transition: "border-color 150ms, box-shadow 150ms",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.gold;
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 2px 8px rgba(201,124,42,0.10)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.border;
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: fontSerif, fontSize: 14, fontWeight: 700, color: C.navy }}>
                  Page {entry.page}
                </span>
                <span style={{ fontFamily: fontBody, fontSize: 11, color: C.muted }}>Open →</span>
              </div>
              <p style={{
                fontFamily: fontBody, fontSize: 12, color: "#444", lineHeight: 1.55,
                whiteSpace: "pre-wrap", wordBreak: "break-word"
              }}>
                {highlightKeyword(entry.snippet, keyword)}
              </p>
            </Link>
          ))}
          {pageEntries.length > PAGE_CHUNK_SIZE && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: fontBody, fontSize: 12 }}>
              <button onClick={() => setPageChunk(p => Math.max(0, p - 1))} disabled={pageChunk === 0}
                style={{
                  padding: "3px 10px", border: `1px solid ${C.border}`, borderRadius: 3, cursor: "pointer",
                  background: "white", color: C.navy, opacity: pageChunk === 0 ? 0.4 : 1
                }}>
                ‹ Prev
              </button>
              <span style={{ color: C.muted }}>{pageChunk + 1} / {totalChunks}</span>
              <button onClick={() => setPageChunk(p => Math.min(totalChunks - 1, p + 1))} disabled={pageChunk >= totalChunks - 1}
                style={{
                  padding: "3px 10px", border: `1px solid ${C.border}`, borderRadius: 3, cursor: "pointer",
                  background: "white", color: C.navy, opacity: pageChunk >= totalChunks - 1 ? 0.4 : 1
                }}>
                Next ›
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Pure utility functions (unchanged logic)
═══════════════════════════════════════════════════════════════ */
function sortFoldersByOrder(folders: Folder[]): Folder[] {
  return folders.sort((a, b) => {
    const ao = a.order ?? a.sortOrder ?? 0;
    const bo = b.order ?? b.sortOrder ?? 0;
    return ao !== bo ? ao - bo : a.foldername.localeCompare(b.foldername, "en", { sensitivity: "base" });
  });
}

function trySwapFolderList(folders: Folder[], draggedId: string, targetId: string): Folder[] | null {
  const i = folders.findIndex(f => f.id === draggedId);
  const j = folders.findIndex(f => f.id === targetId);
  if (i < 0 || j < 0 || i === j) return null;
  const next = [...folders];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

function beginFolderCardDragPreview(
  event: DragEvent<HTMLElement>,
  cardEl: HTMLElement,
  ghostRef: MutableRefObject<HTMLDivElement | null>,
  pointerOffsetRef: MutableRefObject<{ x: number; y: number }>,
) {
  ghostRef.current?.remove(); ghostRef.current = null;
  const rect = cardEl.getBoundingClientRect();
  pointerOffsetRef.current = {
    x: Math.max(0, Math.min(event.clientX - rect.left, rect.width)),
    y: Math.max(0, Math.min(event.clientY - rect.top, rect.height)),
  };
  const canvas = document.createElement("canvas");
  canvas.width = 1; canvas.height = 1;
  event.dataTransfer.setDragImage(canvas, 0, 0);

  const ghost = cardEl.cloneNode(true) as HTMLDivElement;
  ghost.removeAttribute("id");
  ghost.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
  Object.assign(ghost.style, {
    position: "fixed", boxSizing: "border-box", margin: "0",
    left: `${event.clientX - pointerOffsetRef.current.x}px`,
    top: `${event.clientY - pointerOffsetRef.current.y}px`,
    width: `${rect.width}px`, pointerEvents: "none",
    zIndex: "2147483647", opacity: "1",
  });
  ghost.style.setProperty("box-shadow", "0 28px 55px rgba(15,23,42,0.28),0 0 0 1px rgba(15,23,42,0.08)");
  document.body.appendChild(ghost);
  ghostRef.current = ghost;
}

function highlightKeyword(text: string, keyword: string): ReactNode {
  const trimmed = keyword.trim();
  if (!trimmed) return text;
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const segments = text.split(regex);
  return segments.map((seg, i) =>
    seg.toLowerCase() === trimmed.toLowerCase()
      ? <mark key={i} style={{ background: "rgba(201,124,42,0.25)", borderRadius: 2, padding: "0 1px" }}>{seg}</mark>
      : <Fragment key={i}>{seg}</Fragment>
  );
}

function extractSentencePreview(content: string, keyword: string): string {
  const normalized = normalizePreviewText(content);
  if (!normalized) return "...";
  const lowerKw = keyword.trim().toLowerCase();
  const max = 220, radius = 110;
  if (!lowerKw) return normalized.length > max ? normalized.slice(0, max) + "..." : normalized;
  const idx = normalized.toLowerCase().indexOf(lowerKw);
  if (idx < 0) return normalized.length > max ? normalized.slice(0, max) + "..." : normalized;
  const start = Math.max(0, idx - radius);
  const end = Math.min(normalized.length, idx + lowerKw.length + radius);
  return `${start > 0 ? "..." : ""}${normalized.slice(start, end)}${end < normalized.length ? "..." : ""}`;
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
