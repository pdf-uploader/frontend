"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookHomepage from "@/components/BookHomepage";
import { ArrowRightIcon } from "@/components/imme/imme-icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { IMME_CURRENT_STEP, IMME_KEY_FACTS, IMME_NEWS } from "@/lib/imme/project";

export default function HomePage() {
  const router = useRouter();
  const auth = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const isLoggedIn = Boolean(auth.token);
  const featured = IMME_NEWS[0];

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isLoggedIn = hasAuthSession(auth);

  if (!isHydrated || !isLoggedIn) {
    return <BookHomepage onLoginClick={() => router.push("/login")} />;
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
