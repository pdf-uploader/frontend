import { PageSection, PageShell } from "@/components/imme/page-shell";
import { IMME_KEE_PILOT_BRIDGES } from "@/lib/imme/project";
import { MapPinIcon } from "@/components/imme/imme-icons";

export const metadata = {
  title: "Kampala–Entebbe Pilot",
  description:
    "Four pilot bridges on the Kampala–Entebbe Expressway, where the Bridge Management System is verified through practical operation.",
};

const STATUS_TONE: Record<string, string> = {
  Inspected: "bg-imme-green/10 text-imme-green border-imme-green/30",
  Loaded: "bg-imme-green/10 text-imme-green border-imme-green/30",
  Scheduled: "bg-imme-amber/10 text-imme-amber border-imme-amber/30",
  "In progress": "bg-imme-amber/10 text-imme-amber border-imme-amber/30",
  Pending: "bg-imme-muted/10 text-imme-muted border-imme-muted/30",
};

export default function KeePilotPage() {
  return (
    <PageShell
      eyebrow="BMS · Kampala–Entebbe"
      title="Four bridges. One operating proof."
      subtitle="The pilot validates the BMS on the Kampala–Entebbe Expressway (KEE) under live conditions, so MoWT can scale the system to other expressways with confidence."
      breadcrumbs={[
        { label: "BMS", href: "/bms" },
        { label: "Kampala–Entebbe Pilot" },
      ]}
    >
      <PageSection eyebrow="Pilot map" title="Bridge locations along KEE">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <KeeRouteSchematic />
          <aside className="rounded-imme border border-imme-line bg-white p-6 shadow-imme-card">
            <p className="imme-eyebrow">Notes</p>
            <p className="mt-2 text-sm leading-6 text-imme-muted">
              Bridge IDs and inspection statuses below are placeholders pending the pilot inspection report.
              The schematic shows approximate positions; final coordinates and KEE chainage are recorded in the
              BMS at handover.
            </p>
          </aside>
        </div>
      </PageSection>

      <PageSection variant="concrete" eyebrow="Bridge register" title="Pilot bridges & current status">
        <div className="overflow-x-auto rounded-imme border border-imme-line bg-white shadow-imme-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-imme-navy text-white">
              <tr>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Bridge ID</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Inspection</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">BMS Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-imme-line">
              {IMME_KEE_PILOT_BRIDGES.map((bridge) => (
                <tr key={bridge.id}>
                  <td className="px-4 py-3 font-mono text-imme-navy">{bridge.id}</td>
                  <td className="px-4 py-3 text-imme-ink">{bridge.name}</td>
                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider", STATUS_TONE[bridge.inspectionStatus] ?? STATUS_TONE.Pending].join(" ")}>
                      {bridge.inspectionStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={["inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider", STATUS_TONE[bridge.bmsDataStatus] ?? STATUS_TONE.Pending].join(" ")}>
                      {bridge.bmsDataStatus}
                    </span>
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

/**
 * Inline SVG schematic of the Kampala–Entebbe Expressway with the four pilot bridges marked.
 * Avoids depending on a real map asset; gives readers a quick spatial sense of the corridor.
 */
function KeeRouteSchematic() {
  const bridges = IMME_KEE_PILOT_BRIDGES.map((b, idx) => ({
    ...b,
    x: 90 + idx * 130,
    y: 110 + (idx % 2 === 0 ? 0 : -8),
  }));

  return (
    <figure className="overflow-hidden rounded-imme border border-imme-line bg-white shadow-imme-card">
      <div className="bg-imme-navy px-5 py-3 text-white">
        <p className="font-mono text-[11px] uppercase tracking-wider text-imme-amber-300">Schematic</p>
        <p className="font-display text-base font-semibold">Kampala ──── KEE ──── Entebbe</p>
      </div>
      <div className="bg-imme-concrete p-5">
        <svg viewBox="0 0 700 230" className="w-full" role="img" aria-label="Schematic of the Kampala–Entebbe Expressway with four pilot bridges marked.">
          <defs>
            <linearGradient id="kee-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f4f2ee" />
              <stop offset="100%" stopColor="#e7e2db" />
            </linearGradient>
          </defs>
          <rect width="700" height="230" fill="url(#kee-bg)" />
          {/* Landmass curves to suggest Lake Victoria coast on the way to Entebbe */}
          <path d="M0 175 C 180 165, 360 195, 540 170 C 620 158, 660 185, 700 178 L 700 230 L 0 230 Z" fill="#dfe7d8" />
          {/* Expressway alignment */}
          <path d="M40 110 C 200 110, 340 120, 480 105 C 580 95, 640 115, 680 115" stroke="#1A2D4F" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M40 110 C 200 110, 340 120, 480 105 C 580 95, 640 115, 680 115" stroke="#C8813A" strokeWidth="1.6" strokeDasharray="6 8" fill="none" />
          {/* City endpoints */}
          <CityPin x={40} y={110} label="Kampala" />
          <CityPin x={680} y={115} label="Entebbe" />
          {/* Pilot bridges */}
          {bridges.map((bridge) => (
            <g key={bridge.id}>
              <line x1={bridge.x} y1={bridge.y} x2={bridge.x} y2={bridge.y - 36} stroke="#1A2D4F" strokeWidth="1" />
              <circle cx={bridge.x} cy={bridge.y} r="8" fill="#C8813A" stroke="#1A2D4F" strokeWidth="1.6" />
              <rect x={bridge.x - 38} y={bridge.y - 60} width="76" height="22" rx="6" fill="#1A2D4F" />
              <text x={bridge.x} y={bridge.y - 45} textAnchor="middle" fontSize="11" fontFamily="ui-monospace, JetBrains Mono, monospace" fill="#fff">
                {bridge.id}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <figcaption className="flex items-center gap-2 border-t border-imme-line bg-white px-5 py-3 text-[12px] text-imme-muted">
        <MapPinIcon className="h-4 w-4 text-imme-amber" />
        Approximate locations — schematic, not to scale.
      </figcaption>
    </figure>
  );
}

function CityPin({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="9" fill="#1A2D4F" />
      <circle cx={x} cy={y} r="3" fill="#fff" />
      <text x={x} y={y + 26} textAnchor="middle" fontSize="13" fontWeight="700" fontFamily="Inter, sans-serif" fill="#1A2D4F">
        {label}
      </text>
    </g>
  );
}
