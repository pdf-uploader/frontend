/**
 * Canonical public origin for deep links and welcome emails.
 * Set NEXT_PUBLIC_APP_BASE_URL in deployment (e.g. https://uganda-expressway-manual.com).
 */
export const APP_PUBLIC_BASE_URL = (() => {
  const raw = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_BASE_URL?.trim() : "";
  return raw ? raw.replace(/\/$/, "") : "https://uganda-expressway-manual.com";
})();

export const APP_USERS_PORTAL_URL = `${APP_PUBLIC_BASE_URL}/users`;
