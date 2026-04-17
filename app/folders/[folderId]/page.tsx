"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
}

export default function FolderPage() {
  const params = useParams<{ folderId: string }>();
  const folderId = params.folderId;
  const { user } = useAuth();
  const admin = isAdminUser(user);
  const [folderSearch, setFolderSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [orderedFiles, setOrderedFiles] = useState<FolderFile[]>([]);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dragOverFileId, setDragOverFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
      });
    },
    onSuccess: () => {
      folderQuery.refetch();
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => api.delete(`/files/${fileId}`),
    onSuccess: (_, deletedFileId) => {
      setOrderedFiles((prev) => prev.filter((file) => file.id !== deletedFileId));
      folderQuery.refetch();
    },
  });

  const saveOrderMutation = useMutation({
    mutationFn: async (fileIds: string[]) => api.patch(`/folders/${folderId}/files/order`, { fileIds }),
    onSuccess: () => {
      folderQuery.refetch();
    },
  });

  const folderSearchQuery = useQuery({
    queryKey: ["folder-search", folderId, debouncedFolderSearch],
    queryFn: async () =>
      (await api.get<FileVersionItem[]>(`/${folderId}/files/search`, { params: { filename: debouncedFolderSearch } }))
        .data,
    enabled: debouncedFolderSearch.trim().length > 0,
  });

  const folder = folderQuery.data;
  const fileOrderSignature = folder?.files.map((file) => file.id).join("|") ?? "";

  useEffect(() => {
    if (folder) {
      setOrderedFiles(folder.files);
    }
  }, [fileOrderSignature, folder]);

  if (folderQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading folder...</p>;
  }

  if (folderQuery.error || !folder) {
    return <p className="text-sm text-red-600">Folder not found or unavailable.</p>;
  }

  const localOrderSignature = orderedFiles.map((file) => file.id).join("|");
  const hasOrderChanges = Boolean(localOrderSignature) && localOrderSignature !== fileOrderSignature;

  const onDropped = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    setDragCounter(0);
    if (!admin) return;
    const files = Array.from(event.dataTransfer.files).filter((file) => file.type === "application/pdf");
    if (files.length) {
      uploadMutation.mutate(files);
    }
  };

  const onFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    if (!admin) return;
    const files = Array.from(event.target.files ?? []);
    if (files.length) {
      uploadMutation.mutate(files);
    }
    event.target.value = "";
  };

  const moveFileByStep = (index: number, direction: -1 | 1) => {
    setOrderedFiles((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      return moveFile(prev, index, targetIndex);
    });
  };

  return (
    <section
      className={`space-y-4 ${dragging ? "rounded-xl ring-2 ring-blue-300 ring-offset-2" : ""}`}
      onDragOver={(event) => {
        if (!admin) return;
        event.preventDefault();
      }}
      onDragEnter={(event) => {
        if (!admin) return;
        event.preventDefault();
        setDragCounter((prev) => prev + 1);
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!admin) return;
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
        if (!admin) return;
        onDropped(event);
      }}
    >
      {admin && dragging && (
        <div className="sticky top-16 z-10 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          Drop files anywhere on this page to upload to this folder.
        </div>
      )}

      <div className="space-y-2">
        <Link href="/" className="inline-flex text-xs font-medium text-blue-700 hover:underline">
          ← Back to library
        </Link>
        <h1 className="text-2xl font-semibold">📁 {folder.foldername}</h1>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔍</span>
          <input
            value={folderSearch}
            onChange={(event) => setFolderSearch(event.target.value)}
            className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            placeholder="Search filename in this folder..."
          />
        </div>
        {folderSearchQuery.data && (
          <ul className="mt-2 space-y-1 text-sm">
            {folderSearchQuery.data.map((item) => (
              <li key={item.id}>
                <Link href={`/files/${item.id}`} className="text-blue-700 hover:underline">
                  {item.filename}
                </Link>
              </li>
            ))}
            {!folderSearchQuery.data.length && <li className="text-xs text-slate-500">No matching files.</li>}
          </ul>
        )}
      </div>

      <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-3 text-sm">
        {admin ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p>Drop PDF files anywhere on this page or use + to upload multiple files</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded bg-slate-900 px-2 py-1 text-white"
                title="Upload files"
              >
                +
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                onChange={onFilePick}
              />
            </div>
            {orderedFiles.length > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                <p>Drag and drop files in the list to reorder them, then save.</p>
                <button
                  onClick={() => saveOrderMutation.mutate(orderedFiles.map((file) => file.id))}
                  disabled={!hasOrderChanges || saveOrderMutation.isPending}
                  className="rounded bg-blue-700 px-3 py-1.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {saveOrderMutation.isPending ? "Saving order..." : "Save order"}
                </button>
              </div>
            )}
            {saveOrderMutation.error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {axios.isAxiosError(saveOrderMutation.error)
                  ? ((saveOrderMutation.error.response?.data as { message?: string } | undefined)?.message ??
                    saveOrderMutation.error.message)
                  : "Could not save order right now."}
              </p>
            )}
          </div>
        ) : (
          <p>Files in this folder</p>
        )}
      </div>

      <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        {orderedFiles.map((file, index) => (
          <li
            key={file.id}
            className={`flex items-center justify-between rounded border px-3 py-2 text-sm transition ${
              dragOverFileId === file.id ? "border-blue-400 bg-blue-50" : "border-slate-200"
            }`}
            draggable={admin}
            onDragStart={() => {
              if (!admin) return;
              setDraggedFileId(file.id);
            }}
            onDragOver={(event) => {
              if (!admin) return;
              event.preventDefault();
              if (draggedFileId !== file.id) {
                setDragOverFileId(file.id);
              }
            }}
            onDrop={(event) => {
              if (!admin) return;
              event.preventDefault();
              if (!draggedFileId || draggedFileId === file.id) {
                setDragOverFileId(null);
                return;
              }
              setOrderedFiles((prev) => {
                const fromIndex = prev.findIndex((item) => item.id === draggedFileId);
                const toIndex = prev.findIndex((item) => item.id === file.id);
                if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
                  return prev;
                }
                return moveFile(prev, fromIndex, toIndex);
              });
              setDragOverFileId(null);
              setDraggedFileId(null);
            }}
            onDragEnd={() => {
              setDragOverFileId(null);
              setDraggedFileId(null);
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              {admin && <span className="text-slate-400">⋮⋮</span>}
              <Link href={`/files/${file.id}`} className="truncate text-blue-700 hover:underline">
                📄 {file.filename}
              </Link>
            </div>
            {admin && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => moveFileByStep(index, -1)}
                  disabled={index === 0}
                  className="rounded px-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveFileByStep(index, 1)}
                  disabled={index === orderedFiles.length - 1}
                  className="rounded px-1 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => deleteFileMutation.mutate(file.id)}
                  className="rounded px-1 text-red-600 hover:bg-red-50"
                  title="Delete file"
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

function moveFile(files: FolderFile[], fromIndex: number, toIndex: number): FolderFile[] {
  const cloned = [...files];
  const [picked] = cloned.splice(fromIndex, 1);
  if (!picked) {
    return files;
  }
  cloned.splice(toIndex, 0, picked);
  return cloned;
}
