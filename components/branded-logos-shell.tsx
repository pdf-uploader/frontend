import Image from "next/image";
import Link from "next/link";
import { KOICA_WEBSITE_URL, MOWT_WEBSITE_URL } from "@/lib/branding-links";

export const BRANDED_SYSTEM_HEADLINE =
  "Uganda Expressway Integrated Manual and Bridge Management System";

const BRANDED_HEADLINE_TYPOGRAPHY =
  "min-w-0 max-w-full whitespace-pre-wrap px-1 text-center text-balance font-extrabold leading-tight text-blue-950 sm:px-2 sm:leading-[1.12] sm:tracking-wide md:px-3 md:leading-tight md:tracking-tighter lg:px-4 [font-size:clamp(0.9rem,3.2vw+0.3rem,1.75rem)] sm:[font-size:clamp(1.05rem,1.4vw+0.65rem,1.9rem)] md:[font-size:clamp(1.2rem,1.1vw+0.85rem,2.25rem)] lg:[font-size:clamp(1.35rem,0.9vw+1.05rem,2.6rem)] xl:[font-size:clamp(1.5rem,0.8vw+1.2rem,2.75rem)]";

const BRANDED_HEADLINE_NAVBAR_TYPOGRAPHY =
  "min-w-0 max-w-full whitespace-pre-wrap text-center text-balance font-extrabold leading-[1.08] text-blue-950 sm:leading-[1.12] [font-size:clamp(0.58rem,1.35vw+0.38rem,0.92rem)] min-[400px]:[font-size:clamp(0.62rem,1.25vw+0.42rem,1.02rem)] sm:[font-size:clamp(0.68rem,1.05vw+0.48rem,1.18rem)] md:[font-size:clamp(0.78rem,0.9vw+0.52rem,1.38rem)] lg:[font-size:clamp(0.88rem,0.75vw+0.55rem,1.58rem)] xl:[font-size:clamp(0.95rem,0.65vw+0.58rem,1.72rem)]";

/** Title centered in the logged-in navbar on the library home (`/`). */
export function BrandedSystemNavbarTitle({ className = "" }: { className?: string }) {
  return (
    <h1 className={[BRANDED_HEADLINE_NAVBAR_TYPOGRAPHY, "w-full", className].filter(Boolean).join(" ")}>
      {BRANDED_SYSTEM_HEADLINE}
    </h1>
  );
}

/** Standalone page title (e.g. marketing layout). Matches `BrandedTopLogos` wording and type scale. */
export function BrandedSystemHeadline({ className = "" }: { className?: string }) {
  return (
    <h1 className={[BRANDED_HEADLINE_TYPOGRAPHY, "w-full", className].filter(Boolean).join(" ")}>
      {BRANDED_SYSTEM_HEADLINE}
    </h1>
  );
}

type BrandedTopLogosProps = {
  /** When set, a Login control is shown before the KOICA logo. */
  loginHref?: string;
  /** Centered title in the top bar. */
  headline?: string;
};

export function BrandedTopLogos({ loginHref, headline = BRANDED_SYSTEM_HEADLINE }: BrandedTopLogosProps) {
  return (
    <header className="relative z-20 w-full max-w-[100vw] shrink-0 border-b border-slate-200/60 bg-white">
      <div
        className="grid w-full items-center gap-x-2 gap-y-2 py-2.5 pl-2 pr-2 [grid-template-areas:'mowt_actions''title_title'] [grid-template-columns:1fr_auto] sm:gap-x-1.5 sm:gap-y-0 sm:py-3 sm:[grid-template-areas:'mowt_title_actions'] sm:grid-cols-[minmax(0,0.95fr)_minmax(0,2.6fr)_minmax(0,0.95fr)] sm:pl-1.5 sm:pr-1.5 md:gap-x-2 md:py-3.5 md:pl-2 md:pr-2 lg:py-4"
      >
        <a
          href={MOWT_WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block [grid-area:mowt] h-11 w-32 min-w-0 sm:h-14 sm:w-44 md:h-16 md:w-52 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2"
          aria-label="Ministry of Works and Transport — visit works.go.ug"
        >
          <Image
            src="/logo/MOWT.png"
            alt=""
            fill
            className="object-contain object-left"
            priority
            sizes="(max-width: 640px) 176px, 208px"
          />
        </a>
        <h1
          className={["[grid-area:title] col-span-2 sm:col-span-1", BRANDED_HEADLINE_TYPOGRAPHY].join(" ")}
        >
          {headline}
        </h1>
        <div className="[grid-area:actions] flex items-center justify-end gap-1.5 sm:min-w-0 sm:gap-2 md:gap-3">
          {loginHref && (
            <Link
              href={loginHref}
              className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Login
            </Link>
          )}
          <a
            href={KOICA_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block h-9 w-20 sm:h-12 sm:w-28 md:h-14 md:w-32 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2"
            aria-label="KOICA — visit koica.go.kr"
          >
            <Image
              src="/logo/KOICA.png"
              alt=""
              fill
              className="object-contain object-right"
              priority
              sizes="(max-width: 640px) 112px, 128px"
            />
          </a>
        </div>
      </div>
    </header>
  );
}

type BrandedBottomConsultantsProps = {
  /** on-map: bar over blurred map. default: over app page background. */
  variant?: "on-map" | "default";
};

export function BrandedBottomConsultants({ variant = "default" }: BrandedBottomConsultantsProps) {
  const barClassName =
    variant === "on-map" ? "border-slate-200/60" : "border-slate-200/80";

  return (
    <footer
      className={`relative z-10 mt-auto w-full max-w-[100vw] border-t ${barClassName} bg-white ${variant === "default" ? "shadow-sm" : ""}`}
    >
      <div className="w-full py-3 pl-2 pr-2 sm:py-4 sm:pl-4 sm:pr-4 md:pl-6 md:pr-6">
        <div className="relative h-12 w-full sm:h-16 md:h-[4.5rem]">
          <Image
            src="/logo/consultant-companies.png"
            alt="Consultant partner companies"
            fill
            className="object-contain object-left sm:object-center"
            sizes="100vw"
          />
        </div>
      </div>
    </footer>
  );
}
