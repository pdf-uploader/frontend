"use client";

import { ReactNode } from "react";
import { SiteHeader } from "@/components/imme/site-header";
import { SiteFooter } from "@/components/imme/site-footer";

/**
 * Wraps the public IMME site (Home / About / Manuals / BMS / Progress / etc.) in the public
 * header + footer chrome. Authenticated staff routes (admin, files, folders, dashboard, users)
 * keep the existing legacy `Navbar` and skip this shell entirely — see `MainShell` for the
 * dispatch logic.
 */
export function ImmePublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-imme-concrete">
      {/* Subtle ambient depth behind scroll — keeps long pages from feeling flat (Brief §7 whitespace). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_85%_50%_at_50%_-10%,rgba(26,45,79,0.06),transparent_55%),radial-gradient(ellipse_60%_40%_at_100%_40%,rgba(200,129,58,0.05),transparent_50%)]"
      />
      <SiteHeader />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
