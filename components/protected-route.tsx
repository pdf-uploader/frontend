"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasAuthSession } from "@/lib/auth-session";
import { useAuth } from "@/lib/hooks/use-auth";
import { ReactNode } from "react";

/**
 * Public-facing IMME pages do NOT require a session — anyone landing on `/`, `/about`,
 * `/manuals`, etc. should see the project information immediately. Auth gating only kicks in
 * for the staff workspace prefixes. Signed-in visits to `/` redirect to `/dashboard`. The auth
 * pages (`/login`, `/signup`) redirect to `/dashboard` if a session is already active.
 */
const STAFF_PREFIXES = ["/admin", "/users", "/dashboard", "/folders", "/files", "/search"];

function isStaffRoute(pathname: string): boolean {
  return STAFF_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const auth = useAuth();
  const loggedIn = hasAuthSession(auth);
  const isStaff = isStaffRoute(pathname);

  useEffect(() => {
    if (isStaff && !loggedIn) {
      router.replace("/login");
    }
    if (loggedIn && (pathname === "/login" || pathname === "/signup")) {
      router.replace("/dashboard");
    }
  }, [loggedIn, isStaff, pathname, router]);

  if (isStaff && !loggedIn) {
    return <div className="p-6 text-sm text-imme-muted">Checking session…</div>;
  }

  return <>{children}</>;
}
