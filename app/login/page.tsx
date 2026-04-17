"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { signIn } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => signIn(email, password),
    onSuccess: () => router.replace("/"),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate();
  };

  const loginErrorMessage = (() => {
    if (!loginMutation.error) {
      return "";
    }
    if (axios.isAxiosError(loginMutation.error)) {
      const apiMessage =
        (loginMutation.error.response?.data as { message?: string } | undefined)?.message ??
        loginMutation.error.message;
      return apiMessage || "Login failed. Check credentials and try again.";
    }
    if (loginMutation.error instanceof Error) {
      return loginMutation.error.message || "Login failed. Check credentials and try again.";
    }
    return "Login failed. Check credentials and try again.";
  })();

  return (
    <div className="mx-auto mt-20 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
        <p className="mb-5 text-sm text-slate-600">Access your PDF management workspace.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {loginMutation.error && <p className="mt-3 text-sm text-red-600">{loginErrorMessage}</p>}
    </div>
  );
}
