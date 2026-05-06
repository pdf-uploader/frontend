import Link from "next/link";
import { IMME_NAV, IMME_PARTNERS, IMME_PROJECT } from "@/lib/imme/project";

/**
 * Footer — Brief §6 "Footer" with refreshed hierarchy:
 * - Navy slab retains institutional weight; amber headline rails separate columns visually.
 * - Partner row reads as a cohesive horizontal rhythm rather than scattered badges.
 * - Secondary strip emphasizes KOICA funding + neutral copyright.
 */
export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden border-t border-imme-navy-700/30 bg-imme-navy text-white">
      {/* Mesh overlay — subtle depth without photographic assets */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgba(200,129,58,0.28), transparent 42%), radial-gradient(circle at 88% 10%, rgba(46,125,82,0.22), transparent 38%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 40%)",
        }}
      />
      <div className="relative">
        <div className="h-1 w-full bg-gradient-to-r from-imme-green via-imme-amber to-imme-navy-300 opacity-90" aria-hidden />

        <div className="imme-container-wide grid gap-12 py-14 lg:grid-cols-[1.15fr_1fr_0.9fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="font-display font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-imme-amber-300">
                {IMME_PROJECT.shortName}
              </p>
              <h2 className="font-display text-[clamp(1.35rem,2.8vw,1.75rem)] font-bold leading-[1.2] tracking-tight">
                Uganda expressway manuals &amp; bridge management
              </h2>
              <p className="max-w-md text-[15px] leading-7 text-white/72">{IMME_PROJECT.tagline}</p>
            </div>
            <ul className="flex flex-wrap gap-2">
              {IMME_PARTNERS.slice(0, 4).map((partner) => (
                <li key={partner.id}>
                  <span className="inline-flex rounded-imme border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-white/88 backdrop-blur-sm transition hover:border-imme-amber/40 hover:bg-white/[0.1]">
                    {partner.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label="Footer navigation" className="lg:border-x lg:border-white/10 lg:px-10">
            <p className="font-display font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-imme-amber-300">
              Navigate
            </p>
            <ul className="mt-5 grid gap-y-2 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-1">
              {IMME_NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="group inline-flex items-center gap-2 text-[14px] text-white/88 transition hover:text-white">
                    <span className="h-px w-0 bg-imme-amber transition-all duration-200 group-hover:w-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-4 rounded-imme border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm lg:p-7">
            <p className="font-display font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-imme-amber-300">
              Project office
            </p>
            <ul className="space-y-4 text-[14px] text-white/85">
              <li>
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Project code</span>
                <span className="font-mono text-[13px]">{IMME_PROJECT.projectCode}</span>
              </li>
              <li>
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Duration</span>
                <span className="font-mono text-[13px]">{IMME_PROJECT.durationLabel}</span>
              </li>
              <li className="pt-1">
                <Link
                  href="/contact"
                  className="imme-btn-amber inline-flex w-full justify-center sm:w-auto"
                >
                  Contact the project
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/15">
          <div className="imme-container-wide flex flex-col gap-3 py-6 text-[11px] uppercase tracking-[0.14em] text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl leading-relaxed">{IMME_PROJECT.fundingLine}</p>
            <p className="font-mono normal-case tracking-normal text-white/40">
              © {new Date().getFullYear()} {IMME_PROJECT.shortName}. Partner names remain property of their respective organizations.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
