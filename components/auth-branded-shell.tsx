import { ReactNode } from "react";
import Link from "next/link";
import { BrandedBottomConsultants, BrandedTopLogos } from "@/components/branded-logos-shell";
import { UgandaBrandedBackdrop } from "@/components/uganda-branded-backdrop";

type AuthBrandedShellProps = {
  children: ReactNode;
  /** Which auth screen is active — highlights that pill in the header. */
  authHighlight?: "login" | "signup";
};

/**
 * Same chrome as the public landing page (white header, Uganda map, consultant footer)
 * so opening Log in / Sign up does not switch to a separate dark theme. Auth UI stays in the centered modal only.
 */
export function AuthBrandedShell({ children, authHighlight = "login" }: AuthBrandedShellProps) {
  return (
    <section className="flex min-h-[100dvh] w-full flex-col">
      <BrandedTopLogos
        authLinks={{ loginHref: "/login", signupHref: "/signup" }}
        authHighlight={authHighlight}
      />
      <div className="relative flex min-h-0 w-full flex-1 flex-col">
        <UgandaBrandedBackdrop variant="content" />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-slate-50/88 via-white/72 to-slate-100/82"
          aria-hidden
        />
        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col">{children}</div>
      </div>
      <BrandedBottomConsultants variant="on-map" />
    </section>
  );
}

export function AuthPageFooterLinks() {
  return (
    <nav
      className="relative z-10 mx-auto mt-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 pb-6 pt-4 text-[13px] text-slate-600"
      aria-label="Utility links"
    >
      <Link href="/" className="transition hover:text-slate-900">
        Home
      </Link>
      <span className="hidden text-slate-300 sm:inline" aria-hidden>
        ·
      </span>
      <a
        href="https://www.mowt.go.ug/"
        className="transition hover:text-slate-900"
        target="_blank"
        rel="noopener noreferrer"
      >
        Ministry of Works and Transport
      </a>
    </nav>
  );
}
