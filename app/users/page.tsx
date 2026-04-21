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
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="ui-input"
          required
        />

        <button
          disabled={createUserMutation.isPending}
          className="ui-btn-primary"
        >
          {createUserMutation.isPending ? "Creating..." : "Create User"}
        </button>
      </form>

      {createUserMutation.isSuccess && <p className="text-sm text-green-700">User created successfully.</p>}
      {createUserMutation.error && <p className="text-sm text-red-600">Failed to create user.</p>}
    </section>
  );
}
