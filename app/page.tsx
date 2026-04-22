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
    <section className="ui-shell space-y-5">
      <div className="ui-card-soft p-5 sm:p-6">
        <p className="mb-2 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
          Workspace
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">File Management</h1>
        <p className="mt-2 text-sm text-slate-600">Browse folders, search files, and open manuals quickly.</p>
      </div>
      <FolderBrowser />
    </section>
  );
}
