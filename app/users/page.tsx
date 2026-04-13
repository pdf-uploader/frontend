"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { isAdminUser } from "@/lib/auth-user";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";

export default function UsersPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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

  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold">Create User</h1>
      <p className="text-sm text-slate-600">Only admins can create new users.</p>

      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          required
        />
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Username"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          required
        />

        <button
          disabled={createUserMutation.isPending}
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          {createUserMutation.isPending ? "Creating..." : "Create User"}
        </button>
      </form>

      {createUserMutation.isSuccess && <p className="text-sm text-green-700">User created successfully.</p>}
      {createUserMutation.error && <p className="text-sm text-red-600">Failed to create user.</p>}
    </section>
  );
}
