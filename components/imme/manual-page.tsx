import Link from "next/link";
import type { ReactNode } from "react";
import { PageSection, PageShell } from "@/components/imme/page-shell";
import { IMME_MANUALS } from "@/lib/imme/project";
import { ArrowRightIcon, BookStackIcon } from "@/components/imme/imme-icons";

/**
 * Reusable layout for each individual manual sub-page (Brief §5.3 "Each Manual Sub-page").
 * Renders:
 *   - Breadcrumb + display title with the manual's code in mono.
 *   - Two-column body: chapter / section TOC on the left, manual purpose & Uganda context on
 *     the right.
 *   - A footer rail of sibling manuals so users can jump across the lifecycle.
 */
export function ManualPage({
  manualId,
  toc,
  description,
  whyUganda,
}: {
  manualId: (typeof IMME_MANUALS)[number]["id"];
  /**
   * Hierarchical TOC. Keep entries short — one line per chapter, optional bullets per section.
   * The brief's "code on every item" rule is honored by passing pre-formatted codes (e.g. "1.2.3").
   */
  toc: ReadonlyArray<{
    code: string;
    title: string;
    items?: ReadonlyArray<{ code: string; title: string }>;
  }>;
  /** What this manual covers (right-column intro). Plain prose. */
  description: ReactNode;
  /** Why this manual matters in Uganda's context (sub-section under the description). */
  whyUganda: ReactNode;
}) {
  const manual = IMME_MANUALS.find((m) => m.id === manualId);
  if (!manual) {
    throw new Error(`Unknown IMME manual id: ${manualId}`);
  }
  const siblings = IMME_MANUALS.filter((m) => m.id !== manualId);

  return (
    <PageShell
      eyebrow={`Manuals · ${manual.code}`}
      title={manual.title}
      subtitle={manual.blurb}
      breadcrumbs={[
        { label: "Manuals", href: "/manuals" },
        { label: manual.title },
      ]}
    >
      <PageSection eyebrow="Two-column reading view" title="Chapter outline & purpose">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <aside aria-label={`Outline of ${manual.title}`} className="space-y-4">
            <div className="rounded-imme border border-imme-line bg-white p-5 shadow-imme-card">
              <p className="imme-eyebrow">Outline</p>
              <ol className="mt-3 space-y-3">
                {toc.map((chapter) => (
                  <li key={chapter.code} className="border-l-2 border-imme-line pl-3">
                    <p className="flex items-baseline gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-imme-amber">
                        {chapter.code}
                      </span>
                      <span className="font-display text-sm font-semibold text-imme-navy">{chapter.title}</span>
                    </p>
                    {chapter.items?.length ? (
                      <ul className="mt-1.5 space-y-1 pl-1">
                        {chapter.items.map((item) => (
                          <li key={item.code} className="flex gap-2 text-[13px] text-imme-muted">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-imme-muted">
                              {item.code}
                            </span>
                            <span>{item.title}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
            <p className="px-1 text-[12px] leading-5 text-imme-muted">
              The full {manual.title} is delivered in PDF + smartphone-ready format at handover (Apr 2026).
              Codes shown here match the printed manual.
            </p>
          </aside>

          <div className="space-y-8">
            <div className="rounded-imme border border-imme-line bg-white p-7 shadow-imme-card">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-imme-navy text-white">
                  <BookStackIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber">{manual.code}</p>
                  <h2 className="font-display text-xl font-bold text-imme-navy">What this manual covers</h2>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-[15px] leading-7 text-imme-ink imme-prose">{description}</div>
            </div>

            <div className="rounded-imme border border-imme-amber/30 bg-imme-amber/[0.06] p-7">
              <p className="imme-eyebrow text-imme-amber">Why it matters in Uganda</p>
              <div className="mt-3 space-y-3 text-[15px] leading-7 text-imme-ink imme-prose">{whyUganda}</div>
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection variant="concrete" eyebrow="Continue across the lifecycle" title="Other manuals in the suite">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {siblings.map((sibling) => (
            <li key={sibling.id}>
              <Link
                href={sibling.href}
                className="group flex h-full flex-col gap-2 rounded-imme border border-imme-line bg-white p-5 shadow-imme-card transition hover:-translate-y-0.5 hover:border-imme-navy hover:shadow-imme-soft"
              >
                <span className="font-mono text-[11px] uppercase tracking-wider text-imme-amber">{sibling.code}</span>
                <p className="font-display text-base font-semibold text-imme-navy">{sibling.title}</p>
                <p className="text-[13px] leading-6 text-imme-muted">{sibling.blurb}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-imme-navy transition group-hover:text-imme-amber">
                  Open
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </PageSection>
    </PageShell>
  );
}
