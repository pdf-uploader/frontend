"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { hasAuthSession } from "@/lib/auth-session";
import { isAdminUser } from "@/lib/auth-user";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-imme-line bg-white/92 shadow-imme-card backdrop-blur-xl">
      <div className="imme-container-wide flex min-h-[60px] items-center justify-end py-2 sm:min-h-[68px]">
        <StaffAuthCluster className="flex items-center gap-2 sm:gap-2.5" />
      </div>
    </header>
  );
}

/**
 * Entry points to the staff workspace (PDF library, admin). Marketing pages intentionally omit
 * these from `IMME_NAV` — they live here so visitors can sign in while the public site stays
 * brochure-first.
 */
function StaffAuthCluster({
  className = "",
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const auth = useAuth();
  const pathname = usePathname() ?? "/";
  const loggedIn = hasAuthSession(auth);
  const libraryActive =
    pathname === "/search" || pathname.startsWith("/folders/") || pathname.startsWith("/files/");

  if (loggedIn) {
    return (
      <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
        <Link
          href="/search"
          onClick={onNavigate}
          className={[
            "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition sm:min-h-[36px] sm:px-4 sm:text-[13px]",
            libraryActive
              ? "bg-imme-navy text-white shadow-sm"
              : "border border-imme-navy bg-white text-imme-navy hover:bg-imme-navy hover:text-white",
          ].join(" ")}
        >
          Document library
        </Link>
        {isAdminUser(auth.user) ? (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="inline-flex items-center justify-center rounded-full border border-imme-line bg-white px-3 py-1.5 text-xs font-semibold text-imme-ink transition hover:bg-imme-concrete sm:px-4 sm:text-[13px]"
          >
            Admin
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
      <Link
        href="/login"
        onClick={onNavigate}
        className="inline-flex items-center justify-center rounded-full bg-imme-navy px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-imme-navy-700 sm:min-h-[36px] sm:px-4 sm:text-[13px]"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        onClick={onNavigate}
        className="inline-flex items-center justify-center rounded-full border border-imme-line bg-white px-3 py-1.5 text-xs font-semibold text-imme-navy transition hover:bg-imme-concrete sm:px-4 sm:text-[13px]"
      >
        Sign up
      </Link>
    </div>
  );
}
