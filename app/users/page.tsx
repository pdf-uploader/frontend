"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { isAdminUser } from "@/lib/auth-user";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { AppUser } from "@/lib/types";

export default function UsersPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isCreatePasswordHidden, setIsCreatePasswordHidden] = useState(true);
  const [visibleUserPasswords, setVisibleUserPasswords] = useState<Record<string, boolean>>({});
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<AppUser[]>("/users")).data,
  });

  useEffect(() => {
    if (user && !isAdminUser(user)) {
      router.replace("/");
    }
  }, [router, user]);

  const createUserMutation = useMutation({
    mutationFn: async () => api.post("/users/signUp/user", { email, username, password }),
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
  const createUserErrorMessage = getBackendErrorMessage(createUserMutation.error);

  return (
    <section className="ui-shell mx-auto max-w-2xl space-y-5">
      <div>
        <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          Admin
        </p>
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
          required
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
          Password must be at least 8 characters and include 1 special character and 1 uppercase letter.
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
        <h2 className="text-base font-semibold text-slate-900">All Users</h2>
        {usersQuery.isLoading && <p className="text-sm text-slate-600">Loading users...</p>}
        {usersQuery.error && <p className="text-sm text-red-600">{getBackendErrorMessage(usersQuery.error)}</p>}
        {usersQuery.data && usersQuery.data.length === 0 && <p className="text-sm text-slate-600">No users found.</p>}
        {usersQuery.data && usersQuery.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-700">
                  <th className="px-2 py-2 font-semibold">Email</th>
                  <th className="px-2 py-2 font-semibold">Username</th>
                  <th className="px-2 py-2 font-semibold">Role</th>
                  <th className="px-2 py-2 font-semibold">Created</th>
                  <th className="px-2 py-2 font-semibold">Password</th>
                  <th className="px-2 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.map((listedUser) => (
                  <tr key={listedUser.id} className="border-b border-slate-100 text-slate-700">
                    <td className="px-2 py-2">{listedUser.email || "-"}</td>
                    <td className="px-2 py-2">{listedUser.username || "-"}</td>
                    <td className="px-2 py-2">{listedUser.role || "-"}</td>
                    <td className="px-2 py-2">{formatCreatedAt(listedUser.createdAt)}</td>
                    <td className="px-2 py-2">
                      {(() => {
                        const userPassword = listedUser.password ?? listedUser.passwordHash ?? "";
                        if (!userPassword) {
                          return <span>-</span>;
                        }

                        const isPasswordVisible = !!visibleUserPasswords[listedUser.id];
                        return (
                          <div className="inline-flex items-center gap-2">
                            <span>{isPasswordVisible ? userPassword : "*".repeat(Math.max(userPassword.length, 8))}</span>
                            <button
                              type="button"
                              onClick={() => toggleUserPasswordVisibility(listedUser.id)}
                              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              {isPasswordVisible ? (
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 3l18 18" />
                                  <path d="M10.58 10.58a2 2 0 102.84 2.84" />
                                  <path d="M9.88 5.09A10.94 10.94 0 0112 5c5.05 0 9.27 3.11 10 7-.21 1.13-.73 2.2-1.5 3.11" />
                                  <path d="M6.61 6.61C4.62 7.9 3.26 9.82 3 12c.73 3.89 4.95 7 10 7 2.18 0 4.2-.58 5.9-1.59" />
                                </svg>
                              )}
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        type="button"
                        onClick={() => deleteUserMutation.mutate(listedUser.id)}
                        aria-label={`Delete user ${listedUser.email ?? listedUser.username ?? listedUser.id}`}
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
        {deleteUserMutation.error && <p className="text-sm text-red-600">{getBackendErrorMessage(deleteUserMutation.error)}</p>}
      </section>
    </section>
  );
}

function getBackendErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | string | undefined;
    if (typeof data === "string" && data.trim()) {
      return data;
    }
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
    }
    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Failed to create user.";
}

function formatCreatedAt(createdAt?: string): string {
  if (!createdAt) {
    return "-";
  }

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return createdAt;
  }

  return parsedDate.toLocaleString();
}
