"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/") {
    return <main className="h-screen w-screen overflow-hidden">{children}</main>;
  }

  return <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>;
}
