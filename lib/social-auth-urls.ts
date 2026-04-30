/**
 * Social login entry URLs (backend OAuth redirects).
 * Express: `GET /auth/google` → `passport.authenticate("google", …)`.
 * Override with `NEXT_PUBLIC_AUTH_GOOGLE_URL`; otherwise uses `${NEXT_PUBLIC_EXPRESS_SERVER_URL}/auth/google`.
 */

const API_BASE = (process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL ?? "http://localhost:4000").replace(/\/$/, "");

export function getGoogleAuthUrl(): string {
  const configured = process.env.NEXT_PUBLIC_AUTH_GOOGLE_URL?.trim();
  if (configured) {
    return configured;
  }
  return `${API_BASE}/auth/google`;
}

/** WhatsApp invite or OAuth-style URL; when absent the UI shows a disabled placeholder. */
export function getWhatsAppAuthUrl(): string | null {
  const wa =
    process.env.NEXT_PUBLIC_AUTH_WHATSAPP_URL?.trim() ??
    process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL?.trim() ??
    "";
  return wa.length > 0 ? wa : null;
}
