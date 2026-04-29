"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasAuthSession } from "@/lib/auth-session";
import { useAuth } from "@/lib/hooks/use-auth";
import { ReactNode } from "react";

const PUBLIC_ROUTES = new Set(["/", "/login", "/signup"]);

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const loggedIn = hasAuthSession(auth);
  const isPublic = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (!loggedIn && !isPublic) {
      router.replace("/");
    }
    if (loggedIn && (pathname === "/login" || pathname === "/signup")) {
      router.replace("/");
    }
  }, [loggedIn, isPublic, pathname, router]);

  if (!loggedIn && !isPublic) {
    return <div className="p-6 text-sm text-slate-600">Checking session...</div>;
  }

  return <>{children}</>;
}
