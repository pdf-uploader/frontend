"use client";

import { useEffect, useState } from "react";
import { BrandedBottomConsultants } from "@/components/branded-logos-shell";
import { FolderBrowser } from "@/components/folder-browser";
import { HomeScrollSequence } from "@/components/home-scroll-sequence";
import { hasAuthSession } from "@/lib/auth-session";
import { useAuth } from "@/lib/hooks/use-auth";

export default function HomePage() {
  const auth = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isLoggedIn = hasAuthSession(auth);

  if (!isHydrated || !isLoggedIn) {
    return <HomeScrollSequence loginHref="/login" />;
  }

  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col">
      <div className="ui-shell flex w-full flex-1 flex-col py-5 sm:py-6">
        <FolderBrowser />
      </div>
      <BrandedBottomConsultants />
    </div>
  );
}
