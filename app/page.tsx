"use client";

import { useEffect, useState } from "react";
import { BrandedBottomConsultants } from "@/components/branded-logos-shell";
import { FolderBrowser } from "@/components/folder-browser";
import { HomeScrollSequence } from "@/components/home-scroll-sequence";
import { useAuth } from "@/lib/hooks/use-auth";

export default function HomePage() {
  const { token } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || !token) {
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
