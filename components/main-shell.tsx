"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

const FULL_WIDTH_ROUTES = new Set(["/", "/login"]);

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (FULL_WIDTH_ROUTES.has(pathname)) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return <main className="ui-shell">{children}</main>;
}
