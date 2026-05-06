import { PageSection, PageShell } from "@/components/imme/page-shell";
import {
  IMME_CURRENT_STEP,
  IMME_KEY_DATES,
  IMME_ROADMAP,
  IMME_TOTAL_STEPS,
} from "@/lib/imme/project";
import { CheckCircleIcon, CircleIcon, ClockIcon } from "@/components/imme/imme-icons";

export const metadata = {
  title: "Progress & Roadmap",
  description:
    "The 18-step IMME Project roadmap from kickoff to completion, plus expandable milestone records and key dates.",
};

const STATUS_TONE: Record<string, { ring: string; chip: string; Icon: typeof CheckCircleIcon }> = {
  completed: { ring: "border-imme-green", chip: "bg-imme-green/10 text-imme-green border-imme-green/30", Icon: CheckCircleIcon },
  current: { ring: "border-imme-amber", chip: "bg-imme-amber/15 text-imme-amber border-imme-amber/40", Icon: ClockIcon },
  planned: { ring: "border-imme-line", chip: "bg-imme-muted/10 text-imme-muted border-imme-line", Icon: CircleIcon },
};

export default function ProgressPage() {
  return (
    <PageShell
      eyebrow="Progress"
      title={`Step ${IMME_CURRENT_STEP.step} / ${IMME_TOTAL_STEPS} — ${IMME_CURRENT_STEP.title}`}
      subtitle="The complete 18-step project roadmap, current state, and the dates that matter for the handover in April 2026."
      breadcrumbs={[{ label: "Progress" }]}
    >
      <PageSection eyebrow="Full roadmap" title="18 steps from kickoff to completion">
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {IMME_ROADMAP.map((m) => {
            const tone = STATUS_TONE[m.status];
            const Icon = tone.Icon;
            return (
              <li
                key={m.step}
                className={[
                  "flex h-full flex-col gap-3 rounded-imme border-2 bg-white p-5 shadow-imme-card",
                  tone.ring,
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-imme-muted">
                    Step {String(m.step).padStart(2, "0")}
                  </p>
                  <span className={["inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider", tone.chip].join(" ")}>
                    <Icon className="h-3 w-3" />
                    {m.status}
                  </span>
                </div>
                <p className="font-display text-base font-bold text-imme-navy">{m.title}</p>
                {m.date ? (
                  <p className="font-mono text-[11px] uppercase tracking-wider text-imme-muted">{m.date}</p>
                ) : null}
                {m.outcome ? (
                  <p className="text-[13px] leading-6 text-imme-muted">{m.outcome}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </PageSection>

      <PageSection
        variant="concrete"
        eyebrow="Milestones & achievements"
        title="What was done, when, and the outcomes"
      >
        <div className="space-y-3">
          {IMME_ROADMAP.filter((m) => m.status !== "planned").map((m) => (
            <details
              key={m.step}
              className="group rounded-imme border border-imme-line bg-white shadow-imme-card open:border-imme-navy"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-imme-navy/[0.06] font-mono text-[12px] text-imme-navy">
                    {String(m.step).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-display text-base font-semibold text-imme-navy">{m.title}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-imme-muted">{m.date ?? ""}</p>
                  </div>
                </div>
                <span className={["inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", STATUS_TONE[m.status].chip].join(" ")}>
                  {m.status}
                </span>
              </summary>
              <div className="border-t border-imme-line px-5 py-4 text-sm leading-6 text-imme-muted">
                {m.outcome ?? "Detailed outcome and supporting documents will be added as field reports become available."}
              </div>
            </details>
          ))}
        </div>
      </PageSection>

      <PageSection eyebrow="Key dates" title="The dates that matter through 2026">
        <div className="overflow-x-auto rounded-imme border border-imme-line bg-white shadow-imme-card">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-imme-navy text-white">
              <tr>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-imme-line">
              {IMME_KEY_DATES.map((row) => (
                <tr key={`${row.date}-${row.event}`} className={row.highlight ? "bg-imme-amber/[0.06]" : undefined}>
                  <td className="px-4 py-3 font-mono text-imme-navy">{row.date}</td>
                  <td className="px-4 py-3 text-imme-ink">
                    {row.event}
                    {row.highlight ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-imme-amber px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white">
                        Now
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageSection>
    </PageShell>
  );
}
