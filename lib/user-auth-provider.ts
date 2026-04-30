import type { AppUser } from "@/lib/types";

export type NormalizedAuthProvider = "local" | "google" | "oauth" | "unknown";

function pickProviderString(user: AppUser): string | undefined {
  const candidates = [user.authProvider, user.provider, user.oauthProvider, user.signInProvider];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.trim();
    }
  }
  return undefined;
}

function matchesLocalRaw(raw: string): boolean {
  return ["local", "email", "password", "credentials", "credential"].includes(raw);
}

function matchesGoogleRaw(raw: string, user: AppUser): boolean {
  if (user.googleId?.trim() || user.googleSub?.trim()) {
    return true;
  }
  return (
    raw === "google" ||
    raw === "oauth_google" ||
    raw === "google_oauth" ||
    raw.endsWith("_google") ||
    raw.startsWith("google_")
  );
}

/** Non-Google OAuth / SSO provider hints from API strings */
function matchesGenericOAuthRaw(raw: string): boolean {
  if (!raw || matchesLocalRaw(raw)) {
    return false;
  }
  if (
    raw === "google" ||
    raw === "oauth_google" ||
    raw === "google_oauth" ||
    raw.endsWith("_google") ||
    raw.startsWith("google_")
  ) {
    return false;
  }
  return (
    raw === "oauth" ||
    raw.includes("oauth") ||
    raw.includes("openid") ||
    raw.includes("sso") ||
    raw.includes("saml") ||
    ["github", "facebook", "microsoft", "apple", "twitter", "linkedin", "whatsapp"].some((s) => raw === s || raw.includes(s))
  );
}

/**
 * Normalizes how the user signs in. Prefer explicit backend fields (`authProvider`, etc.).
 */
export function normalizeAuthProvider(user: AppUser): NormalizedAuthProvider {
  const raw = pickProviderString(user)?.toLowerCase() ?? "";

  if (user.hasLocalPassword === false) {
    if (matchesGoogleRaw(raw, user)) {
      return "google";
    }
    return "oauth";
  }

  if (matchesLocalRaw(raw)) {
    return "local";
  }
  if (matchesGoogleRaw(raw, user)) {
    return "google";
  }
  if (matchesGenericOAuthRaw(raw)) {
    return "oauth";
  }

  if (user.googleId?.trim() || user.googleSub?.trim()) {
    return "google";
  }

  return "unknown";
}

/** bcrypt / argon2 / scrypt — anything else in `passwordHash` without plaintext password is treated as non-local secret (e.g. OAuth token ciphertext). */
export function looksLikePasswordHashAlgorithm(value: string): boolean {
  const v = value.trim();
  if (/^\$2[aby]\$\d{2}\$/.test(v)) {
    return true;
  }
  if (v.startsWith("$argon2")) {
    return true;
  }
  if (v.startsWith("$scrypt")) {
    return true;
  }
  return false;
}

/** Badge label: unknown API rows that clearly aren't bcrypt-style password hashes infer `oauth`. */
export function getAdminAccountBadgeKind(user: AppUser): NormalizedAuthProvider {
  const base = normalizeAuthProvider(user);
  if (base !== "unknown") {
    return base;
  }
  const pwd = user.password?.trim() ?? "";
  const hash = user.passwordHash?.trim() ?? "";
  if (!pwd && hash && !looksLikePasswordHashAlgorithm(hash)) {
    return "oauth";
  }
  return "unknown";
}

/** Never render password / hash / reveal control for OAuth-only rows (any provider). */
export function shouldHideAdminPassword(user: AppUser): boolean {
  if (user.hasLocalPassword === false) {
    return true;
  }
  const base = normalizeAuthProvider(user);
  if (base === "google" || base === "oauth") {
    return true;
  }
  const pwd = user.password?.trim() ?? "";
  const hash = user.passwordHash?.trim() ?? "";
  if (!pwd && hash && !looksLikePasswordHashAlgorithm(hash)) {
    return true;
  }
  return false;
}

export function isGoogleOAuthAccount(user: AppUser): boolean {
  return normalizeAuthProvider(user) === "google";
}

export function isOAuthAccount(user: AppUser): boolean {
  return shouldHideAdminPassword(user);
}
