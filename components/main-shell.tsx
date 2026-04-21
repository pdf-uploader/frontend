"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return <main className="ui-shell">{children}</main>;
}
