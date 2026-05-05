import Link from "next/link";
import {
  IMME_CURRENT_STEP,
  IMME_KEY_FACTS,
  IMME_NEWS,
  IMME_PROJECT,
  IMME_ROADMAP,
  IMME_STRATEGY_PILLARS,
  IMME_TOTAL_STEPS,
} from "@/lib/imme/project";
import {
  ArrowRightIcon,
  BookStackIcon,
  BridgeIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  PeopleIcon,
} from "@/components/imme/imme-icons";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SectionRibbon />
      <KeyFactsBar />
      <SectionRibbon variant="light" />
      <WhatWeBuild />
      <SectionRibbon />
      <StrategyStrip />
      <SectionRibbon variant="light" />
      <TimelineSnapshot />
      <SectionRibbon />
      <LatestNews />
      <ClosingCta />
    </>
  );
}

/* ----------------------------------------------------------------- */
/* Hero (Brief §5.1)                                                 */
/* ----------------------------------------------------------------- */

function Hero() {
  return (
    <section
      aria-labelledby="imme-hero-title"
      className="relative overflow-hidden bg-imme-navy text-white"
    >
      <HeroBackdrop />
      <div className="imme-container relative grid gap-12 py-16 sm:gap-14 sm:py-20 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:py-[5.25rem]">
        <div className="max-w-2xl">
          <p className="imme-eyebrow text-imme-amber-300">{IMME_PROJECT.shortName}</p>
          <h1
            id="imme-hero-title"
            className="mt-4 font-display text-[clamp(1.85rem,4.6vw,3.15rem)] font-bold leading-[1.06] tracking-tight"
          >
            Building Uganda&apos;s Expressway Knowledge Infrastructure
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/82 sm:text-[17px] sm:leading-8">
            Integrated lifecycle manuals and a bridge management system pilot — KOICA-funded Korea–Uganda
            cooperation, owned by Uganda&apos;s Ministry of Works and Transport after handover in April 2026.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/manuals" className="imme-btn-amber shadow-lg shadow-black/20">
              Explore the Manuals
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/progress"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/[0.07] px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/55 hover:bg-white/12"
            >
              View Project Progress
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/12 pt-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-imme-amber shadow-[0_0_12px_rgba(200,129,58,0.65)]" />
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/68">
                Live roadmap
              </p>
            </div>
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-white/88">
              Step {IMME_CURRENT_STEP.step} / {IMME_TOTAL_STEPS} — {IMME_CURRENT_STEP.title}
            </p>
          </div>
          <TrustRibbon className="mt-8" />
        </div>

        <PartnerStrip />
      </div>
    </section>
  );
}

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

/* ----------------------------------------------------------------- */
/* What We're Building (3-column cards, Brief §5.1)                  */
/* ----------------------------------------------------------------- */

function WhatWeBuild() {
  const cards: Array<{
    icon: typeof BookStackIcon;
    title: string;
    body: string;
    href: string;
    tone: "navy" | "amber" | "green";
  }> = [
    {
      icon: BookStackIcon,
      title: "Expressway Integrated Manuals",
      body: "A single lifecycle-oriented manual system covering Planning, Design, Construction Management, Operation, and Maintenance — localized for Uganda's laws, institutions, and projects.",
      href: "/manuals",
      tone: "navy",
    },
    {
      icon: BridgeIcon,
      title: "Bridge Management System (BMS)",
      body: "A digital BMS piloted on four bridges on the Kampala–Entebbe Expressway, linking inspection data to maintenance planning.",
      href: "/bms",
      tone: "amber",
    },
    {
      icon: PeopleIcon,
      title: "Capacity Building",
      body: "Two Korea Invitation Programs, three Technical Workshops in Uganda, and six months of On-the-Job Training to ensure MoWT can own and sustain the manuals.",
      href: "/capacity-building",
      tone: "green",
    },
  ];

  const toneStyles: Record<(typeof cards)[number]["tone"], { iconBg: string; iconColor: string }> = {
    navy: { iconBg: "bg-imme-navy", iconColor: "text-white" },
    amber: { iconBg: "bg-imme-amber", iconColor: "text-white" },
    green: { iconBg: "bg-imme-green", iconColor: "text-white" },
  };

  return (
    <section aria-labelledby="what-we-build" className="bg-white">
      <div className="imme-container py-14 sm:py-20">
        <p className="imme-eyebrow">What we&apos;re building</p>
        <h2 id="what-we-build" className="imme-h2 mt-2 max-w-2xl">
          Three deliverables. One handover.
        </h2>
        <p className="mt-3 max-w-2xl text-imme-muted">
          The IMME Project transfers Korean expressway practice into Ugandan ownership through three intertwined
          outputs that arrive together at the April 2026 handover.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            const tone = toneStyles[card.tone];
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group flex h-full flex-col rounded-imme border border-imme-line bg-white p-6 shadow-imme-card transition hover:-translate-y-0.5 hover:border-imme-navy hover:shadow-imme-soft"
              >
                <span
                  className={["inline-flex h-12 w-12 items-center justify-center rounded-xl", tone.iconBg, tone.iconColor].join(" ")}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.7} />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-imme-navy">{card.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-imme-muted">{card.body}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-imme-navy transition group-hover:text-imme-amber">
                  Learn more
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- */
/* Strategy Strip (Brief §5.1 "4 pillars")                            */
/* ----------------------------------------------------------------- */

function StrategyStrip() {
  return (
    <section aria-labelledby="strategy" className="bg-imme-concrete">
      <div className="imme-container py-14 sm:py-20">
        <p className="imme-eyebrow">Our development strategy</p>
        <h2 id="strategy" className="imme-h2 mt-2 max-w-2xl">
          Four pillars that keep the manuals usable, not shelved.
        </h2>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMME_STRATEGY_PILLARS.map((pillar, idx) => (
            <li
              key={pillar.id}
              className="flex flex-col gap-3 rounded-imme border border-imme-line bg-white p-5 shadow-imme-card"
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "inline-flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-bold text-white",
                    pillar.dotClass,
                  ].join(" ")}
                >
                  {idx + 1}
                </span>
                <h3 className="font-display text-lg font-bold text-imme-navy">{pillar.label}</h3>
              </div>
              <p className="text-sm leading-6 text-imme-muted">{pillar.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- */
/* Timeline Snapshot (Brief §5.1)                                     */
/* ----------------------------------------------------------------- */

function TimelineSnapshot() {
  /**
   * "We are here" indicator: pick the current step and show 3 prior + 3 next + the current
   * for a focused horizontal snapshot. Full 18-step roadmap lives at `/progress`.
   */
  const focus = IMME_ROADMAP.findIndex((m) => m.status === "current");
  const start = Math.max(0, focus - 3);
  const end = Math.min(IMME_ROADMAP.length, start + 7);
  const window = IMME_ROADMAP.slice(start, end);

  return (
    <section aria-labelledby="timeline-snapshot" className="bg-white">
      <div className="imme-container py-14 sm:py-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="imme-eyebrow">Where we are</p>
            <h2 id="timeline-snapshot" className="imme-h2 mt-2 max-w-2xl">
              Project roadmap at a glance
            </h2>
            <p className="mt-3 max-w-2xl text-imme-muted">
              Kickoff (Jan 2023) → Site Survey → Literature Review → 1st Workshop → 1st Invitation (Korea) → 2nd Workshop →
              Draft Manuals (OJT) → 3rd Workshop <strong className="text-imme-amber">[NOW]</strong> → Final Manuals → Handover
              (Apr 2026) → Final Reporting (Sep 2026).
            </p>
          </div>
          <Link href="/progress" className="imme-btn-secondary self-start lg:self-end">
            View full roadmap
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <ol className="mt-10 grid gap-3 lg:grid-cols-7">
          {window.map((m) => {
            const tone =
              m.status === "completed"
                ? "border-imme-green bg-imme-green/5 text-imme-green"
                : m.status === "current"
                  ? "border-imme-amber bg-imme-amber/10 text-imme-amber-300 ring-2 ring-imme-amber"
                  : "border-imme-line bg-white text-imme-muted";

            const Icon =
              m.status === "completed" ? CheckCircleIcon : m.status === "current" ? ClockIcon : CircleIcon;

            return (
              <li
                key={m.step}
                className={["flex flex-col gap-2 rounded-imme border-2 p-4 transition", tone].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-wider">Step {m.step}</p>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-display text-sm font-bold text-imme-ink">{m.title}</p>
                {m.date ? (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-imme-muted">{m.date}</p>
                ) : null}
                {m.status === "current" ? (
                  <p className="mt-auto inline-flex items-center gap-1 self-start rounded-full bg-imme-amber px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
                    We are here
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- */
/* Latest News (Brief §5.1)                                           */
/* ----------------------------------------------------------------- */

function LatestNews() {
  const featured = IMME_NEWS[0];
  if (!featured) {
    return null;
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
