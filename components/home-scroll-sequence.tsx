"use client";

import { UgandaBrandedBackdrop } from "@/components/uganda-branded-backdrop";
import { BrandedBottomConsultants, BrandedTopLogos } from "@/components/branded-logos-shell";

export function HomeScrollSequence() {
  return (
    <section className="flex min-h-screen min-h-[100dvh] w-full flex-col">
      <BrandedTopLogos authLinks={{ loginHref: "/login", signupHref: "/signup" }} />
      <div className="relative min-h-0 w-full flex-1">
        <UgandaBrandedBackdrop variant="content" />
      </div>
      <BrandedBottomConsultants variant="on-map" />
    </section>
  );
}
