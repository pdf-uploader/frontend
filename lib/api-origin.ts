/**
 * Public API base URL — matches backend `CLIENT_URL` (Google OAuth redirect host).
 * Prefer `NEXT_PUBLIC_API_URL`; falls back to `NEXT_PUBLIC_EXPRESS_SERVER_URL`.
 */
export function getPublicApiOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL?.trim() ||
    "http://localhost:4000";
  return raw.replace(/\/$/, "");
}
