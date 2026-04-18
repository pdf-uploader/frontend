"use client";

import { useEffect, useState } from "react";
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
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">PDF Library</h1>
        <p className="text-sm text-slate-600">Browse folders, search files, and open manuals quickly.</p>
      </div>
      <FolderBrowser />
    </section>
  );
}
