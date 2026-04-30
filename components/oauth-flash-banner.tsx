"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  clearOAuthFlashStorage,
  consumeOAuthFlashMessage,
  oauthErrorReasonLabel,
  subscribeOAuthFlash,
  type OAuthFlashPayload,
} from "@/lib/oauth-return";

export function OAuthFlashBanner() {
  const [flash, setFlash] = useState<OAuthFlashPayload | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeOAuthFlash((payload) => {
      setFlash(payload);
    });
    const stale = consumeOAuthFlashMessage();
    if (stale) {
      setFlash(stale);
    }
    return unsubscribe;
  }, []);

  const dismiss = () => {
    clearOAuthFlashStorage();
    setFlash(null);
  };

  if (!flash) {
    return null;
  }

  if (flash.kind === "pending") {
    return (
      <div
        role="status"
        className="border-b border-amber-200/90 bg-amber-50 px-4 py-3 text-center text-[13px] leading-snug text-amber-950"
      >
        <p className="mx-auto max-w-xl">
          Google sign-in succeeded, but your account is still{" "}
          <strong className="font-semibold">waiting for administrator approval</strong>. You may close this message;
          we&apos;ll email you when you can sign in.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 text-xs font-medium text-amber-900/90 underline-offset-2 hover:underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  const msg = oauthErrorReasonLabel(flash.reason);

  return (
    <div
      role="alert"
      className="border-b border-rose-200/90 bg-rose-50 px-4 py-3 text-center text-[13px] leading-snug text-rose-950"
    >
      <p className="mx-auto max-w-xl">{msg}</p>
      <p className="mt-2">
        <Link href="/login" className="text-xs font-medium text-rose-900 underline-offset-2 hover:underline">
          Back to sign in
        </Link>
        {" · "}
        <button
          type="button"
          onClick={dismiss}
          className="text-xs font-medium text-rose-900/90 underline-offset-2 hover:underline"
        >
          Dismiss
        </button>
      </p>
    </div>
  );
}
