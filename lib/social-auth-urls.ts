/**
 * Social login entry URLs (backend OAuth redirects).
 * Express: `GET /auth/google` → `passport.authenticate("google", …)`.
 *
 * Google Cloud Console must list the API callback exactly, e.g.
 * `http://localhost:4000/auth/google/callback`. The browser should open the
 * **start** route `/auth/google` on the API origin (same host/port as that callback).
 */

import { AUTH_ROUTES } from "@/lib/api";
import { getPublicApiOrigin } from "@/lib/api-origin";

/** Normalize mistaken paste of the Console “redirect URI” into the link we use to start OAuth. */
function googleOAuthStartUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed.endsWith("/auth/google/callback")) {
    return trimmed.slice(0, -"/callback".length);
  }
  return trimmed;
}

/** Google OAuth entry URL — optional override via NEXT_PUBLIC_AUTH_GOOGLE_URL */
export function getGoogleAuthUrl(): string {
  const configured = process.env.NEXT_PUBLIC_AUTH_GOOGLE_URL?.trim() ?? "";
  const raw = configured.length > 0 ? configured : `${getPublicApiOrigin()}${AUTH_ROUTES.googleStart}`;
  return googleOAuthStartUrl(raw);
}

/** WhatsApp invite or OAuth-style URL; when absent the UI shows a disabled placeholder. */
export function getWhatsAppAuthUrl(): string | null {
  const wa =
    process.env.NEXT_PUBLIC_AUTH_WHATSAPP_URL?.trim() ??
    process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL?.trim() ??
    "";
  return wa.length > 0 ? wa : null;
}
