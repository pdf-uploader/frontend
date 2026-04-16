import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authUserFromAccessToken, normalizeAuthUser } from "@/lib/auth-user";
import { authStore } from "@/lib/auth-store";
import { SignInResponse } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;
const AUTH_ENDPOINTS = ["/auth/signIn", "/auth/refresh", "/auth/signOut"];

function isAuthEndpoint(url?: string): boolean {
  if (!url) {
    return false;
  }
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
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

    const refreshedToken = await refreshPromise.finally(() => {
      refreshPromise = null;
    });

    if (!refreshedToken) {
      authStore.clear();
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;
    return api.request(originalRequest);
  }
);

export async function signIn(email: string, password: string): Promise<SignInResponse> {
  try {
    const response = await api.post<SignInResponse>("/auth/signIn", { email, password });
    const payload = response.data as SignInResponse & {
      data?: { accessToken?: string };
      token?: string;
    };
    const accessToken = payload.accessToken ?? payload.data?.accessToken ?? payload.token;


    authStore.setAccessToken(accessToken);

    const userFromPayload = normalizeAuthUser(payload.user ?? null);
    const userFromToken = authUserFromAccessToken(accessToken, email);
    const resolvedUser = userFromPayload ?? userFromToken;

    if (!resolvedUser) {
      authStore.clear();
      throw new Error("Access token was received but user claims could not be parsed.");
    }

    authStore.setUser(resolvedUser);

    return {
      ...payload,
      accessToken,
      user: resolvedUser,
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
  await api.delete("/auth/signOut");
  authStore.clear();
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const csrfValue = authStore.getCsrfToken() ?? getCookie("csrfValue");
    const response = await api.patch<{ accessToken: string }>(
      "/auth/refresh",
      {},
      {
        headers: { "x-csrf-value": csrfValue ?? "" },
      }
    );

    authStore.setAccessToken(response.data.accessToken);
    return response.data.accessToken;
  } catch {
    return null;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const prefix = `${name}=`;
  const found = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}
