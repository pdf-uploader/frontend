"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FileList } from "@/components/file-list";
import { api } from "@/lib/api";
import { Folder } from "@/lib/types";

export default function FolderPage() {
  const params = useParams<{ folderId: string }>();
  const folderId = params.folderId;

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

  if (folderQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading folder...</p>;
  }

  if (folderQuery.error || !folderQuery.data) {
    return <p className="text-sm text-red-600">Folder not found or unavailable.</p>;
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">{folderQuery.data.foldername}</h1>
      <FileList files={folderQuery.data.files} />
    </section>
  );
}
