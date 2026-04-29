/**
 * Social login entry URLs (backend OAuth redirects).
 * Express: `GET /auth/google` → `passport.authenticate("google", …)`.
 * When `NEXT_PUBLIC_AUTH_GOOGLE_URL` is unset, the UI shows a disabled placeholder (same pattern as WhatsApp).
 */

export function getGoogleAuthUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_AUTH_GOOGLE_URL?.trim() ?? "";
  return configured.length > 0 ? configured : null;
}

/** WhatsApp invite or OAuth-style URL; when absent the UI shows a disabled placeholder. */
export function getWhatsAppAuthUrl(): string | null {
  const wa =
    process.env.NEXT_PUBLIC_AUTH_WHATSAPP_URL?.trim() ??
    process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL?.trim() ??
    "";
  return wa.length > 0 ? wa : null;
}
