import { PageSection, PageShell } from "@/components/imme/page-shell";
import { CapIcon, CheckCircleIcon, PeopleIcon, ToolboxIcon } from "@/components/imme/imme-icons";
import Link from "next/link";

export const metadata = {
  title: "Capacity Building",
  description:
    "Two Korea Invitation Programs, three Technical Workshops in Uganda, and six months of On-the-Job Training so MoWT can sustain the manuals and BMS.",
};

const INVITATIONS: ReadonlyArray<{
  edition: string;
  date: string;
  participants?: string;
  topics: ReadonlyArray<string>;
  fieldTrips: ReadonlyArray<string>;
  outcomes: string;
}> = [
  {
    edition: "1st Korea Invitation Program",
    date: "September 2023",
    participants: "MoWT delegation",
    topics: [
      "Korean expressway history & institutional structure",
      "Pavement & bridge maintenance fundamentals",
      "Operations & traffic control room practice",
    ],
    fieldTrips: [
      "Korea Expressway Corporation HQ",
      "Pavement & bridge maintenance sites",
      "Toll integration center",
    ],
    outcomes:
      "Established the working relationship between MoWT and KEC and seeded the Action Plan format used in the second program.",
  },
  {
    edition: "2nd Korea Invitation Program",
    date: "October 2024",
    participants: "19 MoWT staff",
    topics: [
      "Korean expressway history",
      "Pavement & bridge maintenance",
      "Value Engineering & Life-Cycle Cost (VE & LCC)",
      "Slope protection",
      "Investment projects",
    ],
    fieldTrips: [
      "R&D Center",
      "Disaster Management Center",
      "Toll Integration Center",
      "Han River Tunnel",
      "Godeok Grand Bridge",
      "Autonomous drone structure inspection",
    ],
    outcomes:
      "All trainees completed Action Plans for Uganda's expressway strategy — written commitments to apply specific Korean practice back home.",
  },
];

const WORKSHOPS: ReadonlyArray<{
  ordinal: string;
  date: string;
  focus: string;
  deliverables: ReadonlyArray<string>;
}> = [
  {
    ordinal: "1st Workshop",
    date: "Apr 2023",
    focus: "Inception & kickoff",
    deliverables: ["Project plan agreed", "Stakeholder map established", "Manual scope & lifecycle confirmed"],
  },
  {
    ordinal: "2nd Workshop",
    date: "May 2024",
    focus: "Interim — site survey, overseas case study, development direction",
    deliverables: ["Site survey results reviewed", "Overseas case study findings adopted", "Manual structure ratified"],
  },
  {
    ordinal: "3rd Workshop",
    date: "Sep 2025",
    focus: "Draft manual review, BMS integration, next steps",
    deliverables: ["Draft manuals reviewed by MoWT", "BMS integration milestones agreed", "Final manual schedule confirmed"],
  },
];

export default function CapacityBuildingPage() {
  return (
    <PageShell
      eyebrow="Capacity building"
      title="Korea is the vehicle. Uganda is the protagonist."
      subtitle="Two Korea Invitation Programs, three Technical Workshops in Uganda, and six months of on-the-job training. Together, they ensure the manuals and the BMS keep working long after the consultants have left."
      breadcrumbs={[{ label: "Capacity Building" }]}
    >
      <PageSection
        eyebrow="Invitation programs"
        title="Two visits to Korea, one shared playbook"
        description="The invitation programs ground the manuals in lived experience: Ugandan engineers see Korean expressways operate end-to-end, then commit to applying specific practices at home."
      >
        <ul className="grid gap-5 lg:grid-cols-2">
          {INVITATIONS.map((inv) => (
            <li key={inv.edition} className="flex h-full flex-col gap-4 rounded-imme border border-imme-line bg-white p-6 shadow-imme-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber">{inv.date}</p>
                  <h3 className="mt-1 font-display text-lg font-bold text-imme-navy">{inv.edition}</h3>
                  {inv.participants ? (
                    <p className="mt-1 text-sm text-imme-muted">{inv.participants}</p>
                  ) : null}
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-imme-amber/10 text-imme-amber">
                  <CapIcon className="h-5 w-5" />
                </span>
              </div>
              <div>
                <p className="imme-eyebrow">Topics</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {inv.topics.map((topic) => (
                    <li key={topic} className="rounded-full border border-imme-line bg-imme-concrete px-2.5 py-1 text-[12px] text-imme-ink">
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="imme-eyebrow">Field trips</p>
                <ul className="mt-2 grid gap-1.5 text-sm text-imme-muted sm:grid-cols-2">
                  {inv.fieldTrips.map((trip) => (
                    <li key={trip} className="flex items-start gap-2">
                      <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-imme-green" />
                      <span>{trip}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg bg-imme-amber/[0.06] p-4">
                <p className="imme-eyebrow text-imme-amber">Outcome</p>
                <p className="mt-1.5 text-sm leading-6 text-imme-ink">{inv.outcomes}</p>
              </div>
            </li>
          ))}
        </ul>
      </PageSection>

      <PageSection
        variant="concrete"
        eyebrow="Technical workshops in Uganda"
        title="Three checkpoints, three signed-off documents"
      >
        <ol className="grid gap-4 lg:grid-cols-3">
          {WORKSHOPS.map((w) => (
            <li key={w.ordinal} className="flex h-full flex-col gap-3 rounded-imme border border-imme-line bg-white p-5 shadow-imme-card">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-imme-navy/[0.06] text-imme-navy">
                <PeopleIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber">{w.date}</p>
                <p className="mt-1 font-display text-lg font-bold text-imme-navy">{w.ordinal}</p>
              </div>
              <p className="text-sm leading-6 text-imme-muted">{w.focus}</p>
              <ul className="mt-1 space-y-1.5 text-sm text-imme-ink">
                {w.deliverables.map((deliverable) => (
                  <li key={deliverable} className="flex items-start gap-2">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-imme-green" />
                    <span>{deliverable}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </PageSection>

      <PageSection eyebrow="On-the-Job Training (OJT)" title="Six months of practice with the draft manual">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <div className="rounded-imme border border-imme-line bg-white p-7 shadow-imme-card">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-imme-green/10 text-imme-green">
              <ToolboxIcon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold text-imme-navy">Embed knowledge in MoWT</h3>
            <p className="mt-2 text-[15px] leading-7 text-imme-muted">
              For six months, MoWT engineers worked through the draft manual on real assignments — flagging
              passages that did not match Ugandan procedures and triggering revisions. The OJT cycle is what
              made the manuals workable rather than theoretical.
            </p>
            <ul className="mt-5 grid gap-2 text-sm text-imme-ink">
              {[
                "Duration: 6 months",
                "Format: hands-on practice with the initial draft manual",
                "Goal: embed manual knowledge in MoWT staff so the agency owns the document",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-imme-green" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="rounded-imme bg-imme-navy p-7 text-white shadow-imme-soft">
            <p className="imme-eyebrow text-imme-amber-300">Sustainability</p>
            <h3 className="mt-2 font-display text-xl font-bold">A handover, not a handoff.</h3>
            <p className="mt-3 text-[15px] leading-7 text-white/80">
              The combination of invitation programs (vision), workshops (alignment), and OJT (practice) means
              the manuals are usable on day one of MoWT ownership.
            </p>
            <Link href="/progress" className="mt-6 inline-flex items-center gap-2 rounded-full bg-imme-amber px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110">
              See the project roadmap
            </Link>
          </aside>
        </div>
      </PageSection>
    </PageShell>
  );
}
