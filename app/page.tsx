"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BookHomepage from "@/components/BookHomepage";
import { hasAuthSession } from "@/lib/auth-session";
import { useAuth } from "@/lib/hooks/use-auth";

/**
 * Public marketing home — interactive manual preview book.
 * Authenticated staff are sent straight to `/dashboard` (single folder-library UI).
 */
export default function HomePage() {
  const router = useRouter();
  const auth = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const isLoggedIn = hasAuthSession(auth);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || !isLoggedIn) return;
    router.replace("/dashboard");
  }, [isHydrated, isLoggedIn, router]);

  /* Before hydrated: match prior behaviour — show the book preview. */
  if (!isHydrated) {
    return <BookHomepage onLoginClick={() => router.push("/login")} />;
  }

  if (isLoggedIn) {
    return (
      <div
        className="min-h-[100dvh] w-full bg-[#f4f1ec]"
        aria-busy
        aria-live="polite"
        aria-label="Redirecting to dashboard…"
      />
    );
  }

  return <BookHomepage onLoginClick={() => router.push("/login")} />;
}
