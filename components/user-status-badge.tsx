"use client";

import { badgeClassesForUserStatus, parseUserStatus } from "@/lib/user-status";
import type { UserStatus } from "@/lib/types";

export function UserStatusBadge({
  status,
}: {
  status?: unknown;
}) {
  const normalized = parseUserStatus(status);
  const label = (normalized ?? "WAITING") as UserStatus;
  const cls = badgeClassesForUserStatus(normalized);

  return (
    <span
      className={[
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold tracking-wide",
        cls,
      ].join(" ")}
    >
      {label}
    </span>
  );
}
