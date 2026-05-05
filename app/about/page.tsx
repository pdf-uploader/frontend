import Link from "next/link";
import { PageSection, PageShell } from "@/components/imme/page-shell";
import { IMME_PARTNERS, IMME_PROJECT } from "@/lib/imme/project";
import { ArrowRightIcon, CheckCircleIcon, CompassIcon } from "@/components/imme/imme-icons";

export const metadata = {
  title: "About the Project",
  description:
    "Background, objectives, and key partners behind the Korea–Uganda IMME Project for expressway integrated manuals and bridge management.",
};

const GAPS_BEFORE: ReadonlyArray<string> = [
  "No expressway-specific design and operations standards",
  "Missing detailed procedures for tunnels, concrete pavement, geotechnics",
  "Bridge inspection detail and performance indices not codified",
  "Limited guidance on lifecycle maintenance budgeting",
];

const GAPS_AFTER: ReadonlyArray<string> = [
  "Six manual types covering planning → maintenance, all coded and searchable",
  "Tunnel, pavement, geotechnical, and structural sections fully detailed",
  "Bridge inspection procedures wired into the BMS pilot on KEE",
  "Annual maintenance budgeting and KPIs embedded in the maintenance manual",
];

const OBJECTIVE_OUTPUT_PAIRS: ReadonlyArray<{ objective: string; output: string }> = [
  {
    objective: "Improve lifecycle management of Uganda's expressways.",
    output: "An integrated 6-manual system that tracks an expressway from planning to maintenance.",
  },
  {
    objective: "Reduce cost and time for expressway management.",
    output: "Standardized procedures, KPIs, and a digital BMS to prioritize maintenance work.",
  },
  {
    objective: "Enable efficient and systematic expressway development.",
    output: "Manuals localized to Uganda's institutions and aligned with ongoing projects.",
  },
  {
    objective: "Generate broader economic effectiveness for Uganda.",
    output: "Capacity transfer (workshops, OJT, Korea invitations) so MoWT owns and sustains the manuals.",
  },
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About the project"
      title="A program designed for handover, not handoff."
      subtitle={IMME_PROJECT.oneLineAnchor}
      breadcrumbs={[{ label: "About" }]}
      intro={
        <div className="flex flex-wrap gap-3">
          <Link href="#background" className="imme-pill border-imme-navy/20 bg-white text-imme-navy hover:bg-imme-concrete">
            Background & Rationale
          </Link>
          <Link href="#objectives" className="imme-pill border-imme-navy/20 bg-white text-imme-navy hover:bg-imme-concrete">
            Objectives & Outputs
          </Link>
          <Link href="#partners" className="imme-pill border-imme-navy/20 bg-white text-imme-navy hover:bg-imme-concrete">
            Key Partners
          </Link>
        </div>
      }
    >
      {/* Background & Rationale */}
      <PageSection
        id="background"
        eyebrow="5.2 — Background & Rationale"
        title="Why Uganda needs a unified expressway manual system"
        description="Uganda's expressway sector is growing rapidly, but the technical guidance available to engineers, contractors, and operators is fragmented. The IMME Project closes the gap with a single, lifecycle-oriented system."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="space-y-4 text-[15px] leading-7 text-imme-ink imme-prose">
            <p>
              Uganda's road network has expanded into expressway scale with the Kampala–Entebbe Expressway (KEE) and
              several upcoming projects. Until now, the country has relied on general highway standards adapted on
              an ad-hoc basis — leaving important domains under-specified.
            </p>
            <p>
              The Ministry of Works and Transport (MoWT), in partnership with Korea International Cooperation
              Agency (KOICA), commissioned this program to consolidate planning, design, construction management,
              operation, and maintenance into a coherent set of manuals plus a Bridge Management System pilot on
              KEE. The manuals are designed to be picked up by a junior engineer in the field, on a smartphone,
              and used the same day.
            </p>
          </div>
          <aside className="space-y-4">
            <div className="rounded-imme border border-imme-line bg-imme-concrete p-5">
              <p className="imme-eyebrow">Identified gaps (before)</p>
              <ul className="mt-3 space-y-2 text-sm text-imme-muted">
                {GAPS_BEFORE.map((gap) => (
                  <li key={gap} className="flex items-start gap-2">
                    <span aria-hidden className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-imme-muted" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-imme border border-imme-green/30 bg-imme-green/5 p-5">
              <p className="imme-eyebrow text-imme-green">After IMME (after)</p>
              <ul className="mt-3 space-y-2 text-sm text-imme-ink">
                {GAPS_AFTER.map((gap) => (
                  <li key={gap} className="flex items-start gap-2">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-imme-green" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </PageSection>

      {/* Objectives & Outputs */}
      <PageSection
        id="objectives"
        variant="concrete"
        eyebrow="5.2 — Objectives & Outputs"
        title="Outcomes Uganda will own after April 2026"
      >
        <div className="overflow-hidden rounded-imme border border-imme-line bg-white shadow-imme-card">
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="border-b border-imme-line bg-imme-navy px-5 py-3 sm:border-b-0 sm:border-r">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-imme-amber-300">Objective</p>
            </div>
            <div className="bg-imme-navy px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-imme-amber-300">Output</p>
            </div>
            {OBJECTIVE_OUTPUT_PAIRS.map((pair, idx) => (
              <div key={`pair-${idx}`} className="contents">
                <div className="border-b border-imme-line px-5 py-5 sm:border-r">
                  <p className="font-display text-base font-semibold text-imme-navy">{pair.objective}</p>
                </div>
                <div className="border-b border-imme-line px-5 py-5">
                  <p className="text-sm leading-6 text-imme-muted">{pair.output}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Improved lifecycle management",
            "Reduced cost & time",
            "Efficient & systematic development",
            "Broader economic effectiveness",
          ].map((label, idx) => (
            <div key={label} className="rounded-imme border border-imme-line bg-white p-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber">Outcome {idx + 1}</p>
              <p className="mt-2 font-display text-base font-semibold text-imme-navy">{label}</p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Key Partners */}
      <PageSection
        id="partners"
        eyebrow="5.2 — Key Partners"
        title="Five organizations, one handover plan"
        description="KOICA funds. MoWT owns. KEC, DOHWA, and CHEIL deliver. The whole partner stack is structured so capacity and IP transfer entirely to Uganda by completion."
      >
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {IMME_PARTNERS.map((partner) => (
            <li key={partner.id} className="flex h-full flex-col gap-3 rounded-imme border border-imme-line bg-white p-6 shadow-imme-card">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-imme-navy/5 text-imme-navy">
                  <CompassIcon className="h-5 w-5" />
                </span>
                <p className="font-display text-lg font-bold text-imme-navy">{partner.name}</p>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber">{partner.role}</p>
              <p className="text-sm leading-6 text-imme-muted">{partner.description}</p>
              {partner.href ? (
                <a
                  href={partner.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-imme-navy hover:text-imme-amber"
                >
                  Visit website
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </PageSection>
    </PageShell>
  );
}
