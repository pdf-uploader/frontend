import type { AuthUser } from "@/lib/types";
import { isLoginBlockedAccountStatus } from "@/lib/user-status";

/** True when we have a JWT in memory **or** a hydrated user (cookie-only / HttpOnly sessions often have user without token). */
export function hasAuthSession(snapshot: {
  token: string | null;
  user: AuthUser | null;
}): boolean {
  const user = snapshot.user;
  if (isLoginBlockedAccountStatus(user?.status)) {
    return false;
  }
  return Boolean(snapshot.token || user);
}