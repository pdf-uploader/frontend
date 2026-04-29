import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getBrowserCookie } from "@/lib/auth-cookies";
import { resolveAuthUserFromCredentialResponse } from "@/lib/auth-user";
import { SignInBlockedByAccountStatusError } from "@/lib/sign-in-errors";
import {
  isLoginBlockedAccountStatus,
  parseAccountStatusFromAuthPayload,
} from "@/lib/user-status";
import { authStore } from "@/lib/auth-store";
import { BookmarkItem, SignInResponse, UserStatus } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL ?? "http://localhost:4000";
const AUTH_SIGN_OUT_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_SIGNOUT_ENDPOINT?.trim() ?? "";
const AUTH_SIGN_OUT_METHOD = (process.env.NEXT_PUBLIC_AUTH_SIGNOUT_METHOD ?? "delete").toLowerCase();

/** Express auth routes — keep aligned with backend. */
export const AUTH_ROUTES = {
  signIn: "/auth/signin",
  signUp: "/auth/signup",
  refresh: "/auth/refresh",
} as const;

export const USERS_SIGNUP_ROUTES = {
  user: "/users/signup/user",
  admin: "/users/signup/admin",
} as const;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise: Promise<boolean> | null = null;
/** Credential-exchange routes must not trigger refresh-token retry on 401. */
const AUTH_ENDPOINTS = [
  AUTH_ROUTES.signIn,
  AUTH_ROUTES.signUp,
  AUTH_ROUTES.refresh,
  "/auth/signOut",
  "/auth/signout",
];

function isAuthEndpoint(url?: string): boolean {
  if (!url) {
    return false;
  }
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint)) || Boolean(AUTH_SIGN_OUT_ENDPOINT && url.includes(AUTH_SIGN_OUT_ENDPOINT));
}

function attachAuthHeaders(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  if (isAuthEndpoint(config.url)) {
    return config;
  }
  const token = authStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

api.interceptors.request.use(attachAuthHeaders);

function pickAccessTokenFromBody(data: unknown): string | undefined {
  if (data == null || typeof data !== "object") {
    return undefined;
  }
  const r = data as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined);

  const direct =
    str(r.accessToken) ?? str(r.newAccessToken) ?? str(r.token) ?? str(r.jwt) ?? str(r.access_token);
  if (direct) {
    return direct;
  }

  if (r.data != null && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    const nested = str(d.accessToken) ?? str(d.newAccessToken) ?? str(d.token);
    if (nested) {
      return nested;
    }
  }

  if (r.tokens != null && typeof r.tokens === "object") {
    const t = r.tokens as Record<string, unknown>;
    const nested = str(t.accessToken) ?? str(t.newAccessToken);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function pickRefreshTokenFromBody(data: unknown): string | undefined {
  if (data == null || typeof data !== "object") {
    return undefined;
  }
  const r = data as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined);

  const direct =
    str(r.refreshToken) ??
    str(r.newRefreshToken) ??
    str(r.refresh_token) ??
    str(r.refresh_token_hint);
  if (direct) {
    return direct;
  }

  if (r.data != null && typeof r.data === "object") {
    const d = r.data as Record<string, unknown>;
    const nested = str(d.refreshToken) ?? str(d.newRefreshToken);
    if (nested) {
      return nested;
    }
  }

  if (r.tokens != null && typeof r.tokens === "object") {
    const t = r.tokens as Record<string, unknown>;
    const nested = str(t.refreshToken) ?? str(t.newRefreshToken);
    if (nested) {
      return nested;
    }
  }

  return undefined;
}

function syncCsrfFromDocumentCookie(): void {
  const v = getBrowserCookie("csrfValue");
  if (v) {
    authStore.setCsrfToken(v);
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      !originalRequest ||
      originalRequest._retry ||
      error.response?.status !== 401 ||
      isAuthEndpoint(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }

    const refreshedOk = await refreshPromise.finally(() => {
      refreshPromise = null;
    });

    if (!refreshedOk) {
      authStore.clear();
      return Promise.reject(error);
    }

    const token = authStore.getAccessToken();
    if (token) {
      originalRequest.headers.Authorization = `Bearer ${token}`;
    }
    return api.request(originalRequest);
  }
);

export async function signUp(email: string, password: string): Promise<void> {
  await api.post(AUTH_ROUTES.signUp, { email, password });
}

export type ApplicantSignUpPayload = {
  email: string;
  password: string;
  sendWelcomeEmail?: boolean;
  appBaseUrl?: string;
  usersPortalUrl?: string;
};

export async function signUpApplicantUser(payload: ApplicantSignUpPayload): Promise<void> {
  await api.post(USERS_SIGNUP_ROUTES.user, payload);
}

export async function signUpApplicantAdmin(payload: ApplicantSignUpPayload): Promise<void> {
  await api.post(USERS_SIGNUP_ROUTES.admin, payload);
}

/** PATCH `/users/:userId` — e.g. `{ status: "WAITING" }`. */
export async function patchUserStatus(userId: string, status: UserStatus): Promise<void> {
  await api.patch(`/users/${userId}`, { status });
}

export async function signIn(email: string, password: string): Promise<SignInResponse> {
  try {
    const response = await api.post<SignInResponse>(AUTH_ROUTES.signIn, { email, password });
    const payload = response.data as SignInResponse & Record<string, unknown>;

    syncCsrfFromDocumentCookie();

    /** Tokens may already be set as HttpOnly cookies — evaluate approval before storing session. */
    const accessToken = pickAccessTokenFromBody(payload);
    const refreshToken = pickRefreshTokenFromBody(payload);

    const resolvedUser = resolveAuthUserFromCredentialResponse(payload, email);
    const effectiveStatus =
      parseAccountStatusFromAuthPayload(payload) ?? resolvedUser.status;

    if (isLoginBlockedAccountStatus(effectiveStatus)) {
      authStore.clear();
      await signOut();
      throw new SignInBlockedByAccountStatusError(effectiveStatus);
    }

    authStore.setRefreshToken(refreshToken ?? null);
    authStore.setAccessToken(accessToken ?? null);

    authStore.setUser(resolvedUser);

    return {
      ...payload,
      ...(typeof accessToken === "string" ? { accessToken } : {}),
      user: resolvedUser,
      role: resolvedUser.role,
    };
  } catch (error) {
    if (axios.isAxiosError<{ message?: string }>(error)) {
      const apiMessage = error.response?.data?.message ?? error.message;
      throw new Error(apiMessage || "Login failed. Check credentials and try again.");
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Login failed. Check credentials and try again.");
  }
}

export async function signOut(): Promise<void> {
  if (AUTH_SIGN_OUT_ENDPOINT) {
    try {
      if (AUTH_SIGN_OUT_METHOD === "post") {
        await api.post(AUTH_SIGN_OUT_ENDPOINT);
      } else if (AUTH_SIGN_OUT_METHOD === "patch") {
        await api.patch(AUTH_SIGN_OUT_ENDPOINT);
      } else {
        await api.delete(AUTH_SIGN_OUT_ENDPOINT);
      }
    } catch {
      // Logout should still complete client-side even if server revoke fails.
    }
  }
  authStore.clear();
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    const csrfValue = authStore.getCsrfToken() ?? getBrowserCookie("csrfValue");
    const response = await api.patch<unknown>(AUTH_ROUTES.refresh, {}, {
      headers: { "x-csrf-value": csrfValue ?? "" },
    });

    syncCsrfFromDocumentCookie();

    const payload = response.data;
    const accessToken = pickAccessTokenFromBody(payload);
    const refreshToken = pickRefreshTokenFromBody(payload);

    const fallbackEmail = authStore.getUser()?.email ?? "";
    const resolvedUser = resolveAuthUserFromCredentialResponse(
      payload,
      fallbackEmail || "user@session.local",
    );
    const effectiveStatus =
      parseAccountStatusFromAuthPayload(payload) ?? resolvedUser.status;

    if (isLoginBlockedAccountStatus(effectiveStatus)) {
      authStore.clear();
      await signOut();
      return false;
    }

    authStore.setAccessToken(accessToken ?? null);
    authStore.setRefreshToken(refreshToken ?? null);

    authStore.setUser(resolvedUser);

    return true;
  } catch {
    return false;
  }
}

export async function getBookmarks(fileId: string): Promise<BookmarkItem[]> {
  return (await api.get<BookmarkItem[]>("/bookmarks", { params: { fileId } })).data;
}

export async function createBookmark(payload: {
  fileId: string;
  page: number;
  color?: string;
}): Promise<BookmarkItem> {
  return (await api.post<BookmarkItem>("/bookmarks", payload)).data;
}

export async function deleteBookmark(payload: { fileId: string; page: number }): Promise<void> {
  await api.delete("/bookmarks", { data: payload });
}
