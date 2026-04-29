"use client";

import { badgeClassesForUserStatus, parseUserStatus } from "@/lib/user-status";
export function UserStatusBadge({
  status,
}: {
  status?: unknown;
}) {
  const normalized = parseUserStatus(status);
  const cls = badgeClassesForUserStatus(normalized);
  const label = normalized ?? "WAITING";

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
