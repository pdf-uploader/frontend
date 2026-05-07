import type { Folder } from "@/lib/types";

/** One default hue for every locked folder on the shelf. */
export const LOCKED_SPINE_COLOR = "#5a6570";

const SPINE_COLORS: Record<string, string> = {
  "Planning Manual": "#1a2744",
  "Expressway Planning Manual": "#1a2744",
  "Design Manual": "#2d5a3d",
  "Construction Manual": "#7a3020",
  "Construction Specification": "#4a3060",
  "Operation Manual": "#1a4a5a",
  "Maintenance Manual": "#5a4a10",
  "PPP Feasibility Review Guideline": "#3a2010",
  "PPP Feasibility Review": "#3a2010",
  "BMS User Manual": "#1a3a5a",
  "Expressway Development Manual": "#3a3a3a",
  "My Life": "#2a1a2a",
};

/** Assign on folder create (and persisted when the API supports `spineColor`). */
export const SPINE_PALETTE = [
  "#1a2744",
  "#2d5a3d",
  "#7a3020",
  "#4a3060",
  "#1a4a5a",
  "#5a4a10",
  "#3a2010",
  "#1a3a5a",
  "#3a3a3a",
  "#2a1a2a",
  "#284a6e",
  "#6b3a6b",
  "#3d5a4a",
  "#5a3d2d",
  "#2d4a5a",
] as const;

export function pickRandomSpineColor(): string {
  return SPINE_PALETTE[Math.floor(Math.random() * SPINE_PALETTE.length)]!;
}

function spineColorFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h << 5) - h + id.charCodeAt(i);
  return SPINE_PALETTE[Math.abs(h) % SPINE_PALETTE.length]!;
}

/** Shelf spine fill: locked → default; else stored, named map, or stable hash. */
export function resolveShelfSpineColor(folder: Folder): string {
  if (folder.lock) return LOCKED_SPINE_COLOR;
  const stored = folder.spineColor?.trim();
  if (stored && /^#[0-9A-Fa-f]{6}$/.test(stored)) return stored;
  const named = SPINE_COLORS[folder.foldername];
  if (named) return named;
  return spineColorFromId(folder.id);
}
