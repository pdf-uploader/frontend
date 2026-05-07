import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Montserrat } from "next/font/google";
import "@/app/globals.css";
import { AppProviders } from "@/lib/providers";
import { OAuthFlashBanner } from "@/components/oauth-flash-banner";
import { ProtectedRoute } from "@/components/protected-route";
import { Suspense } from "react";
import { MainShell } from "@/components/main-shell";
import { PWARegister } from "@/components/pwa-register";

const interSans = Inter({
  subsets: ["latin"],
  variable: "--font-imme-sans",
  display: "swap",
});

const montserratDisplay = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-imme-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-imme-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Expressway Integrated Manual",
    template: "%s — Expressway Integrated Manual",
  },
  description:
    "KOICA-funded Korea–Uganda cooperation delivering integrated lifecycle manuals and a bridge management system pilot for Uganda's expressways.",
  manifest: "/mainfest.json",
  applicationName: "Expressway Integrated Manual",
  appleWebApp: {
    capable: true,
    title: "Expressway Integrated Manual",
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
  themeColor: "#1A2D4F",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${interSans.variable} ${montserratDisplay.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <AppProviders>
          <PWARegister />
          <ProtectedRoute>
            <OAuthFlashBanner />
            <Suspense fallback={<main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>}>
              <MainShell>{children}</MainShell>
            </Suspense>
          </ProtectedRoute>
        </AppProviders>
      </body>
    </html>
  );
}
