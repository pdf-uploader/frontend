import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { authStore } from "@/lib/auth-store";
import { SignInResponse } from "@/lib/types";

const API_BASE_URL = "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

function attachAuthHeaders(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
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

    if (!originalRequest || originalRequest._retry || error.response?.status !== 401) {
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
  const response = await api.post<SignInResponse>("/auth/signIn", { email, password });
  const payload = response.data;

  authStore.setAccessToken(payload.accessToken);
  authStore.setCsrfToken(payload.csrfToken ?? null);
  authStore.setUser(payload.user);

  return payload;
}

export async function signOut(): Promise<void> {
  await api.delete("/auth/signOut");
  authStore.clear();
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const csrfValue = authStore.getCsrfToken();
    const response = await api.patch<{ accessToken: string; csrfToken?: string }>(
      "/auth/refresh",
      {},
      {
        headers: csrfValue ? { "x-csrf-value": csrfValue } : undefined,
      }
    );

    authStore.setAccessToken(response.data.accessToken);
    if (response.data.csrfToken) {
      authStore.setCsrfToken(response.data.csrfToken);
    }
    return response.data.accessToken;
  } catch {
    return null;
  }
}
