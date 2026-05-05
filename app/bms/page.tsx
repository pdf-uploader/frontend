import Link from "next/link";
import { PageSection, PageShell } from "@/components/imme/page-shell";
import { ArrowRightIcon, BridgeIcon, CheckCircleIcon, MapPinIcon } from "@/components/imme/imme-icons";

export const metadata = {
  title: "Bridge Management System (BMS)",
  description:
    "A digital BMS piloted on four bridges of the Kampala–Entebbe Expressway, linking inspection data to maintenance planning.",
};

const BMS_FUNCTIONS: ReadonlyArray<{ title: string; body: string }> = [
  {
    title: "Inventory & condition tracking",
    body: "Each pilot bridge has a digital record (geometry, materials, age, defects) so condition can be tracked over time, not from memory.",
  },
  {
    title: "Inspection scheduling",
    body: "Routine, periodic, and precise inspection schedules are auto-generated based on bridge type and prior findings — no spreadsheet juggling.",
  },
  {
    title: "Linked maintenance planning",
    body: "Inspection findings flow directly into prioritized repair and reinforcement plans tied to the Maintenance Manual's bridge volume.",
  },
  {
    title: "Capacity & sustainability",
    body: "MoWT inspectors, trained through workshops and OJT, are the system's primary users. The pilot proves the BMS in operating conditions before scale-up.",
  },
];

export default function BmsOverviewPage() {
  return (
    <PageShell
      eyebrow="Bridge Management System"
      title="A digital backbone for bridge upkeep — proven on KEE first."
      subtitle="The BMS turns inspection data into prioritized maintenance plans. The Bridge Maintenance Manual feeds it; MoWT inspectors run it; KEE proves it."
      breadcrumbs={[{ label: "BMS" }]}
    >
      <PageSection eyebrow="What the BMS does" title="From a clipboard inspection to a funded repair plan">
        <ul className="grid gap-5 md:grid-cols-2">
          {BMS_FUNCTIONS.map((fn) => (
            <li key={fn.title} className="rounded-imme border border-imme-line bg-white p-6 shadow-imme-card">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-imme-amber/10 text-imme-amber">
                <BridgeIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-imme-navy">{fn.title}</h3>
              <p className="mt-2 text-sm leading-6 text-imme-muted">{fn.body}</p>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection
        variant="concrete"
        eyebrow="Manual ↔ system linkage"
        title="The Maintenance Manual and the BMS share one source of truth."
        description="The bridge volume of the Maintenance Manual sets inspection procedures and reporting templates; the BMS encodes them as digital workflows. Update one and the other stays consistent."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-imme border border-imme-line bg-white p-6 shadow-imme-card">
            <p className="imme-eyebrow">Manual side</p>
            <h3 className="mt-2 font-display text-lg font-bold text-imme-navy">Maintenance Manual — Bridge volume</h3>
            <ul className="mt-4 space-y-2 text-sm text-imme-muted">
              {[
                "Routine, periodic, and precise inspection procedures",
                "Defect taxonomy with pictorial illustration",
                "Condition rating & reporting templates",
                "Repair & reinforcement decision rules",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-imme-green" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/manuals/maintenance" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-imme-navy hover:text-imme-amber">
              Read the Maintenance Manual
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-imme border border-imme-amber/30 bg-imme-amber/[0.06] p-6">
            <p className="imme-eyebrow text-imme-amber">BMS side</p>
            <h3 className="mt-2 font-display text-lg font-bold text-imme-navy">Bridge Management System</h3>
            <ul className="mt-4 space-y-2 text-sm text-imme-ink">
              {[
                "Digital inventory & condition tracking",
                "Inspection scheduler tuned to bridge type",
                "Defect entry mirrors the manual's taxonomy",
                "Prioritized repair plan & budget link",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-imme-amber" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/bms/kee-pilot" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-imme-navy hover:text-imme-amber">
              See the KEE pilot
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </PageSection>

      <PageSection variant="navy" eyebrow="Sustainability" title="MoWT engineers run the system after handover.">
        <p className="max-w-3xl text-white/80">
          Through the Korea Invitation Programs and on-the-job training, MoWT inspectors learn the inspection
          regime, defect taxonomy, and BMS data-entry workflow. The pilot is structured so the agency, not the
          consultant, owns the operating rhythm by April 2026.
        </p>
        <Link href="/bms/kee-pilot" className="mt-6 inline-flex items-center gap-2 rounded-full bg-imme-amber px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
          <MapPinIcon className="h-4 w-4" />
          Open the KEE pilot map
        </Link>
      </PageSection>
    </PageShell>
  );
}
