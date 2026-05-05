/**
 * Single source of truth for IMME Project content (facts, partners, milestones, navigation).
 * Update this file rather than hard-coding values inside individual page components — every
 * public page imports from here so a single edit propagates across hero, key-facts bar, footer,
 * progress timeline, and the persistent status badge.
 *
 * See `website_design_brief.md` for the source of these values.
 */

export const IMME_PROJECT = {
  shortName: "IMME Project",
  longName:
    "The Project for Establishment of Integrated Manuals and Main Facility Management System of Expressways in Uganda",
  tagline:
    "KOICA-funded Korea–Uganda cooperation delivering integrated lifecycle manuals and a bridge management system pilot for Uganda's expressways.",
  oneLineAnchor:
    "KOICA-backed Uganda expressway program delivering lifecycle integrated manuals and a KEE bridge-management pilot, with Korean expressway expertise and strong emphasis on localization, usability, and institutional handover.",
  fundingLine: "Funded by KOICA with support from the Republic of Korea.",
  /** KOICA project reference shown in the footer. */
  projectCode: "KOICA / Uganda 2023–2026",
  durationLabel: "Jan 2023 – Dec 2026",
} as const;

/** Top of-the-fold key-facts bar (Home §5.1). Each item renders as a 60–72px numeral + caption. */
export const IMME_KEY_FACTS: ReadonlyArray<{
  id: string;
  numeral: string;
  unit?: string;
  caption: string;
}> = [
  { id: "budget", numeral: "USD 7.5", unit: "M", caption: "Total budget" },
  { id: "duration", numeral: "40→48", unit: "months", caption: "Project duration (Jan 2023 – Dec 2026)" },
  { id: "manuals", numeral: "6", unit: "manual types", caption: "To be handed over to MoWT" },
  { id: "bridges", numeral: "4", unit: "bridges", caption: "BMS pilot on Kampala–Entebbe Expressway" },
];

/** "Our Development Strategy" pillars — Home §5.1 strategy strip. */
export const IMME_STRATEGY_PILLARS: ReadonlyArray<{
  id: "localization" | "applicability" | "consistency" | "searchability";
  label: string;
  description: string;
  /** Tailwind text-color class used on the icon dot to align with the brief's swatch hint. */
  dotClass: string;
}> = [
  {
    id: "localization",
    label: "Localization",
    description: "Aligned with Uganda's institutions, laws, and ongoing projects.",
    dotClass: "bg-imme-navy",
  },
  {
    id: "applicability",
    label: "Applicability",
    description: "Detailed procedures usable in real workflows, not theoretical.",
    dotClass: "bg-imme-amber",
  },
  {
    id: "consistency",
    label: "Consistency",
    description: "Unified format across all six manual types.",
    dotClass: "bg-imme-green",
  },
  {
    id: "searchability",
    label: "Searchability",
    description: "Coded items, pictorial illustration, smartphone-ready.",
    dotClass: "bg-[#7a5a3c]",
  },
];

/** Manual types & their landing routes — used in nav, manuals overview lifecycle, and footer. */
export const IMME_MANUALS: ReadonlyArray<{
  id: "planning" | "design" | "construction" | "operation" | "maintenance";
  code: string;
  title: string;
  blurb: string;
  href: string;
}> = [
  {
    id: "planning",
    code: "M-01",
    title: "Planning Manual",
    blurb: "Appraisal, traffic demand, cost-benefit, and Uganda's Road Management System (RMS, HDM-4).",
    href: "/manuals/planning",
  },
  {
    id: "design",
    code: "M-02",
    title: "Design Manual",
    blurb: "Geometric, pavement, structures, drainage, and tunnel design tailored to expressway standards.",
    href: "/manuals/design",
  },
  {
    id: "construction",
    code: "M-03",
    title: "Construction Management Manual",
    blurb: "Contract administration, supervision, and specifications across earthworks, pavement, structures, QC, and tunnels.",
    href: "/manuals/construction",
  },
  {
    id: "operation",
    code: "M-04",
    title: "Operation Manual",
    blurb: "Traffic management, control room & VMS, disaster management, customer care, and service areas.",
    href: "/manuals/operation",
  },
  {
    id: "maintenance",
    code: "M-05",
    title: "Maintenance Manual",
    blurb: "Five-volume structure: pavement, bridge, drainage & slope, road furniture, and tunnel.",
    href: "/manuals/maintenance",
  },
];

/** 18-step roadmap (Progress §5.5). Use for both the timeline visual and the milestones cards. */
export type IMMEMilestoneStatus = "completed" | "current" | "planned";

export const IMME_ROADMAP: ReadonlyArray<{
  step: number;
  title: string;
  date?: string;
  status: IMMEMilestoneStatus;
  outcome?: string;
}> = [
  { step: 1, title: "Inception Survey", status: "completed", date: "Jan 2023" },
  { step: 2, title: "Project Planning", status: "completed", date: "Feb 2023" },
  { step: 3, title: "Literature Review", status: "completed", date: "Mar 2023" },
  { step: 4, title: "Inception Presentation / 1st Workshop", status: "completed", date: "Apr 2023" },
  { step: 5, title: "1st Invitation Program (Korea)", status: "completed", date: "Sep 2023", outcome: "MoWT delegation completed expressway training in Korea." },
  { step: 6, title: "Site Survey", status: "completed", date: "Late 2023" },
  { step: 7, title: "Overseas Case Study", status: "completed", date: "Early 2024" },
  { step: 8, title: "Interim Presentation / 2nd Workshop", status: "completed", date: "May 2024" },
  { step: 9, title: "2nd Invitation Program (Korea)", status: "completed", date: "Oct 2024", outcome: "19 MoWT staff completed Action Plans for Uganda's expressway strategy." },
  { step: 10, title: "Draft Manual", status: "completed", date: "Late 2024" },
  { step: 11, title: "OJT (6 months)", status: "completed", date: "2025" },
  { step: 12, title: "3rd Workshop", status: "current", date: "Sep 2025", outcome: "Draft manual review, BMS integration, and next-step alignment with MoWT." },
  { step: 13, title: "Final Manual", status: "planned", date: "Nov 2025" },
  { step: 14, title: "Consulting", status: "planned", date: "Dec 2025 – Mar 2026" },
  { step: 15, title: "Handover (6 manual types to MoWT)", status: "planned", date: "Apr 2026" },
  { step: 16, title: "Final Presentation", status: "planned", date: "2026" },
  { step: 17, title: "Performance Presentation", status: "planned", date: "Sep 2026" },
  { step: 18, title: "Project Completion", status: "planned", date: "Dec 2026" },
];

/** "We are here" snapshot for the home page hero ribbon and the persistent status badge. */
export const IMME_CURRENT_STEP = IMME_ROADMAP.find((m) => m.status === "current") ?? IMME_ROADMAP[0];
export const IMME_TOTAL_STEPS = IMME_ROADMAP.length;

/** Key-dates table (Brief §9). */
export const IMME_KEY_DATES: ReadonlyArray<{ date: string; event: string; highlight?: boolean }> = [
  { date: "Jan 2023", event: "Project Kickoff" },
  { date: "Sep 2023", event: "1st Korea Invitation Program" },
  { date: "May 2024", event: "2nd Technical Workshop (Interim)" },
  { date: "Oct 2024", event: "2nd Korea Invitation Program" },
  { date: "Sep 2025", event: "3rd Technical Workshop", highlight: true },
  { date: "Nov 2025", event: "Final Manual Development (by PMC)" },
  { date: "Dec 2025", event: "Final Review Request to MoWT" },
  { date: "Feb 2026", event: "MoWT delivers review comments" },
  { date: "Mar 2026", event: "Final Manual consultation & update" },
  { date: "Apr 2026", event: "Handover of 6 Manual Types to MoWT" },
  { date: "Sep 2026", event: "Final Reporting Session in Uganda" },
  { date: "Dec 2026", event: "Project Completion" },
];

/** Implementing partners (About §5.2 & footer). */
export const IMME_PARTNERS: ReadonlyArray<{
  id: string;
  name: string;
  role: string;
  description: string;
  href?: string;
}> = [
  {
    id: "koica",
    name: "KOICA",
    role: "Funding agency, Republic of Korea",
    description: "Korea International Cooperation Agency — funds and oversees the program.",
    href: "https://www.koica.go.kr/koica_en/index.do",
  },
  {
    id: "mowt",
    name: "MoWT (Uganda)",
    role: "Government counterpart and post-handover manual owner",
    description:
      "Ministry of Works and Transport, Republic of Uganda. Owns the manuals and the BMS after handover, with capacity transferred via OJT and workshops.",
    href: "https://www.works.go.ug/",
  },
  {
    id: "kec",
    name: "Korea Expressway Corporation (KEC)",
    role: "Lead consultant — expressway expertise",
    description: "Korea's national expressway operator brings 50+ years of operations and maintenance know-how.",
  },
  {
    id: "dohwa",
    name: "DOHWA Engineering",
    role: "Technical consultant",
    description: "Civil and transport infrastructure engineering, contributing to design, construction, and BMS.",
  },
  {
    id: "cheil",
    name: "CHEIL Engineering",
    role: "Technical consultant",
    description: "Specialist engineering input across maintenance and structures.",
  },
];

/** Top-level navigation visible in the public site header. */
export const IMME_NAV: ReadonlyArray<{
  label: string;
  href: string;
  children?: ReadonlyArray<{ label: string; href: string }>;
}> = [
  {
    label: "About",
    href: "/about",
    children: [
      { label: "Background & Rationale", href: "/about#background" },
      { label: "Objectives & Outputs", href: "/about#objectives" },
      { label: "Key Partners", href: "/about#partners" },
    ],
  },
  {
    label: "Manuals",
    href: "/manuals",
    children: [
      { label: "Overview", href: "/manuals" },
      { label: "Planning", href: "/manuals/planning" },
      { label: "Design", href: "/manuals/design" },
      { label: "Construction Management", href: "/manuals/construction" },
      { label: "Operation", href: "/manuals/operation" },
      { label: "Maintenance", href: "/manuals/maintenance" },
    ],
  },
  {
    label: "BMS",
    href: "/bms",
    children: [
      { label: "BMS Overview", href: "/bms" },
      { label: "Kampala–Entebbe Pilot", href: "/bms/kee-pilot" },
    ],
  },
  { label: "Progress", href: "/progress" },
  { label: "Capacity Building", href: "/capacity-building" },
  { label: "News", href: "/news" },
  { label: "Contact", href: "/contact" },
];

/** KEE pilot bridges (BMS §5.4). Numbers and IDs are placeholders pending field data. */
export const IMME_KEE_PILOT_BRIDGES: ReadonlyArray<{
  id: string;
  name: string;
  inspectionStatus: "Inspected" | "Scheduled" | "Pending";
  bmsDataStatus: "Loaded" | "In progress" | "Pending";
}> = [
  { id: "KEE-B-01", name: "Pilot Bridge 01 (Kampala approach)", inspectionStatus: "Inspected", bmsDataStatus: "Loaded" },
  { id: "KEE-B-02", name: "Pilot Bridge 02", inspectionStatus: "Inspected", bmsDataStatus: "Loaded" },
  { id: "KEE-B-03", name: "Pilot Bridge 03", inspectionStatus: "Scheduled", bmsDataStatus: "In progress" },
  { id: "KEE-B-04", name: "Pilot Bridge 04 (Entebbe approach)", inspectionStatus: "Scheduled", bmsDataStatus: "In progress" },
];

/** News & Updates seed data — replace with CMS feed once available. */
export const IMME_NEWS: ReadonlyArray<{
  id: string;
  date: string;
  category: "Workshop" | "Manual" | "BMS" | "Capacity Building";
  title: string;
  summary: string;
  href?: string;
}> = [
  {
    id: "n-2025-09",
    date: "Sep 2025",
    category: "Workshop",
    title: "3rd Technical Workshop convened in Kampala",
    summary:
      "MoWT and the KEC-led consortium reviewed draft manuals and aligned on BMS integration steps for the Kampala–Entebbe pilot.",
  },
  {
    id: "n-2025-08",
    date: "Aug 2025",
    category: "Manual",
    title: "Draft Maintenance Manual circulated for OJT review",
    summary:
      "The 5-volume maintenance manual (Pavement, Bridge, Drainage+Slope, Road Furniture, Tunnel) entered on-the-job training.",
  },
  {
    id: "n-2024-10",
    date: "Oct 2024",
    category: "Capacity Building",
    title: "19 MoWT staff completed the 2nd Korea Invitation Program",
    summary:
      "Lectures covered pavement and bridge maintenance, VE & LCC, slope protection, and investment projects; field trips spanned R&D Center, Han River Tunnel, Godeok Grand Bridge, and autonomous drone bridge inspection.",
  },
];

/** Identifying contact endpoints for the Contact page (placeholders — wire to CMS later). */
export const IMME_CONTACTS = {
  pmc: {
    label: "Project Management Consultant",
    detail: "imme-pmc@example.org",
  },
  mowt: {
    label: "MoWT Counterpart",
    detail: "imme-counterpart@works.go.ug",
  },
  koica: {
    label: "KOICA Uganda Office",
    detail: "Reference: KOICA Uganda Project Office",
  },
} as const;
