/**
 * Cookie names your Express API uses with Set-Cookie (readable **or** HttpOnly).
 * Override if your backend uses different names.
 */
export const ACCESS_TOKEN_COOKIE =
  process.env.NEXT_PUBLIC_AUTH_ACCESS_COOKIE?.trim() || "accessToken";
export const REFRESH_TOKEN_COOKIE =
  process.env.NEXT_PUBLIC_AUTH_REFRESH_COOKIE?.trim() || "refreshToken";

/** JavaScript can only read **non-HttpOnly** cookies. HttpOnly tokens are still sent on API requests via `withCredentials`. */
export function getBrowserCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const prefix = `${name}=`;
  const found = document.cookie.split("; ").find((c) => c.startsWith(prefix));
  if (!found) {
    return undefined;
  }
  try {
    return decodeURIComponent(found.slice(prefix.length));
  } catch {
    return found.slice(prefix.length);
  }
}

export function readReadableAuthCookies(): {
  accessToken?: string;
  refreshToken?: string;
} {
  const accessToken = getBrowserCookie(ACCESS_TOKEN_COOKIE)?.trim();
  const refreshToken = getBrowserCookie(REFRESH_TOKEN_COOKIE)?.trim();
  return {
    ...(accessToken ? { accessToken } : {}),
    ...(refreshToken ? { refreshToken } : {}),
  };
}
