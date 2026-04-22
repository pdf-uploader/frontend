import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { AppProviders } from "@/lib/providers";
import { ProtectedRoute } from "@/components/protected-route";
import { Navbar } from "@/components/navbar";
import { Suspense } from "react";
import { MainShell } from "@/components/main-shell";
import { PWARegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "File Management",
  description: "File management and search frontend",
  manifest: "/mainfest.json",
  applicationName: "Interactive File Management",
  appleWebApp: {
    capable: true,
    title: "File Management",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/app-icon.png",
    apple: "/app-icon.png",
    shortcut: "/app-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <PWARegister />
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
