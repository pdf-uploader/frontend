"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppUser, Folder } from "@/lib/types";

export function AdminPanel() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [folderName, setFolderName] = useState("");
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [filesToUpload, setFilesToUpload] = useState<FileList | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<AppUser[]>("/users")).data,
  });

  const foldersQuery = useQuery({
    queryKey: ["folders"],
    queryFn: async () => (await api.get<Folder[]>("/folders")).data,
  });

  const createUserMutation = useMutation({
    mutationFn: async () => api.post("/users/signUp/user", { email, username, password }),
    onSuccess: () => {
      setEmail("");
      setUsername("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => api.post("/folders", { foldername: folderName }),
    onSuccess: () => {
      setFolderName("");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const uploadFilesMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFolderId || !filesToUpload?.length) return;
      const formData = new FormData();
      Array.from(filesToUpload).forEach((file) => formData.append("pdf", file));
      await api.post(`/files/upload/${uploadFolderId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      setFilesToUpload(null);
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/files/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["folders"] }),
  });

  const submitCreateUser = (event: FormEvent) => {
    event.preventDefault();
    createUserMutation.mutate();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold">Create User</h3>
        <form className="space-y-3" onSubmit={submitCreateUser}>
          <input className="w-full rounded border p-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded border p-2 text-sm" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className="w-full rounded border p-2 text-sm" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={createUserMutation.isPending || !email || !username || !password}
          >
            Create
          </button>
        </form>

        <h4 className="pt-2 text-sm font-semibold text-slate-700">Users</h4>
        {usersQuery.isError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            Could not load users. If you are an admin, check that GET /users is allowed and the API is running.
          </p>
        )}
        {usersQuery.isLoading && <p className="text-xs text-slate-500">Loading users...</p>}
        <ul className="space-y-2 text-sm">
          {usersQuery.data?.map((user) => (
            <li key={user.id} className="flex items-center justify-between rounded border border-slate-200 p-2">
              <span>
                {user.email}
                {user.username ? <span className="ml-2 text-xs text-slate-500">({user.username})</span> : null}
              </span>
              <button onClick={() => deleteUserMutation.mutate(user.id)} className="text-xs text-red-600">
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold">Folder & File Management</h3>
        <div className="space-y-2">
          <input className="w-full rounded border p-2 text-sm" placeholder="Folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
          <button
            onClick={() => createFolderMutation.mutate()}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!folderName || createFolderMutation.isPending}
          >
            Create Folder
          </button>
        </div>

        {foldersQuery.isError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            Could not load folders. Check GET /folders and your permissions.
          </p>
        )}
        {foldersQuery.isLoading && <p className="text-xs text-slate-500">Loading folders...</p>}
        <div className="space-y-2">
          <select className="w-full rounded border p-2 text-sm" value={uploadFolderId} onChange={(e) => setUploadFolderId(e.target.value)}>
            <option value="">Select folder</option>
            {foldersQuery.data?.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.foldername}
              </option>
            ))}
          </select>
          <input type="file" accept="application/pdf" multiple onChange={(e) => setFilesToUpload(e.target.files)} />
          <button onClick={() => uploadFilesMutation.mutate()} className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
            Upload PDFs
          </button>
        </div>

        <h4 className="pt-2 text-sm font-semibold text-slate-700">Files</h4>
        <ul className="space-y-2 text-sm">
          {foldersQuery.data?.flatMap((folder) =>
            folder.files.map((file) => (
              <li key={file.id} className="flex items-center justify-between rounded border border-slate-200 p-2">
                <span className="truncate pr-2">{file.filename}</span>
                <button onClick={() => deleteFileMutation.mutate(file.id)} className="text-xs text-red-600">
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
