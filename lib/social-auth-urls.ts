/**
 * Social login entry URLs (backend OAuth redirects).
 * Express: `GET /auth/google` → `passport.authenticate("google", …)`.
 */

const API_BASE = (process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL ?? "http://localhost:4000").replace(/\/$/, "");

export function getGoogleOAuthStartUrl(): string {
  const configured = process.env.NEXT_PUBLIC_AUTH_GOOGLE_URL?.trim();
  if (configured) {
    return configured;
  }
  /** Matches `authRouter.get("/google", passport.authenticate("google", …))` mounted at `/auth`. */
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
