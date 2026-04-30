"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { signUp } from "@/lib/api";
import { AuthBrandedShell, AuthPageFooterLinks } from "@/components/auth-branded-shell";
import { SignupSuccessCheck } from "@/components/signup-success-check";

type AuthStep = "email" | "password";

/** Live criteria for UI checklist — keep in sync with `signupPasswordValidationMessage`. */
function signupPasswordChecks(pw: string) {
  const t = pw.trim();
  return {
    lengthOk: t.length >= 8,
    lowerOk: /[a-z]/.test(t),
    upperOk: /[A-Z]/.test(t),
    digitOk: /\d/.test(t),
    specialOk: /[^A-Za-z0-9]/.test(t),
  };
}

function SignupPasswordRule({
  ok,
  label,
  emphasizeFail,
}: {
  ok: boolean;
  label: string;
  emphasizeFail?: boolean;
}) {
  const failed = Boolean(emphasizeFail && !ok);
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={[
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          ok
            ? "border-emerald-500 bg-emerald-500 text-white"
            : failed
              ? "border-rose-500 bg-rose-50 text-transparent"
              : "border-slate-300 bg-white",
        ].join(" ")}
        aria-hidden
      >
        {ok ? (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6l2.5 2.5L10 3" />
          </svg>
        ) : null}
      </span>
      <span
        className={`text-[13px] leading-snug ${ok ? "font-medium text-slate-900" : failed ? "font-semibold text-rose-600" : "text-slate-500"
          }`}
      >
        <span className="sr-only">{ok ? "Met: " : failed ? "Missing: " : "Not met: "}</span>
        {label}
      </span>
    </li>
  );
}

/** Matches backend-style rules; avoids native validation bubbles (locale-dependent). */
function signupPasswordValidationMessage(pw: string): string | undefined {
  const trimmed = pw.trim();
  if (!trimmed) {
    return "Enter a password.";
  }
  if (trimmed.length < 8) {
    return "Must be at least 8 characters.";
  }
  if (!/[a-z]/.test(trimmed)) {
    return "Include one lowercase letter (a-z).";
  }
  if (!/[A-Z]/.test(trimmed)) {
    return "Include one uppercase letter (A-Z).";
  }
  if (!/\d/.test(trimmed)) {
    return "Include at least one number (0-9).";
  }
  if (!/[^A-Za-z0-9]/.test(trimmed)) {
    return "Include a special character (e.g. *&!).";
  }
  return undefined;
}

export default function SignUpPage() {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registrationSucceeded, setRegistrationSucceeded] = useState(false);
  /** Celebrate phase = slow check-only hero; details = full thank-you screen after animation completes */
  const [successRevealPhase, setSuccessRevealPhase] = useState<"celebrate" | "details">("celebrate");
  const [isPasswordHidden, setIsPasswordHidden] = useState(true);
  const [passwordSubmitRejected, setPasswordSubmitRejected] = useState(false);
  const [passwordBlinkTick, setPasswordBlinkTick] = useState(0);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSignupCheckComplete = useCallback(() => {
    setSuccessRevealPhase("details");
  }, []);

  useEffect(() => {
    if (!registrationSucceeded) {
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSuccessRevealPhase(reduced ? "details" : "celebrate");
  }, [registrationSucceeded]);

  /** Fallback if draw completion never fires */
  useEffect(() => {
    if (!registrationSucceeded || successRevealPhase !== "celebrate") {
      return;
    }
    const id = window.setTimeout(() => {
      setSuccessRevealPhase((previous) => (previous === "celebrate" ? "details" : previous));
    }, 2000);
    return () => window.clearTimeout(id);
  }, [registrationSucceeded, successRevealPhase]);

  useEffect(() => {
    if (!passwordBlinkTick) {
      return;
    }
    const el = passwordInputRef.current;
    if (!el) {
      return;
    }
    el.classList.remove("signup-password-input-blink");
    void el.offsetWidth;
    el.classList.add("signup-password-input-blink");
    const done = () => el.classList.remove("signup-password-input-blink");
    el.addEventListener("animationend", done, { once: true });
    return () => el.removeEventListener("animationend", done);
  }, [passwordBlinkTick]);

  const signUpMutation = useMutation({
    mutationFn: async () => signUp(email.trim(), password, username.trim()),
    onSuccess: () => setRegistrationSucceeded(true),
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

  const goBackToEmailStep = () => {
    setStep("email");
    setPassword("");
    setPasswordSubmitRejected(false);
    signUpMutation.reset();
  };

  const onSubmitPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const msg = signupPasswordValidationMessage(password);
    if (msg) {
      setPasswordSubmitRejected(true);
      setPasswordBlinkTick((n) => n + 1);
      queueMicrotask(() => passwordInputRef.current?.focus());
      return;
    }
    setPasswordSubmitRejected(false);
    signUpMutation.mutate();
  };

  const pwChecks = signupPasswordChecks(password);

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
          <div className="mb-5 flex items-center justify-between gap-2 sm:mb-4">
            {step === "password" && !registrationSucceeded ? (
              <button
                type="button"
                onClick={goBackToEmailStep}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-sky-500/50"
                aria-label="Back to email and nickname"
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
            {!registrationSucceeded ? (
              <>
                <h1 className="text-[1.6rem] font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">
                  {step === "email" ? "Create your account" : "Choose a password"}
                </h1>
              </>
            ) : successRevealPhase === "details" ? (
              <h1 className="text-[1.6rem] font-semibold tracking-tight text-slate-900 sm:text-[1.8rem]">
                Thanks for signing up!
              </h1>
            ) : (
              <span className="sr-only">Success</span>
            )}
          </div>

          {registrationSucceeded ? (
            <div
              className={
                successRevealPhase === "celebrate"
                  ? "flex min-h-[min(42vh,280px)] flex-col items-center justify-center py-2"
                  : "space-y-7 text-center"
              }
            >
              <SignupSuccessCheck
                celebrate={successRevealPhase === "celebrate"}
                onDrawComplete={handleSignupCheckComplete}
              />
              {successRevealPhase === "details" ? (
                <>
                  <div className="mx-auto max-w-[min(100%,20rem)] space-y-3 text-left">
                    <p className="text-[15px] font-semibold leading-snug text-slate-900">Account created</p>
                    <div className="space-y-2 text-[14px] leading-relaxed text-slate-600">
                      <p>An administrator needs to approve your access before you can sign in.</p>
                      <p>
                        We&apos;ll email{" "}
                        <span className="font-medium text-slate-900">{email.trim()}</span>
                        {" "}
                        when you&apos;re ready.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="auth-openai-btn-primary inline-flex w-full items-center justify-center no-underline"
                  >
                    Continue to sign in
                  </Link>
                </>
              ) : null}
            </div>
          ) : null}

          {step === "email" && !registrationSucceeded && (
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
          )}

          {step === "password" && !registrationSucceeded && (
            <form noValidate lang="en" onSubmit={onSubmitPassword} className="space-y-4">
              <label className="sr-only" htmlFor="signup-password">
                Password
              </label>
              <div className="relative overflow-visible">
                <input
                  ref={passwordInputRef}
                  id="signup-password"
                  type={isPasswordHidden ? "password" : "text"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPassword(value);
                    const c = signupPasswordChecks(value);
                    if (c.lengthOk && c.lowerOk && c.upperOk && c.digitOk && c.specialOk) {
                      setPasswordSubmitRejected(false);
                    }
                  }}
                  placeholder="Password"
                  className={[
                    "auth-openai-input pr-12",
                    passwordSubmitRejected ? "border-rose-400/95 ring-2 ring-rose-400/45" : "",
                  ].join(" ")}
                  aria-describedby="signup-password-hint"
                  aria-invalid={passwordSubmitRejected ? true : undefined}
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

              <div
                id="signup-password-hint"
                lang="en"
                aria-label="Password requirements"
                aria-live="polite"
                className="mt-3 rounded-xl border border-slate-200/90 bg-slate-50/95 px-3.5 py-3 text-left shadow-sm ring-1 ring-slate-200/60 sm:px-4"
              >
                <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-slate-700">Password rules</p>
                <ul className="space-y-2">
                  <SignupPasswordRule
                    ok={pwChecks.lengthOk}
                    emphasizeFail={passwordSubmitRejected}
                    label="At least 8 characters"
                  />
                  <SignupPasswordRule
                    ok={pwChecks.lowerOk}
                    emphasizeFail={passwordSubmitRejected}
                    label="One lowercase letter (a-z)"
                  />
                  <SignupPasswordRule
                    ok={pwChecks.upperOk}
                    emphasizeFail={passwordSubmitRejected}
                    label="One uppercase letter (A-Z)"
                  />
                  <SignupPasswordRule
                    ok={pwChecks.digitOk}
                    emphasizeFail={passwordSubmitRejected}
                    label="At least one number (0-9)"
                  />
                  <SignupPasswordRule
                    ok={pwChecks.specialOk}
                    emphasizeFail={passwordSubmitRejected}
                    label="One special character (e.g. *&!)"
                  />
                </ul>
              </div>

              <button type="submit" disabled={signUpMutation.isPending} className="auth-openai-btn-primary">
                {signUpMutation.isPending ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}

          {signUpMutation.error && step === "password" && !registrationSucceeded && (
            <p className="mt-4 text-center text-sm text-rose-600">{errorMessage}</p>
          )}

          {!registrationSucceeded && (
            <p className="mt-9 text-center text-[13px] text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-sky-700 underline-offset-2 hover:text-sky-900 hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
        <AuthPageFooterLinks />
      </div>
    </AuthBrandedShell>
  );
}
