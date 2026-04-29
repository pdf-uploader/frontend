import type { UserStatus } from "@/lib/types";

export function parseUserStatus(value: unknown): UserStatus | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const raw = value.trim();
  const s = (raw.includes(".") ? raw.split(".").pop() : raw)?.trim().toUpperCase() ?? "";
  if (s === "WAITING" || s === "REJECTED" || s === "APPROVED") {
    return s;
  }
  return undefined;
}

/** Reads `status` from auth JSON root or nested `user`. */
export function parseAccountStatusFromAuthPayload(payload: unknown): UserStatus | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }
  const r = payload as Record<string, unknown>;
  const root = parseUserStatus(r.status ?? r.userStatus ?? r.accountStatus);
  if (root) {
    return root;
  }
  const user = r.user;
  if (user != null && typeof user === "object") {
    const u = user as Record<string, unknown>;
    return parseUserStatus(u.status ?? u.userStatus ?? u.accountStatus);
  }
  return undefined;
}

export function isLoginBlockedAccountStatus(status: UserStatus | undefined): boolean {
  return status === "WAITING" || status === "REJECTED";
}
export function badgeClassesForUserStatus(status: UserStatus | undefined): string {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-900";
    case "WAITING":
    default:
      return "border-amber-200 bg-amber-50 text-amber-950";
  }
}
