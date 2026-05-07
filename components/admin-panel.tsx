"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, patchUserStatus, signUpApplicantUser } from "@/lib/api";
import { APP_PUBLIC_BASE_URL, APP_USERS_PORTAL_URL } from "@/lib/app-site";
import { parseUserStatus } from "@/lib/user-status";
import { UserStatusBadge } from "@/components/user-status-badge";
import { DeleteUserConfirmDialog } from "@/components/delete-user-confirm-dialog";
import { pickRandomSpineColor } from "@/lib/folder-spine-color";
import { AppUser, Folder, UserStatus } from "@/lib/types";

export function AdminPanel() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [folderName, setFolderName] = useState("");
  const [createFolderLock, setCreateFolderLock] = useState(false);
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [filesToUpload, setFilesToUpload] = useState<FileList | null>(null);
  const [userPendingDelete, setUserPendingDelete] = useState<AppUser | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<AppUser[]>("/users")).data,
  });

  const foldersQuery = useQuery({
    queryKey: ["folders"],
    queryFn: async () => (await api.get<Folder[]>("/folders")).data,
  });

  const createUserMutation = useMutation({
    mutationFn: async () =>
      signUpApplicantUser({
        email,
        username: username.trim(),
        password,
        sendWelcomeEmail: true,
        appBaseUrl: APP_PUBLIC_BASE_URL,
        usersPortalUrl: APP_USERS_PORTAL_URL,
      }),
    onSuccess: () => {
      setEmail("");
      setUsername("");
      setPassword("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUserPendingDelete(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) =>
      patchUserStatus(userId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const createFolderMutation = useMutation({
    mutationFn: async () => {
      const folderCount = foldersQuery.data?.length ?? 0;
      return api.post("/folders", {
        foldername: folderName,
        lock: createFolderLock,
        order: folderCount + 1,
        spineColor: pickRandomSpineColor(),
      });
    },
    onSuccess: () => {
      setFolderName("");
      setCreateFolderLock(false);
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

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const getUserPassword = (user: AppUser) => user.password ?? user.passwordHash ?? "";

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold">Create User</h3>
        <form className="space-y-3" onSubmit={submitCreateUser}>
          <input className="w-full rounded border p-2 text-sm" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="w-full rounded border p-2 text-sm"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={2}
            maxLength={64}
          />
          <input className="w-full rounded border p-2 text-sm" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={createUserMutation.isPending || !email.trim() || !username.trim() || !password}
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
          {usersQuery.data?.map((user) => {
            const userPassword = getUserPassword(user);
            const isPasswordVisible = !!visiblePasswords[user.id];
            const passwordText = userPassword
              ? isPasswordVisible
                ? userPassword
                : "*".repeat(Math.max(userPassword.length, 8))
              : "Not available";

            return (
              <li key={user.id} className="flex items-start justify-between rounded border border-slate-200 p-2">
                <div className="pr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{user.email}</span>
                    {user.username?.trim() ? (
                      <span className="text-slate-600">@{user.username.trim()}</span>
                    ) : null}
                    <UserStatusBadge status={user.status} />
                    <select
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                      value={parseUserStatus(user.status) ?? "WAITING"}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          userId: user.id,
                          status: e.target.value as UserStatus,
                        })
                      }
                      disabled={
                        updateStatusMutation.isPending &&
                        updateStatusMutation.variables?.userId === user.id
                      }
                      aria-label={`Set status for ${user.email}`}
                    >
                      <option value="WAITING">WAITING</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                    <span>Password: {passwordText}</span>
                    {userPassword ? (
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(user.id)}
                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                        className="rounded p-1 text-slate-600 hover:bg-slate-100"
                      >
                        {isPasswordVisible ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3.11-11-8 1.05-2.97 3.14-5.3 5.76-6.67" />
                            <path d="M1 1l22 22" />
                            <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" />
                            <path d="M10.73 5.08A10.94 10.94 0 0 1 12 4c5 0 9.27 3.11 11 8a10.94 10.94 0 0 1-4.07 5.22" />
                          </svg>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUserPendingDelete(user)}
                  disabled={deleteUserMutation.isPending}
                  className="text-xs text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold">Folder & File Management</h3>
        <div className="space-y-2">
          <input className="w-full rounded border p-2 text-sm" placeholder="Folder name" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="folder-lock-checkbox h-[1.125rem] w-[1.125rem] shrink-0"
              checked={createFolderLock}
              onChange={(e) => setCreateFolderLock(e.target.checked)}
            />
            <span>Lock folder (restrict changes until unlocked)</span>
          </label>
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
                {folder.lock ? " (locked)" : ""}
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
                <span className="truncate break-keep pr-2">{file.filename}</span>
                <button onClick={() => deleteFileMutation.mutate(file.id)} className="text-xs text-red-600">
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>

    <DeleteUserConfirmDialog
      open={userPendingDelete !== null}
      displayLabel={
        userPendingDelete?.email?.trim() ||
        (userPendingDelete?.username?.trim() ? `@${userPendingDelete.username.trim()}` : "") ||
        userPendingDelete?.id ||
        ""
      }
      onCancel={() => setUserPendingDelete(null)}
      onConfirm={() => {
        if (!userPendingDelete) {
          return;
        }
        deleteUserMutation.mutate(userPendingDelete.id);
      }}
      pending={deleteUserMutation.isPending}
    />
    </>
  );
}
