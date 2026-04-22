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
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);

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
    <div className="ui-shell flex min-h-[75vh] items-center justify-center">
      <div className="ui-card w-full max-w-md p-6 sm:p-7">
        <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          Welcome back
        </p>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mb-5 text-sm text-slate-600">Access your PDF management workspace.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="ui-input"
            required
          />
          <div className="relative">
            <input
              type={isPasswordHidden ? "password" : "text"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="ui-input pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setIsPasswordHidden((previous) => !previous)}
              aria-label={isPasswordHidden ? "Show password" : "Hide password"}
              className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-slate-500 hover:text-slate-700"
            >
              {isPasswordHidden ? (
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
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="ui-btn-primary w-full"
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {loginMutation.error && <p className="mt-3 text-sm text-red-600">{loginErrorMessage}</p>}
      </div>
    </div>
  );
}
