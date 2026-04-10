"use client";

import { useQuery } from "@tanstack/react-query";
import { FolderCard } from "@/components/folder-card";
import { api } from "@/lib/api";
import { Folder } from "@/lib/types";

export default function DashboardPage() {
  const foldersQuery = useQuery({
    queryKey: ["folders"],
    queryFn: async () => (await api.get<Folder[]>("/folders")).data,
  });

  if (foldersQuery.isLoading) {
    return <p className="text-sm text-slate-600">Loading folders...</p>;
  }

  if (foldersQuery.error) {
    return <p className="text-sm text-red-600">Failed to load folders.</p>;
  }

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {foldersQuery.data?.map((folder) => (
          <FolderCard key={folder.id} folder={folder} />
        ))}
      </div>
    </section>
  );
}
