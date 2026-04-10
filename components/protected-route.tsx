"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import { ReactNode } from "react";

const PUBLIC_ROUTES = new Set(["/login"]);

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token } = useAuth();
  const isPublic = PUBLIC_ROUTES.has(pathname);

  useEffect(() => {
    if (!token && !isPublic) {
      router.replace("/login");
    }
    if (token && pathname === "/login") {
      router.replace("/dashboard");
    }
  }, [token, isPublic, pathname, router]);

  if (!token && !isPublic) {
    return <div className="p-6 text-sm text-slate-600">Checking session...</div>;
  }

  return <>{children}</>;
}
