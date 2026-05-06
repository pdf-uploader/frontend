"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IMME_NAV, IMME_PROJECT } from "@/lib/imme/project";
import { ProjectStatusBadge } from "@/components/imme/project-status-badge";
import { ChevronDownIcon, CloseIcon, MenuIcon } from "@/components/imme/imme-icons";
import { useAuth } from "@/lib/hooks/use-auth";
import { hasAuthSession } from "@/lib/auth-session";
import { isAdminUser } from "@/lib/auth-user";

/**
 * Sticky public header for the IMME site (Brief §6).
 *
 * Redesign notes aligned with the project brief:
 * - Dense navy bar + translucent blur becomes cleaner ivory-white chrome with amber baseline accent when scrolled.
 * - Desktop: structured mega-dropdown panels per primary branch (About / Manuals / BMS) instead of flat-only links.
 * - Korea–Uganda flag pair + live roadmap pill stay anchored right (Brief §6 progress cue).
 */
export function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={[
        "sticky top-0 z-40 w-full transition-[box-shadow,background-color,border-color] duration-300",
        scrolled
          ? "border-b border-imme-line bg-white/92 shadow-imme-card backdrop-blur-xl"
          : "border-b border-transparent bg-white/85 backdrop-blur-md",
      ].join(" ")}
    >
      {/* Amber baseline — subtle “Uganda earth” anchor across the full viewport width (Brief §3 secondary). */}
      <div
        aria-hidden
        className={[
          "h-[3px] w-full bg-gradient-to-r from-imme-navy via-imme-amber to-imme-green transition-opacity duration-300",
          scrolled ? "opacity-100" : "opacity-70",
        ].join(" ")}
      />

      <div className="imme-container-wide flex min-h-[60px] items-center gap-3 py-2 sm:min-h-[68px]">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-xl pr-2 outline-none ring-imme-amber transition hover:bg-imme-concrete/80 focus-visible:ring-2 focus-visible:ring-offset-2"
          aria-label={`${IMME_PROJECT.shortName} — Home`}
        >
          <ProjectBadge />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[15px] font-bold tracking-tight text-imme-navy sm:text-base">
              IMME Project
            </span>
            <span className="hidden text-[10px] font-mono font-semibold uppercase tracking-[0.2em] text-imme-muted sm:inline">
              Uganda Expressways
            </span>
          </div>
        </Link>

        <nav aria-label="Primary" className="ml-1 hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {IMME_NAV.map((item) => (
            <DesktopNavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          <StaffAuthCluster className="hidden sm:flex" />
          <ProjectStatusBadge className="hidden md:inline-flex" />
          <FlagPair className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="imme-mobile-nav"
            className="inline-flex items-center justify-center rounded-xl border border-imme-line bg-white p-2.5 text-imme-navy shadow-sm transition hover:border-imme-navy/25 hover:bg-imme-concrete lg:hidden"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Site navigation" id="imme-mobile-nav">
          <button
            type="button"
            className="absolute inset-0 bg-imme-navy/35 backdrop-blur-[3px]"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[min(100%,380px)] flex-col bg-white shadow-2xl ring-1 ring-imme-navy/10">
            <div className="flex items-center justify-between border-b border-imme-line px-4 py-3">
              <p className="font-display text-sm font-bold text-imme-navy">Menu</p>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg border border-imme-line p-2 text-imme-muted transition hover:bg-imme-concrete"
                aria-label="Close menu"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
              <div className="flex flex-col gap-1">
                {IMME_NAV.map((item) => (
                  <MobileNavBlock key={item.href} item={item} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-imme-line pt-4">
                <StaffAuthCluster className="flex w-full flex-col gap-2 sm:flex-row" onNavigate={() => setMobileOpen(false)} />
                <ProjectStatusBadge />
                <FlagPair />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

type NavItem = (typeof IMME_NAV)[number];

/**
 * Entry points to the staff workspace (PDF library, admin). Marketing pages intentionally omit
 * these from `IMME_NAV` — they live here so visitors can sign in while the public site stays
 * brochure-first.
 */
function StaffAuthCluster({
  className = "",
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const auth = useAuth();
  const pathname = usePathname() ?? "/";
  const loggedIn = hasAuthSession(auth);
  const libraryActive =
    pathname === "/search" || pathname.startsWith("/folders/") || pathname.startsWith("/files/");

  if (loggedIn) {
    return (
      <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
        <Link
          href="/search"
          onClick={onNavigate}
          className={[
            "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition sm:min-h-[36px] sm:px-4 sm:text-[13px]",
            libraryActive
              ? "bg-imme-navy text-white shadow-sm"
              : "border border-imme-navy bg-white text-imme-navy hover:bg-imme-navy hover:text-white",
          ].join(" ")}
        >
          Document library
        </Link>
        {isAdminUser(auth.user) ? (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="inline-flex items-center justify-center rounded-full border border-imme-line bg-white px-3 py-1.5 text-xs font-semibold text-imme-ink transition hover:bg-imme-concrete sm:px-4 sm:text-[13px]"
          >
            Admin
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
      <Link
        href="/login"
        onClick={onNavigate}
        className="inline-flex items-center justify-center rounded-full bg-imme-navy px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-imme-navy-700 sm:min-h-[36px] sm:px-4 sm:text-[13px]"
      >
        Log in
      </Link>
      <Link
        href="/signup"
        onClick={onNavigate}
        className="inline-flex items-center justify-center rounded-full border border-imme-line bg-white px-3 py-1.5 text-xs font-semibold text-imme-navy transition hover:bg-imme-concrete sm:px-4 sm:text-[13px]"
      >
        Sign up
      </Link>
    </div>
  );
}

function DesktopNavItem({ item, pathname }: { item: NavItem; pathname: string }) {
  const branchActive =
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (!item.children?.length) {
    return (
      <Link
        href={item.href}
        className={[
          "rounded-full px-3 py-2 text-[13px] font-semibold transition",
          branchActive ? "bg-imme-navy text-white shadow-sm" : "text-imme-ink hover:bg-imme-concrete",
        ].join(" ")}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <Link
        href={item.href}
        className={[
          "flex items-center gap-1 rounded-full px-3 py-2 text-[13px] font-semibold transition outline-none ring-imme-amber focus-visible:ring-2 focus-visible:ring-offset-2",
          branchActive ? "bg-imme-navy text-white shadow-sm" : "text-imme-ink hover:bg-imme-concrete",
        ].join(" ")}
      >
        {item.label}
        <ChevronDownIcon className="h-4 w-4 opacity-70 group-hover:opacity-100" strokeWidth={1.8} />
      </Link>

      <div
        className={[
          "invisible absolute left-1/2 top-[calc(100%+10px)] z-50 w-[min(100vw-2rem,320px)] -translate-x-1/2 opacity-0 transition-all duration-200",
          "pointer-events-none group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100",
          "group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100",
        ].join(" ")}
      >
        <div className="rounded-imme border border-imme-line bg-white p-2 shadow-imme-soft ring-1 ring-imme-navy/[0.04]">
          <p className="border-b border-imme-line px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-imme-muted">
            In this section
          </p>
          <ul className="py-1">
            <li>
              <Link
                href={item.href}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-semibold text-imme-navy hover:bg-imme-concrete"
              >
                Overview
                <span className="font-mono text-[10px] text-imme-muted">→</span>
              </Link>
            </li>
            {item.children.map((child) => {
              const childActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
              return (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className={[
                      "block rounded-lg px-3 py-2 text-[13px] transition",
                      childActive ? "bg-imme-amber/15 font-semibold text-imme-navy" : "text-imme-ink hover:bg-imme-concrete",
                    ].join(" ")}
                  >
                    {child.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MobileNavBlock({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const branchActive =
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (!item.children?.length) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={[
          "rounded-xl px-3 py-3 text-sm font-semibold transition",
          branchActive ? "bg-imme-navy text-white" : "text-imme-ink hover:bg-imme-concrete",
        ].join(" ")}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <details className="group rounded-xl border border-imme-line bg-imme-concrete/40 open:bg-white open:shadow-imme-card" open={branchActive}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-3 text-sm font-semibold text-imme-navy marker:hidden [&::-webkit-details-marker]:hidden">
        <span>{item.label}</span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 transition group-open:rotate-180" strokeWidth={1.8} />
      </summary>
      <div className="border-t border-imme-line px-2 pb-2 pt-1">
        <Link
          href={item.href}
          onClick={onNavigate}
          className="block rounded-lg px-3 py-2 text-[13px] font-semibold text-imme-navy hover:bg-imme-concrete"
        >
          Section overview
        </Link>
        {item.children.map((child) => {
          const childActive = pathname === child.href;
          return (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className={[
                "block rounded-lg px-3 py-2 text-[13px]",
                childActive ? "bg-imme-navy text-white" : "text-imme-ink hover:bg-imme-concrete",
              ].join(" ")}
            >
              {child.label}
            </Link>
          );
        })}
      </div>
    </details>
  );
}

/** Korea–Uganda flag pair rendered as an inline SVG cluster. */
function FlagPair({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="Korea–Uganda partnership"
      className={[
        "inline-flex items-center gap-2 rounded-full border border-imme-line bg-white px-2.5 py-1 shadow-sm",
        className,
      ].join(" ")}
    >
      <KoreaFlag className="h-4 w-6 rounded-[2px] shadow-sm ring-1 ring-black/5" />
      <span aria-hidden className="text-imme-muted">
        ·
      </span>
      <UgandaFlag className="h-4 w-6 rounded-[2px] shadow-sm ring-1 ring-black/5" />
    </span>
  );
}

function KoreaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} role="img" aria-label="Republic of Korea flag">
      <rect width="24" height="16" fill="#fff" />
      <g transform="translate(12 8)">
        <path d="M-3.2 0a3.2 3.2 0 1 1 6.4 0 1.6 1.6 0 1 1-3.2 0 1.6 1.6 0 1 0-3.2 0Z" fill="#cd2e3a" />
        <path d="M3.2 0a3.2 3.2 0 1 1-6.4 0 1.6 1.6 0 1 1 3.2 0 1.6 1.6 0 1 0 3.2 0Z" fill="#0047a0" />
      </g>
    </svg>
  );
}

function UgandaFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} role="img" aria-label="Republic of Uganda flag">
      <rect width="24" height="2.67" y="0" fill="#000" />
      <rect width="24" height="2.67" y="2.67" fill="#fcdc04" />
      <rect width="24" height="2.67" y="5.33" fill="#d90000" />
      <rect width="24" height="2.67" y="8" fill="#000" />
      <rect width="24" height="2.67" y="10.67" fill="#fcdc04" />
      <rect width="24" height="2.66" y="13.33" fill="#d90000" />
      <circle cx="12" cy="8" r="2.7" fill="#fff" />
    </svg>
  );
}

/** Project badge: bridge cross-section silhouette combined with a manual icon (Brief §3). */
function ProjectBadge({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={[
        "relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-imme-navy to-imme-navy-700 text-white shadow-imme-card ring-2 ring-white sm:h-11 sm:w-11",
        className,
      ].join(" ")}
    >
      <svg
        viewBox="0 0 32 32"
        className="h-6 w-6 sm:h-7 sm:w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 18c4 0 6-7 11-7s7 7 11 7" />
        <path d="M5 18v6" />
        <path d="M27 18v6" />
        <path d="M5 24h22" />
        <path d="M11 24v-3" />
        <path d="M21 24v-3" />
        <rect x="9" y="6" width="14" height="3" rx="0.6" stroke="#E6A86A" />
      </svg>
    </span>
  );
}
