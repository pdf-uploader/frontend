"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { signUp } from "@/lib/api";
import { AuthBrandedShell, AuthPageFooterLinks } from "@/components/auth-branded-shell";
import { AuthProviderDivider, SocialAuthButtons } from "@/components/social-auth-buttons";

type AuthStep = "email" | "password";

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);

  const signUpMutation = useMutation({
    mutationFn: async () => signUp(email.trim(), password, username.trim()),
    onSuccess: () => router.replace("/login?registered=1"),
  });

  const onSubmitEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedUser = username.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return;
    }
    if (!trimmedUser) {
      return;
    }
    setEmail(trimmedEmail);
    setUsername(trimmedUser);
    setStep("password");
  };

  const onSubmitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signUpMutation.mutate();
  };

  const errorMessage = (() => {
    if (!signUpMutation.error) {
      return "";
    }
    if (axios.isAxiosError(signUpMutation.error)) {
      const apiMessage =
        (signUpMutation.error.response?.data as { message?: string } | undefined)?.message ??
        signUpMutation.error.message;
      return apiMessage || "Could not create account. Try again.";
    }
    if (signUpMutation.error instanceof Error) {
      return signUpMutation.error.message || "Could not create account. Try again.";
    }
    return "Could not create account. Try again.";
  })();

  return (
    <AuthBrandedShell authHighlight="signup">
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-4 pt-6 sm:px-6 sm:pb-10 sm:pt-10">
        <div className="auth-openai-panel">
          <div className="mb-5 flex justify-end sm:mb-4">
            <Link
              href="/"
              className="rounded-full p-2 text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-sky-500/50"
              aria-label="Close and return home"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Link>
          </div>
          <div className="mb-8 text-center">
            <h1 className="text-[1.6rem] font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">
              {step === "email" ? "Create your account" : "Choose a password"}
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-slate-600">
              {step === "email"
                ? "Use Google or your email. Access may require administrator approval."
                : `Create a secure password for ${email}`}
            </p>
          </div>

          {step === "email" && (
            <>
              <SocialAuthButtons mode="signup" />
              <AuthProviderDivider label="or" />
              <form onSubmit={onSubmitEmail} className="space-y-5">
                <label className="sr-only" htmlFor="signup-email">
                  Email address
                </label>
                <input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="auth-openai-input"
                  required
                />
                <label className="sr-only" htmlFor="signup-username">
                  Username
                </label>
                <input
                  id="signup-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                  className="auth-openai-input"
                  required
                  minLength={2}
                  maxLength={64}
                />
                <button type="submit" className="auth-openai-btn-primary">
                  Continue
                </button>
              </form>
            </>
          )}

          {step === "password" && (
            <form onSubmit={onSubmitPassword} className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-600">
                <span className="font-medium text-slate-800">{username.trim()}</span>
                <span className="text-slate-400">·</span>
                <span className="truncate">{email}</span>
                <button
                  type="button"
                  className="ml-auto shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => {
                    setStep("email");
                    setPassword("");
                    signUpMutation.reset();
                  }}
                >
                  Change email
                </button>
              </div>
              <label className="sr-only" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={isPasswordHidden ? "password" : "text"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="auth-openai-input pr-12"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordHidden((previous) => !previous)}
                  aria-label={isPasswordHidden ? "Show password" : "Hide password"}
                  className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-slate-400 transition hover:text-slate-700"
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
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={!isPasswordHidden}
                  onChange={() => setIsPasswordHidden((previous) => !previous)}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-slate-900"
                />
                Show password
              </label>
              <button type="submit" disabled={signUpMutation.isPending} className="auth-openai-btn-primary">
                {signUpMutation.isPending ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          {signUpMutation.error && step === "password" && (
            <p className="mt-4 text-center text-sm text-rose-600">{errorMessage}</p>
          )}

          <p className="mt-9 text-center text-[13px] text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-sky-700 underline-offset-2 hover:text-sky-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        <AuthPageFooterLinks />
      </div>
    </AuthBrandedShell>
  );
}
