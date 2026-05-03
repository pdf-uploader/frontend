"use client";

import { useSyncExternalStore } from "react";
import type { AuthUser } from "@/lib/types";
import { authStore } from "@/lib/auth-store";

/**
 * Stable empty snapshot used during SSR and the first client hydration render.
 *
 * `auth-store.ts` calls `authStore.hydrate()` synchronously at module load on the client
 * (so axios interceptors see the Bearer token before any request fires). That means by
 * the time React mounts, the live snapshot is already populated from sessionStorage —
 * which doesn't match the empty snapshot the server rendered with, producing a hydration
 * mismatch on Navbar / ProtectedRoute.
 *
 * Returning a stable identity from `getServerSnapshot` makes React render the empty
 * snapshot on both the server *and* the first client render, then swap to the live
 * snapshot after hydration completes — no warning, brief auth-aware re-render afterward.
 */
const SSR_AUTH_SNAPSHOT: { token: string | null; user: AuthUser | null } = {
  token: null,
  user: null,
};

function getServerAuthSnapshot(): typeof SSR_AUTH_SNAPSHOT {
  return SSR_AUTH_SNAPSHOT;
}

export function useAuth() {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, getServerAuthSnapshot);
}
