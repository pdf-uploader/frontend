"use client";

import type { AppUser } from "@/lib/types";
import {
  getAdminAccountBadgeKind,
  normalizeAuthProvider,
  shouldHideAdminPassword,
} from "@/lib/user-auth-provider";

export function AdminAccountTypeBadge({ user }: { user: AppUser }) {
  const kind = getAdminAccountBadgeKind(user);

  if (kind === "google") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm"
        title="User signs in with Google"
      >
        <GoogleGlyph className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Google
      </span>
    );
  }

  if (kind === "oauth") {
    return (
      <span
        className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-900"
        title="User signs in with OAuth — no local password"
      >
        OAuth
      </span>
    );
  }

  if (kind === "local") {
    return (
      <span
        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600"
        title="Email and password account"
      >
        Email
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center rounded-full border border-dashed border-slate-300 bg-slate-50/80 px-2 py-0.5 text-[11px] font-medium text-slate-500"
      title="Backend did not send authProvider — assuming email/password unless you configure the API"
    >
      Unknown
    </span>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function localPasswordDisplay(user: AppUser): string {
  return user.password ?? user.passwordHash ?? "";
}

function oauthPasswordCaption(user: AppUser): { primary: string; secondary: string } {
  const np = normalizeAuthProvider(user);
  if (np === "google" || user.googleId?.trim() || user.googleSub?.trim()) {
    return { primary: "Sign-in via Google", secondary: "No password stored on this server" };
  }
  return { primary: "OAuth sign-in", secondary: "No password stored on this server" };
}

type AdminPasswordColumnProps = {
  user: AppUser;
  visiblePasswords: Record<string, boolean>;
  onToggleVisibility: (userId: string) => void;
};

/** OAuth / SSO accounts: no password text and no reveal control. */
export function AdminPasswordColumn({ user, visiblePasswords, onToggleVisibility }: AdminPasswordColumnProps) {
  if (shouldHideAdminPassword(user)) {
    const { primary, secondary } = oauthPasswordCaption(user);
    return (
      <div className="max-w-[14rem]">
        <p className="text-xs leading-snug text-slate-500">
          <span className="sr-only">No local password.</span>
          <span className="text-slate-600">{primary}</span>
          <span className="mt-0.5 block font-normal text-slate-400">{secondary}</span>
        </p>
      </div>
    );
  }

  const userPassword = localPasswordDisplay(user);
  if (!userPassword) {
    return <span className="text-slate-400">—</span>;
  }

  const isPasswordVisible = !!visiblePasswords[user.id];
  return (
    <div className="inline-flex items-center gap-2">
      <span className="font-mono text-xs">{isPasswordVisible ? userPassword : "•".repeat(Math.min(Math.max(userPassword.length, 8), 32))}</span>
      <button
        type="button"
        onClick={() => onToggleVisibility(user.id)}
        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
}

/** Compact row for embedded admin lists (AdminPanel card). */
export function AdminPasswordRowLine({
  user,
  visiblePasswords,
  onToggleVisibility,
}: AdminPasswordColumnProps) {
  if (shouldHideAdminPassword(user)) {
    const cap = oauthPasswordCaption(user);
    const label =
      cap.primary === "Sign-in via Google" ? "Google sign-in — none stored" : "OAuth sign-in — none stored";
    return (
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span className="text-slate-500">Password:</span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{label}</span>
      </div>
    );
  }

  const userPassword = localPasswordDisplay(user);
  const isPasswordVisible = !!visiblePasswords[user.id];
  const passwordText = userPassword
    ? isPasswordVisible
      ? userPassword
      : "•".repeat(Math.min(Math.max(userPassword.length, 8), 32))
    : "Not available";

  return (
    <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
      <span>Password: {passwordText}</span>
      {userPassword ? (
        <button
          type="button"
          onClick={() => onToggleVisibility(user.id)}
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
  );
}
