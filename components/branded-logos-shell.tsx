import Image from "next/image";
import Link from "next/link";
import { KOICA_WEBSITE_URL, MOWT_WEBSITE_URL } from "@/lib/branding-links";

export const BRANDED_SYSTEM_HEADLINE = "Uganda Expressway Integrated Manual";

const BRANDED_HEADLINE_TYPOGRAPHY =
  "min-w-0 max-w-full whitespace-pre-wrap px-1 text-center text-balance font-extrabold leading-tight text-blue-950 sm:px-2 sm:leading-[1.12] sm:tracking-wide md:px-3 md:leading-tight md:tracking-tighter lg:px-4 [font-size:clamp(1rem,3.5vw+0.35rem,2rem)] sm:[font-size:clamp(1.15rem,1.5vw+0.72rem,2.15rem)] md:[font-size:clamp(1.32rem,1.2vw+0.95rem,2.55rem)] lg:[font-size:clamp(1.5rem,1vw+1.15rem,2.95rem)] xl:[font-size:clamp(1.65rem,0.9vw+1.35rem,3.15rem)]";

const BRANDED_HEADLINE_NAVBAR_TYPOGRAPHY =
  "min-w-0 max-w-full whitespace-pre-wrap text-center text-balance font-extrabold leading-[1.08] text-blue-950 sm:leading-[1.12] [font-size:clamp(0.82rem,1.65vw+0.48rem,1.22rem)] min-[400px]:[font-size:clamp(0.88rem,1.45vw+0.54rem,1.34rem)] sm:[font-size:clamp(0.95rem,1.25vw+0.62rem,1.55rem)] md:[font-size:clamp(1.08rem,1.05vw+0.72rem,1.82rem)] lg:[font-size:clamp(1.2rem,0.92vw+0.72rem,2.08rem)] xl:[font-size:clamp(1.28rem,0.78vw+0.82rem,2.35rem)]";

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
  /** When set, a Login control is shown in the actions column. */
  loginHref?: string;
  /** ChatGPT-style pair: solid Login + outlined Sign up (takes precedence over `loginHref`). */
  authLinks?: { loginHref: string; signupHref: string };
  /** Emphasize the active route when both auth links are shown. */
  authHighlight?: "login" | "signup";
  /** Swap or supplement login with another auth link (e.g. legacy single link). Ignored when `authLinks` is set. */
  alternateAuth?: { href: string; label: string };
  /** Centered title in the top bar. */
  headline?: string;
  /** Dark translucent bar for auth pages over map backgrounds. */
  tone?: "default" | "dark";
};

export function BrandedTopLogos({
  loginHref,
  authLinks,
  authHighlight,
  alternateAuth,
  headline = BRANDED_SYSTEM_HEADLINE,
  tone = "default",
}: BrandedTopLogosProps) {
  const headerSurface =
    tone === "dark"
      ? "border-b border-white/10 bg-slate-950/50 backdrop-blur-xl"
      : "border-b border-slate-200/60 bg-white";

  const headlineToneClass =
    tone === "dark"
      ? BRANDED_HEADLINE_TYPOGRAPHY.replace("text-blue-950", "text-white/95 drop-shadow-[0_1px_10px_rgba(0,0,0,0.35)]")
      : BRANDED_HEADLINE_TYPOGRAPHY;

  const authLinkClass =
    tone === "dark"
      ? "inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/10 sm:px-5 sm:py-2.5 sm:text-sm"
      : "inline-flex items-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 sm:px-5 sm:py-2.5 sm:text-sm";

  const authPairBase =
    "inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition sm:px-4 sm:py-2 sm:text-xs md:text-sm";

  const loginPairLight = [
    authPairBase,
    "border border-transparent bg-slate-900 text-white shadow-sm hover:bg-slate-800",
    authHighlight === "login" ? "ring-2 ring-sky-500/55 ring-offset-2 ring-offset-white" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const signupPairLight = [
    authPairBase,
    "border-2 border-slate-900 bg-transparent text-slate-900 hover:bg-slate-50",
    authHighlight === "signup" ? "ring-2 ring-sky-500/45 ring-offset-2 ring-offset-white" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const loginPairDark = [
    authPairBase,
    "border border-[rgba(255,255,255,0.14)] bg-[rgba(47,47,47,0.85)] text-white hover:bg-[rgba(55,55,55,0.92)]",
    authHighlight === "login" ? "ring-2 ring-sky-400/45 ring-offset-2 ring-offset-slate-950" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const signupPairDark = [
    authPairBase,
    "border border-white bg-transparent text-white hover:bg-white/[0.08]",
    authHighlight === "signup" ? "ring-2 ring-white/35 ring-offset-2 ring-offset-slate-950" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={`relative z-20 w-full max-w-[100vw] shrink-0 ${headerSurface}`}>
      <div
        className="grid w-full items-center gap-x-2 gap-y-2 py-2.5 pl-2 pr-2 [grid-template-areas:'mowt_actions''title_title'] [grid-template-columns:1fr_auto] sm:gap-x-1.5 sm:gap-y-0 sm:py-3 sm:[grid-template-areas:'mowt_title_actions'] sm:grid-cols-[minmax(0,0.95fr)_minmax(0,2.6fr)_minmax(0,0.95fr)] sm:pl-1.5 sm:pr-1.5 md:gap-x-2 md:py-3.5 md:pl-2 md:pr-2 lg:py-4"
      >
        <a
          href={MOWT_WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="relative ml-8 block justify-self-end [grid-area:mowt] h-16 w-[11rem] min-w-0 sm:ml-11 sm:h-[5rem] sm:w-[14rem] md:ml-16 md:h-[5.75rem] md:w-[17.5rem] lg:ml-20 lg:h-[6rem] lg:w-[19rem] outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2"
          aria-label="Ministry of Works and Transport — visit works.go.ug"
        >
          <Image
            src="/logo/MOWT.png"
            alt=""
            fill
            className="object-contain object-left"
            priority
            sizes="(max-width: 640px) 260px, (max-width: 900px) 300px, 340px"
          />
        </a>
        <h1 className={["[grid-area:title] col-span-2 sm:col-span-1", headlineToneClass].join(" ")}>
          {headline}
        </h1>
        <div className="[grid-area:actions] flex max-w-[min(100%,22rem)] flex-wrap items-center justify-end gap-1.5 sm:min-w-0 sm:max-w-none sm:gap-2 md:gap-2.5">
          {authLinks && (
            <>
              <Link href={authLinks.loginHref} className={tone === "dark" ? loginPairDark : loginPairLight}>
                Log in
              </Link>
              <Link href={authLinks.signupHref} className={tone === "dark" ? signupPairDark : signupPairLight}>
                Sign up
              </Link>
            </>
          )}
          {!authLinks && alternateAuth && (
            <Link href={alternateAuth.href} className={authLinkClass}>
              {alternateAuth.label}
            </Link>
          )}
          {!authLinks && loginHref && !alternateAuth && (
            <Link href={loginHref} className={authLinkClass}>
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

type BrandedBottomConsultantsProps = {
  /** on-map: bar over blurred map. default: over app page background. */
  variant?: "on-map" | "default";
  tone?: "default" | "dark";
};

export function BrandedBottomConsultants({
  variant = "default",
  tone = "default",
}: BrandedBottomConsultantsProps) {
  const barClassName =
    tone === "dark"
      ? "border-white/10 bg-slate-950/55 backdrop-blur-md"
      : variant === "on-map"
        ? "border-slate-200/60 bg-white"
        : "border-slate-200/80 bg-white";

  return (
    <footer
      className={`relative z-10 mt-auto w-full max-w-[100vw] border-t ${barClassName} ${variant === "default" && tone !== "dark" ? "shadow-sm" : ""}`}
    >
      <div className="w-full px-2 py-3 sm:px-4 sm:py-4 md:px-6">
        <div className="flex w-full justify-center overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <div className="flex flex-nowrap items-center justify-center gap-1.5 px-1 py-0.5 sm:gap-2 md:gap-2.5">
            <div className="relative h-11 w-[min(72vw,34rem)] shrink-0 sm:h-[4rem] sm:w-[min(68vw,38rem)] md:h-[4.25rem] md:w-[min(62vw,44rem)] lg:h-[4.5rem] lg:w-[min(58vw,52rem)]">
              <Image
                src="/logo/consultant-companies.png"
                alt="Consultant partner companies"
                fill
                className="object-contain object-center"
                sizes="(max-width:768px) 75vw, 840px"
              />
            </div>
            <a
              href={KOICA_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-9 w-[6.5rem] shrink-0 sm:h-11 sm:w-32 md:h-12 md:w-36 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 focus-visible:ring-offset-2"
              aria-label="KOICA — visit koica.go.kr"
            >
              <Image
                src="/logo/KOICA.png"
                alt=""
                fill
                className="object-contain object-center"
                sizes="160px"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
