import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { AppProviders } from "@/lib/providers";
import { ProtectedRoute } from "@/components/protected-route";
import { Navbar } from "@/components/navbar";
import { Suspense } from "react";
import { MainShell } from "@/components/main-shell";

export const metadata: Metadata = {
  title: "PDF Management",
  description: "PDF management and search frontend",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <ProtectedRoute>
            <Navbar />
            <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>}>
              <MainShell>{children}</MainShell>
            </Suspense>
          </ProtectedRoute>
        </AppProviders>
      </body>
    </html>
  );
}
