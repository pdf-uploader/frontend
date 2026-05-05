import Link from "next/link";
import { IMME_CURRENT_STEP, IMME_TOTAL_STEPS } from "@/lib/imme/project";

/**
 * Persistent project-status pill (Brief §6 "Progress Indicator"). Renders the live current
 * milestone (e.g. "Step 12 of 18 — 3rd Workshop") and links to the full progress page so
 * any visitor on any page can jump to detailed roadmap context in one click.
 */
export function ProjectStatusBadge({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const surface =
    variant === "dark"
      ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
      : "border-imme-line bg-imme-surface text-imme-ink hover:bg-imme-concrete";

  return (
    <Link
      href="/progress"
      aria-label={`Project status: step ${IMME_CURRENT_STEP.step} of ${IMME_TOTAL_STEPS} — ${IMME_CURRENT_STEP.title}. View full roadmap.`}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-mono font-medium tracking-wide transition",
        surface,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden
        className="relative inline-flex h-2 w-2"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-imme-amber/70" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-imme-amber" />
      </span>
      <span className="font-semibold">
        Step {IMME_CURRENT_STEP.step} / {IMME_TOTAL_STEPS}
      </span>
      <span className={variant === "dark" ? "text-white/70" : "text-imme-muted"}>—</span>
      <span className="hidden sm:inline">{IMME_CURRENT_STEP.title}</span>
      <span className="sm:hidden">{IMME_CURRENT_STEP.title.split("(")[0].trim()}</span>
    </Link>
  );
}
