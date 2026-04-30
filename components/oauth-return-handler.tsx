"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { refreshAccessToken } from "@/lib/api";
import {
  parseOAuthReturnSearch,
  persistOAuthFlashMessage,
} from "@/lib/oauth-return";

/**
 * Handles backend OAuth redirect: `?oauth=success|pending|error` (+ optional `reason`).
 * Strips query params via Next router (do not use fetch() to start OAuth — see social Google link).
 */
export function OAuthReturnHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const search = window.location.search;
    const parsed = parseOAuthReturnSearch(search);
    if (!parsed) {
      return;
    }

    const target = pathname || "/";
    router.replace(target);

    const dedupeKey = `oauthFx:${target}:${search}`;
    try {
      if (sessionStorage.getItem(dedupeKey)) {
        return;
      }
      sessionStorage.setItem(dedupeKey, "1");
    } catch {
      /* ignore */
    }

    const { oauth, reason } = parsed;

    void (async () => {
      if (oauth === "success") {
        const ok = await refreshAccessToken();
        if (!ok) {
          persistOAuthFlashMessage({ kind: "error", reason: "session" });
        }
        return;
      }
      if (oauth === "pending") {
        persistOAuthFlashMessage({ kind: "pending" });
        return;
      }
      persistOAuthFlashMessage({ kind: "error", reason: reason ?? undefined });
    })();
  }, [pathname, router]);

  return null;
}
