"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getBackendErrorMessage } from "@/lib/api-errors";
import { isAdminUser } from "@/lib/auth-user";
import { api, patchUserStatus, signUpApplicantUser } from "@/lib/api";
import { APP_PUBLIC_BASE_URL, APP_USERS_PORTAL_URL } from "@/lib/app-site";
import { useAuth } from "@/lib/hooks/use-auth";
import { parseUserStatus } from "@/lib/user-status";
import { AppUser, UserStatus } from "@/lib/types";
import { DeleteUserConfirmDialog } from "@/components/delete-user-confirm-dialog";
import { AdminAccountTypeBadge, AdminPasswordColumn } from "@/components/admin-user-credentials";

export default function UsersPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isCreatePasswordHidden, setIsCreatePasswordHidden] = useState(true);
  const [visibleUserPasswords, setVisibleUserPasswords] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL");
  const [userPendingDelete, setUserPendingDelete] = useState<AppUser | null>(null);
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<AppUser[]>("/users")).data,
  });

  const displayedUsers = useMemo(() => {
    const rows = usersQuery.data ?? [];
    if (statusFilter === "ALL") {
      return rows;
    }
    return rows.filter((row) => {
      const s = parseUserStatus(row.status) ?? "WAITING";
      return s === statusFilter;
    });
  }, [usersQuery.data, statusFilter]);

  useEffect(() => {
    if (user && !isAdminUser(user)) {
      router.replace("/");
    }
  }, [router, user]);

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
      void usersQuery.refetch();
    },
  });
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      void usersQuery.refetch();
      setUserPendingDelete(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) =>
      patchUserStatus(userId, status),
    onSuccess: () => {
      void usersQuery.refetch();
    },
  });

  if (token && !user) {
    return <p className="text-sm text-slate-600">Loading profile...</p>;
  }

  if (!user || !isAdminUser(user)) {
    return <p className="text-sm text-slate-600">Admin access required.</p>;
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    createUserMutation.mutate();
  };

  const toggleUserPasswordVisibility = (userId: string) => {
    setVisibleUserPasswords((previous) => ({ ...previous, [userId]: !previous[userId] }));
  };
  const createUserErrorMessage = getBackendErrorMessage(createUserMutation.error, "Failed to create user.");

  return (
    <section className="ui-shell mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100"
            aria-label="Back to home"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <p className="text-sm font-medium text-slate-800 sm:text-base">Manage Users</p>
        </div>
        <p className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          Admin
        </p>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create User</h1>
        <p className="mt-1 text-sm text-slate-600">Only admins can create new users.</p>
      </div>

      <form onSubmit={onSubmit} className="ui-card space-y-3 p-5">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="ui-input"
          required
        />
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          className="ui-input"
          autoComplete="username"
          required
          minLength={2}
          maxLength={64}
        />
        <div className="relative">
          <input
            type={isCreatePasswordHidden ? "password" : "text"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="ui-input pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setIsCreatePasswordHidden((previous) => !previous)}
            aria-label={isCreatePasswordHidden ? "Show password" : "Hide password"}
            className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-slate-500 hover:text-slate-700"
          >
            {isCreatePasswordHidden ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3l18 18" />
                <path d="M10.58 10.58a2 2 0 102.84 2.84" />
                <path d="M9.88 5.09A10.94 10.94 0 0112 5c5.05 0 9.27 3.11 10 7-.21 1.13-.73 2.2-1.5 3.11" />
                <path d="M6.61 6.61C4.62 7.9 3.26 9.82 3 12c.73 3.89 4.95 7 10 7 2.18 0 4.2-.58 5.9-1.59" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-slate-600">
          Password must be at least 8 characters and include one uppercase letter, one lowercase letter, one number, and a special character (e.g. *&!).
        </p>

        <button
          disabled={createUserMutation.isPending}
          className="ui-btn-primary"
        >
          {createUserMutation.isPending ? "Creating..." : "Create User"}
        </button>
      </form>

      {createUserMutation.isSuccess && <p className="text-sm text-green-700">User created successfully.</p>}
      {createUserMutation.error && <p className="text-sm text-red-600">{createUserErrorMessage}</p>}
      <section className="ui-card space-y-3 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-900">All Users</h2>
          {usersQuery.data && usersQuery.data.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <span className="shrink-0">Filter by status</span>
              <select
                className="ui-input max-w-[11rem] py-1.5 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | UserStatus)}
              >
                <option value="ALL">All statuses</option>
                <option value="WAITING">WAITING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </label>
          )}
        </div>
        {usersQuery.isLoading && <p className="text-sm text-slate-600">Loading users...</p>}
        {usersQuery.error && <p className="text-sm text-red-600">{getBackendErrorMessage(usersQuery.error, "Failed to load users.")}</p>}
        {usersQuery.data && usersQuery.data.length === 0 && <p className="text-sm text-slate-600">No users found.</p>}
        {usersQuery.data && usersQuery.data.length > 0 && displayedUsers.length === 0 && (
          <p className="text-sm text-slate-600">No users match this status filter.</p>
        )}
        {displayedUsers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="px-2 py-2 font-semibold">Email</th>
                  <th className="px-2 py-2 font-semibold">Username</th>
                  <th className="px-2 py-2 font-semibold">Account</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Password</th>
                  <th className="px-2 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayedUsers.map((listedUser) => (
                  <tr key={listedUser.id} className="border-b border-slate-100 text-slate-700">
                    <td className="px-2 py-2">{listedUser.email || "-"}</td>
                    <td className="px-2 py-2">{listedUser.username?.trim() || "-"}</td>
                    <td className="px-2 py-2 align-middle">
                      <AdminAccountTypeBadge user={listedUser} />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        className="ui-input max-w-[11rem] py-1.5 text-xs"
                        value={parseUserStatus(listedUser.status) ?? "WAITING"}
                        onChange={(event) =>
                          updateStatusMutation.mutate({
                            userId: listedUser.id,
                            status: event.target.value as UserStatus,
                          })
                        }
                        disabled={
                          updateStatusMutation.isPending &&
                          updateStatusMutation.variables?.userId === listedUser.id
                        }
                        aria-label={`Set status for ${listedUser.email}`}
                      >
                        <option value="WAITING">WAITING</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                      </select>
                    </td>
                    <td className="px-2 py-2 align-top">
                      <AdminPasswordColumn
                        user={listedUser}
                        visiblePasswords={visibleUserPasswords}
                        onToggleVisibility={toggleUserPasswordVisibility}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => setUserPendingDelete(listedUser)}
                        aria-label={`Delete user ${listedUser.email ?? listedUser.id}`}
                        title="Delete user"
                        disabled={deleteUserMutation.isPending}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18" />
                          <path d="M8 6V4h8v2" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {deleteUserMutation.error && <p className="text-sm text-red-600">{getBackendErrorMessage(deleteUserMutation.error, "Failed to delete user.")}</p>}
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
        {updateStatusMutation.error && (
          <p className="text-sm text-red-600">{getBackendErrorMessage(updateStatusMutation.error, "Failed to update status.")}</p>
        )}
      </section>
    </section>
  );
}
