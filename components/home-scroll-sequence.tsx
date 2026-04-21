"use client";

import Link from "next/link";

const HOME_BACKGROUND_VIDEO_SOURCE = "/logo%20animation.mp4";

export function HomeScrollSequence({ loginHref }: { loginHref?: string }) {
  return (
    <section className="min-h-screen w-full px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex justify-end">
          {loginHref && (
            <Link href={loginHref} className="ui-btn-primary">
              Login
            </Link>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="ui-card overflow-hidden p-4 sm:p-5">
            <div className="relative overflow-hidden rounded-3xl">
              <video className="h-[390px] w-full object-cover sm:h-[430px]" autoPlay loop muted playsInline preload="auto">
                <source src={HOME_BACKGROUND_VIDEO_SOURCE} type="video/mp4" />
              </video>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900/65 via-slate-900/35 to-transparent" />
              <div className="absolute inset-0 p-6 sm:p-8">
                <div className="inline-flex rounded-full border border-white/40 bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                  PDF Intelligence Workspace
                </div>
                <h1 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  A modern workspace for searching and reading technical PDFs
                </h1>
                <p className="mt-4 max-w-2xl text-sm text-slate-100 sm:text-base">
                  Organize manuals by folders, find exact passages instantly, and keep everything in a clean, focused interface.
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 sm:text-sm">
              The animated hero sets the tone while keeping actions and content clear, lightweight, and accessible.
            </div>
          </div>

          <div className="space-y-4">
            <article className="ui-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fast retrieval</p>
              <p className="mt-2 text-sm text-slate-700">Search by keyword across the whole library with contextual snippets.</p>
            </article>
            <article className="ui-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team ready</p>
              <p className="mt-2 text-sm text-slate-700">Role-based access helps admins manage folders and user accounts safely.</p>
            </article>
            <article className="ui-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reader focus</p>
              <p className="mt-2 text-sm text-slate-700">Full-screen PDF mode, bookmarks, and page-level search hit navigation.</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
