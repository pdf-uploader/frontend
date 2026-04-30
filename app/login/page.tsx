"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { getBackendErrorMessage } from "@/lib/api-errors";
import { checkEmailRegisteredForLogin, signIn } from "@/lib/api";
import { AuthBrandedShell, AuthPageFooterLinks } from "@/components/auth-branded-shell";

const AUTH_CHECK_EMAIL_DISABLED = process.env.NEXT_PUBLIC_AUTH_CHECK_EMAIL_DISABLED === "true";

const LOGIN_CREDENTIALS_ERROR = "Incorrect email or password.";

type AuthStep = "email" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [emailLookupError, setEmailLookupError] = useState("");

  const checkEmailMutation = useMutation({
    mutationFn: (addr: string) => checkEmailRegisteredForLogin(addr),
  });

  const loginMutation = useMutation({
    mutationFn: async () => signIn(email.trim(), password),
    onSuccess: () => router.replace("/"),
  });

  const onSubmitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return;
    }
    setEmailLookupError("");

    if (AUTH_CHECK_EMAIL_DISABLED) {
      setEmail(trimmed);
      setStep("password");
      return;
    }

    try {
      const exists = await checkEmailMutation.mutateAsync(trimmed);
      if (!exists) {
        setEmailLookupError("There is no account for this email.");
        return;
      }
      setEmail(trimmed);
      setStep("password");
    } catch (error) {
      setEmailLookupError(getBackendErrorMessage(error, "Could not verify this email. Try again."));
    }
  };

  const onSubmitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate();
  };

  return (
    <AuthBrandedShell>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-4 pt-6 sm:px-6 sm:pb-10 sm:pt-10">
        <div className="auth-openai-panel">
          <div className="mb-5 flex items-center justify-between gap-2 sm:mb-4">
            {step === "password" ? (
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setPassword("");
                  setEmailLookupError("");
                  loginMutation.reset();
                }}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-sky-500/50"
                aria-label="Back to email"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            ) : (
              <span className="inline-flex h-9 w-9 shrink-0" aria-hidden />
            )}
            <Link
              href="/"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 outline-none transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-sky-500/50"
              aria-label="Close and return home"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </Link>
          </div>
          <div className="mb-8 text-center">
            <h1 className="text-[1.6rem] font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">
              {step === "email" ? "Login" : "Welcome back"}
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-slate-600">
              {step === "email"
                ? "Enter your work email to access the integrated manual workspace."
                : `Enter your password for ${email}`}
            </p>
          </div>

          {step === "email" && (
            <>
              <form onSubmit={onSubmitEmail} className="space-y-5">
                <label className="sr-only" htmlFor="login-email">
                  Email address
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailLookupError("");
                  }}
                  placeholder="Email address"
                  className="auth-openai-input"
                  required
                />
                <button
                  type="submit"
                  disabled={checkEmailMutation.isPending}
                  className="auth-openai-btn-primary"
                >
                  {checkEmailMutation.isPending ? "Checking…" : "Continue"}
                </button>
              </form>
              {emailLookupError && (
                <p className="mt-4 text-center text-sm text-rose-600" role="alert">
                  {LOGIN_CREDENTIALS_ERROR}{" "}
                  <Link href="/signup" className="font-medium text-sky-700 underline-offset-2 hover:underline">
                    Create an account
                  </Link>
                </p>
              )}
            </>
          )}

          {step === "password" && (
            <form onSubmit={onSubmitPassword} className="space-y-4">
              <label className="sr-only" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={isPasswordHidden ? "password" : "text"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  className="auth-openai-input pr-12"
                  required
                  minLength={1}
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
              <button type="submit" disabled={loginMutation.isPending} className="auth-openai-btn-primary">
                {loginMutation.isPending ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}

          {loginMutation.error && step === "password" && (
            <p className="mt-4 text-center text-sm text-rose-600" role="alert">
              {LOGIN_CREDENTIALS_ERROR}
            </p>
          )}

          <p className="mt-9 text-center text-[13px] text-slate-500">
            Need an account?{" "}
            <Link href="/signup" className="font-medium text-sky-700 underline-offset-2 hover:text-sky-900 hover:underline">
              Create account
            </Link>
          </p>
        </div>
        <AuthPageFooterLinks />
      </div>
    </AuthBrandedShell>
  );
}
