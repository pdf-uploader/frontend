"use client";

import Link from "next/link";
const HOME_BACKGROUND_VIDEO_SOURCE = "/logo%20animation.mp4";

export function HomeScrollSequence({ loginHref }: { loginHref?: string }) {
  return (
    <section className="relative h-screen w-screen overflow-hidden bg-slate-950">
      <div className="h-full w-full overflow-hidden bg-slate-950">
        <video className="h-full w-full object-cover" autoPlay loop muted playsInline preload="auto">
          <source src={HOME_BACKGROUND_VIDEO_SOURCE} type="video/mp4" />
        </video>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/10 to-slate-950/80" />

        <div className="absolute inset-x-0 top-0 z-20 mx-auto w-full max-w-7xl p-5 sm:p-8">
          {loginHref && (
            <div className="flex justify-end">
              <Link
                href={loginHref}
                className="rounded-full border border-white/50 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/30"
              >
                Login
              </Link>
            </div>
          )}
          <div className="inline-flex rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium tracking-wide text-white backdrop-blur">
            Background Loop Experience
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
            Uganda x Global Partners Document Intelligence Platform
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-100 sm:text-base">
            A looping video now powers the homepage background experience. Sign in to access the full PDF workspace.
          </p>
        </div>
      </div>
    </section>
  );
}
