/** Query keys emitted by the backend after Google OAuth (`FRONTEND_URL` redirect). */
export const OAUTH_QUERY_KEY = "oauth";
export const OAUTH_REASON_QUERY_KEY = "reason";

export type OAuthReturnStatus = "success" | "pending" | "error";

/** Known `reason` values from the backend; others may appear as plain strings. */
export type OAuthErrorReason =
  | "missing_profile"
  | "no_email"
  | "no_access_token"
  | "session"
  | string
  | undefined;

const FLASH_STORAGE_KEY = "interactive_pdf_oauth_flash";

export type OAuthFlashPayload =
  | { kind: "pending" }
  | { kind: "error"; reason?: string };

export function parseOAuthReturnSearch(search: string): {
  oauth: OAuthReturnStatus;
  reason?: OAuthErrorReason;
} | null {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  const raw = params.get(OAUTH_QUERY_KEY)?.trim().toLowerCase();
  if (!raw || (raw !== "success" && raw !== "pending" && raw !== "error")) {
    return null;
  }
  const oauth = raw as OAuthReturnStatus;
  const reasonRaw = params.get(OAUTH_REASON_QUERY_KEY)?.trim();
  return reasonRaw ? { oauth, reason: reasonRaw } : { oauth };
}

function dispatchOAuthFlash(payload: OAuthFlashPayload): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent<OAuthFlashPayload>("oauth-flash", { detail: payload }));
}

export function persistOAuthFlashMessage(payload: OAuthFlashPayload): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
  dispatchOAuthFlash(payload);
}

export function consumeOAuthFlashMessage(): OAuthFlashPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(FLASH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    sessionStorage.removeItem(FLASH_STORAGE_KEY);
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const o = parsed as Record<string, unknown>;
    if (o.kind === "pending") {
      return { kind: "pending" };
    }
    if (o.kind === "error") {
      return { kind: "error", reason: typeof o.reason === "string" ? o.reason : undefined };
    }
    return null;
  } catch {
    return null;
  }
}

/** Subscribe to OAuth flash messages (persist + CustomEvent). Cleanup on unmount. */
export function subscribeOAuthFlash(listener: (payload: OAuthFlashPayload) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = (event: Event): void => {
    const ce = event as CustomEvent<OAuthFlashPayload>;
    if (ce.detail) {
      listener(ce.detail);
    }
  };
  window.addEventListener("oauth-flash", handler);
  return () => window.removeEventListener("oauth-flash", handler);
}

export function clearOAuthFlashStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(FLASH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function oauthErrorReasonLabel(reason: string | undefined): string {
  switch (reason) {
    case "missing_profile":
      return "Google did not return a profile. Try again or use email sign-in.";
    case "no_email":
      return "No email on your Google account. Use another Google account or email sign-in.";
    case "no_access_token":
      return "Google sign-in could not be completed. Try again.";
    case "session":
      return "Signed in with Google, but we could not restore your session. Try signing in again.";
    default:
      return reason?.trim()
        ? `Something went wrong (${reason}). Try again or use email sign-in.`
        : "Google sign-in failed. Try again or use email sign-in.";
  }
}
