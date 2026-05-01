import { authUserFromAccessToken, normalizeAuthUser } from "@/lib/auth-user";
import { AuthUser } from "@/lib/types";

const ACCESS_TOKEN_KEY = "pdf_manager_access_token";
const REFRESH_TOKEN_KEY = "pdf_manager_refresh_token";
const USER_KEY = "pdf_manager_user";
const CSRF_KEY = "pdf_manager_csrf";

let accessToken: string | null = null;
let refreshToken: string | null = null;
let csrfToken: string | null = null;
let currentUser: AuthUser | null = null;
let snapshot: { token: string | null; user: AuthUser | null } = {
  token: null,
  user: null,
};

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function updateSnapshot(): void {
  snapshot = {
    token: accessToken,
    user: currentUser,
  };
}

function persist() {
  if (typeof window === "undefined") {
    return;
  }

  if (accessToken) {
    window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  } else {
    window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (csrfToken) {
    window.sessionStorage.setItem(CSRF_KEY, csrfToken);
  } else {
    window.sessionStorage.removeItem(CSRF_KEY);
  }

  if (currentUser) {
    window.sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  } else {
    window.sessionStorage.removeItem(USER_KEY);
  }
}

export const authStore = {
  hydrate(): void {
    if (typeof window === "undefined") {
      return;
    }
    accessToken = window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
    refreshToken = window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
    csrfToken = window.sessionStorage.getItem(CSRF_KEY) ?? readCookie("csrfValue");
    const userRaw = window.sessionStorage.getItem(USER_KEY);
    if (userRaw) {
      try {
        currentUser = normalizeAuthUser(JSON.parse(userRaw) as unknown);
      } catch {
        currentUser = null;
      }
    } else {
      currentUser = null;
    }
    if (!currentUser && accessToken) {
      currentUser = authUserFromAccessToken(accessToken);
    }
    updateSnapshot();
    emit();
  },
  getSnapshot(): { token: string | null; user: AuthUser | null } {
    return snapshot;
  },
  getAccessToken(): string | null {
    return accessToken;
  },
  setAccessToken(token: string | null): void {
    accessToken = token;
    updateSnapshot();
    persist();
    emit();
  },
  getRefreshToken(): string | null {
    return refreshToken;
  },
  setRefreshToken(token: string | null): void {
    refreshToken = token;
    persist();
    emit();
  },
  getCsrfToken(): string | null {
    return csrfToken;
  },
  setCsrfToken(token: string | null): void {
    csrfToken = token;
    persist();
  },
  getUser(): AuthUser | null {
    return currentUser;
  },
  /** Accepts API-shaped user objects; role casing and alternate keys are normalized. */
  setUser(user: unknown | null): void {
    currentUser = user == null ? null : normalizeAuthUser(user);
    updateSnapshot();
    persist();
    emit();
  },
  clear(): void {
    accessToken = null;
    refreshToken = null;
    csrfToken = null;
    currentUser = null;
    updateSnapshot();
    persist();
    emit();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/**
 * Run before React’s first paint on the client so `getAccessToken()` and axios interceptors see Bearer from
 * sessionStorage immediately. `hydrate()` in `AppProviders` alone is too late—it runs after the first render
 * (effects), which can emit unauthenticated GETs → 401.
 */
if (typeof window !== "undefined") {
  authStore.hydrate();
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const prefix = `${name}=`;
  const found = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}
