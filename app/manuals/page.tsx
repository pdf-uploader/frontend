import Link from "next/link";
import { PageSection, PageShell } from "@/components/imme/page-shell";
import { IMME_MANUALS, IMME_STRATEGY_PILLARS } from "@/lib/imme/project";
import { ArrowRightIcon, BookStackIcon, CheckCircleIcon } from "@/components/imme/imme-icons";

export const metadata = {
  title: "Manuals — Integrated Lifecycle System",
  description:
    "An integrated 6-volume manual system covering planning, design, construction management, operation, and maintenance for Uganda's expressways.",
};

const LIFECYCLE_STAGES: ReadonlyArray<{
  id: (typeof IMME_MANUALS)[number]["id"];
  label: string;
  short: string;
}> = [
  { id: "planning", label: "Planning", short: "Appraise & justify" },
  { id: "design", label: "Design", short: "Specify & detail" },
  { id: "construction", label: "Construction Management", short: "Build & supervise" },
  { id: "operation", label: "Operation", short: "Run & manage traffic" },
  { id: "maintenance", label: "Maintenance", short: "Inspect & sustain" },
];

export default function ManualsOverviewPage() {
  return (
    <PageShell
      eyebrow="Manuals"
      title="An integrated lifecycle manual for Uganda's expressways."
      subtitle="One coherent system covering Planning → Design → Construction Management → Operation → Maintenance. Six manual types delivered to MoWT in April 2026 — coded, illustrated, searchable, smartphone-ready."
      breadcrumbs={[{ label: "Manuals" }]}
    >
      <PageSection eyebrow="Lifecycle diagram" title="Five stages, one unified format">
        <ol className="grid gap-3 lg:grid-cols-5">
          {LIFECYCLE_STAGES.map((stage, idx) => {
            const manual = IMME_MANUALS.find((m) => m.id === stage.id);
            return (
              <li key={stage.id}>
                <Link
                  href={manual?.href ?? "/manuals"}
                  className="group flex h-full flex-col gap-2 rounded-imme border border-imme-line bg-white p-5 shadow-imme-card transition hover:-translate-y-0.5 hover:border-imme-navy hover:shadow-imme-soft"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-imme-amber">
                      Stage {idx + 1}
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-imme-navy/[0.06] text-imme-navy">
                      <BookStackIcon className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="font-display text-lg font-bold text-imme-navy">{stage.label}</p>
                  <p className="text-[13px] leading-6 text-imme-muted">{stage.short}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-imme-navy transition group-hover:text-imme-amber">
                    Open manual
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </PageSection>

      <PageSection variant="concrete" eyebrow="Manuals catalog" title="Six volumes — one editorial standard">
        <ul className="grid gap-5 md:grid-cols-2">
          {IMME_MANUALS.map((manual) => (
            <li key={manual.id}>
              <Link
                href={manual.href}
                className="group block h-full rounded-imme border border-imme-line bg-white p-6 shadow-imme-card transition hover:-translate-y-0.5 hover:border-imme-navy hover:shadow-imme-soft"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber">{manual.code}</p>
                    <p className="mt-1 font-display text-lg font-bold text-imme-navy">{manual.title}</p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-imme-navy/[0.06] text-imme-navy">
                    <BookStackIcon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-3 text-[14px] leading-6 text-imme-muted">{manual.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-imme-navy transition group-hover:text-imme-amber">
                  View {manual.title}
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection
        eyebrow="Editorial principles"
        title="What makes the manuals usable, not shelfware"
        description="Every page in every manual respects the same four rules — so engineers can move across volumes without learning a new structure each time."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {IMME_STRATEGY_PILLARS.map((pillar) => (
            <li key={pillar.id} className="rounded-imme border border-imme-line bg-white p-5 shadow-imme-card">
              <div className="flex items-center gap-2.5">
                <CheckCircleIcon className="h-5 w-5 text-imme-green" />
                <p className="font-display text-base font-bold text-imme-navy">{pillar.label}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-imme-muted">{pillar.description}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection variant="navy" eyebrow="Handover plan" title="Six manual types delivered to MoWT by April 2026.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-imme bg-white/[0.06] p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber-300">Apr 2026</p>
            <p className="mt-2 font-display text-lg font-bold">Handover</p>
            <p className="mt-1 text-sm text-white/75">Full custody transfers to MoWT.</p>
          </div>
          <div className="rounded-imme bg-white/[0.06] p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber-300">Sep 2026</p>
            <p className="mt-2 font-display text-lg font-bold">Performance review</p>
            <p className="mt-1 text-sm text-white/75">Final reporting in Uganda.</p>
          </div>
          <div className="rounded-imme bg-white/[0.06] p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber-300">Dec 2026</p>
            <p className="mt-2 font-display text-lg font-bold">Project completion</p>
            <p className="mt-1 text-sm text-white/75">All deliverables sustained by Uganda.</p>
          </div>
        </div>
      </PageSection>
    </PageShell>
  );
}
