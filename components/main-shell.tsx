"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { ImmePublicShell } from "@/components/imme/imme-public-shell";

/**
 * Top-level routing dispatch:
 *
 *   - Public IMME routes (Home, About, Manuals, BMS, Progress, Capacity Building, News,
 *     Contact) render under `ImmePublicShell` (project header + footer).
 *   - Auth pages (`/login`, `/signup`) keep their custom branded full-bleed layout.
 *   - Authenticated staff workspace (admin, users, dashboard, folders, files, search) keeps the
 *     legacy `Navbar` + the existing `.ui-shell` content container. Folder library: `/dashboard`;
 *     manage users: `/users` (admins only). `/search` redirects to `/dashboard`.
 *
 * Adding a new public page: drop it under one of the prefixes in `PUBLIC_PREFIXES` (or extend
 * the list) and you'll automatically inherit the IMME header/footer, no per-page wiring needed.
 */
const STAFF_PREFIXES = ["/admin", "/users", "/dashboard", "/folders", "/files", "/search"];
const AUTH_ROUTES = new Set(["/login", "/signup"]);

function isStaffRoute(pathname: string): boolean {
  return STAFF_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";

  if (AUTH_ROUTES.has(pathname)) {
    /** Auth pages own their own full-bleed branded chrome. */
    return <main className="min-h-screen w-full">{children}</main>;
  }

  if (isStaffRoute(pathname)) {
    return (
      <>
        <Navbar />
        <main className="ui-shell">{children}</main>
      </>
    );
  }

  return <ImmePublicShell>{children}</ImmePublicShell>;
}
