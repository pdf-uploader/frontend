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

function TrustRibbon({ className = "" }: { className?: string }) {
  const labels = ["KOICA", "MoWT Uganda", "KEC", "DOHWA", "CHEIL"];
  return (
    <div
      className={[
        "flex flex-wrap items-center gap-3 rounded-imme border border-white/12 bg-white/[0.06] px-4 py-3 backdrop-blur-sm",
        className,
      ].join(" ")}
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Consortium</span>
      <span aria-hidden className="hidden h-4 w-px bg-white/15 sm:block" />
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {labels.map((label, i) => (
          <li key={label} className="flex items-center gap-3">
            {i > 0 ? <span className="text-white/25" aria-hidden>·</span> : null}
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/78">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Fine horizontal rule between major home bands — keeps rhythm legible on long scroll (Brief §7). */
function SectionRibbon({ variant = "default" }: { variant?: "default" | "light" }) {
  const bg = variant === "light" ? "bg-imme-concrete" : "bg-white";
  return (
    <div aria-hidden className={["relative h-3 w-full overflow-hidden", bg].join(" ")}>
      <div className="absolute inset-x-8 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-imme-amber/55 to-transparent sm:inset-x-16 lg:inset-x-24" />
    </div>
  );
}

/**
 * Hero background — layered SVG depicting an aerial expressway cutting through Uganda's
 * landscape. Built from CSS gradients + an inline SVG so we don't rely on an asset that may
 * not exist in `/public/`.
 */
function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 20%, rgba(200, 129, 58, 0.32), transparent 35%), radial-gradient(circle at 82% 30%, rgba(46, 125, 82, 0.28), transparent 40%), linear-gradient(135deg, #14213a 0%, #1a2d4f 55%, #22406e 100%)",
        }}
      />
      <svg
        className="absolute inset-x-0 bottom-0 w-full"
        viewBox="0 0 1200 240"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0 200 L1200 90 L1200 240 L0 240 Z" fill="rgba(255,255,255,0.04)" />
        <path d="M0 220 L1200 130 L1200 240 L0 240 Z" fill="rgba(0,0,0,0.18)" />
        <path
          d="M-20 215 L380 165 L600 130 L1220 95"
          stroke="rgba(255,255,255,0.42)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="14 14"
        />
        <path
          d="M-20 215 L380 165 L600 130 L1220 95"
          stroke="#C8813A"
          strokeWidth="1.4"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-r from-imme-navy via-transparent to-imme-navy/50" />
    </div>
  );
}

function PartnerStrip() {
  const partners: Array<{ label: string; sub?: string }> = [
    { label: "KOICA", sub: "Funder" },
    { label: "MoWT", sub: "Uganda" },
    { label: "KEC", sub: "Lead consultant" },
    { label: "DOHWA", sub: "Engineering" },
    { label: "CHEIL", sub: "Engineering" },
  ];
  return (
    <aside
      aria-label="Project partners"
      className="grid gap-4 self-start rounded-imme border border-white/18 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 text-white shadow-imme-soft backdrop-blur-md sm:p-7"
    >
      <p className="imme-eyebrow text-imme-amber-300">Partner cluster</p>
      <p className="text-[15px] leading-7 text-white/76">
        A consortium of Korea&apos;s expressway expertise and Uganda&apos;s ministry, coordinated through KOICA.
      </p>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {partners.map((partner) => (
          <li
            key={partner.label}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <p className="font-display text-sm font-semibold tracking-wide text-white">{partner.label}</p>
            {partner.sub ? <p className="text-[11px] uppercase tracking-wider text-white/55">{partner.sub}</p> : null}
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5 text-[12px] text-white/80">
        <span aria-hidden className="text-base">🇰🇷 🇺🇬</span>
        <span className="font-mono uppercase tracking-wider">Korea–Uganda partnership</span>
      </div>
    </aside>
  );
}

/* ----------------------------------------------------------------- */
/* Key Facts Bar (Brief §5.1)                                        */
/* ----------------------------------------------------------------- */

function KeyFactsBar() {
  return (
    <section aria-label="Key project facts" className="relative bg-imme-ink text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(115deg, rgba(26,45,79,0.5) 0%, transparent 55%)",
        }}
      />
      <div className="imme-container-wide relative grid gap-8 py-11 sm:grid-cols-2 sm:gap-y-10 sm:py-14 lg:grid-cols-4 lg:gap-6">
        {IMME_KEY_FACTS.map((fact, idx) => (
          <div
            key={fact.id}
            className={[
              "relative flex flex-col gap-2 pl-4 sm:pl-5",
              idx > 0 ? "lg:border-l lg:border-white/12 lg:pl-8" : "",
            ].join(" ")}
          >
            <span aria-hidden className="absolute left-0 top-2 hidden h-[calc(100%-0.5rem)] w-1 rounded-full bg-imme-amber/85 lg:block" />
            <p className="font-display text-[clamp(2.25rem,5vw,3.35rem)] font-bold leading-none tracking-tight">
              {fact.numeral}
              {fact.unit ? (
                <span className="ml-2 align-baseline font-mono text-[clamp(0.85rem,2vw,1.05rem)] font-semibold uppercase tracking-[0.12em] text-imme-amber-300">
                  {fact.unit}
                </span>
              ) : null}
            </p>
            <p className="max-w-[14rem] text-[11px] font-medium uppercase leading-snug tracking-[0.14em] text-white/62">
              {fact.caption}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

  if (!isHydrated || !isLoggedIn) {
    return <BookHomepage onLoginClick={() => router.push("/login")} />;
  }
  return (
    <section aria-labelledby="latest-update" className="bg-imme-concrete">
      <div className="imme-container py-14 sm:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="imme-eyebrow">Latest update</p>
            <h2 id="latest-update" className="imme-h2 mt-2">
              From the project office
            </h2>
          </div>
          <Link href="/news" className="imme-btn-secondary self-start lg:self-end">
            All news
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <article className="mt-8 grid gap-6 rounded-imme border border-imme-line bg-white p-6 shadow-imme-card lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-imme-navy px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-white">
                {featured.category}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-imme-muted">
                {featured.date}
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-bold text-imme-navy sm:text-2xl">
              {featured.title}
            </h3>
            <p className="mt-3 text-[15px] leading-7 text-imme-muted">{featured.summary}</p>
            <Link href="/news" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-imme-navy hover:text-imme-amber">
              Read more updates
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <aside className="rounded-imme bg-imme-navy p-5 text-white">
            <p className="imme-eyebrow text-imme-amber-300">Project pulse</p>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-baseline justify-between gap-3">
                <span className="text-white/70">Status</span>
                <span className="font-mono uppercase tracking-wider text-imme-amber-300">
                  {IMME_CURRENT_STEP.title}
                </span>
              </li>
              <li className="flex items-baseline justify-between gap-3">
                <span className="text-white/70">Next milestone</span>
                <span className="font-mono uppercase tracking-wider">
                  Final Manual · Nov 2025
                </span>
              </li>
              <li className="flex items-baseline justify-between gap-3">
                <span className="text-white/70">Handover</span>
                <span className="font-mono uppercase tracking-wider">Apr 2026</span>
              </li>
            </ul>
          </aside>
        </article>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- */
/* Closing CTA                                                        */
/* ----------------------------------------------------------------- */

function ClosingCta() {
  return (
    <section aria-label="Get in touch" className="bg-imme-navy text-white">
      <div className="imme-container flex flex-col gap-6 py-14 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="imme-eyebrow text-imme-amber-300">A program, not a report</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Practical tools for Uganda&apos;s expressway sector — designed for the field, not the shelf.
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/about" className="imme-btn-amber">
            About the project
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
          >
            Contact us
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
