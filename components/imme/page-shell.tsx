import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Shared layout primitive for every IMME content page (i.e. anything other than the home page).
 * Renders:
 *   - An eyebrow / breadcrumb pair so visitors know where they are in the site tree.
 *   - A display-class page title + subtitle.
 *   - The page body (whatever the caller passes as `children`).
 *
 * Use `PageSection` inside `children` to keep vertical rhythm aligned across the site.
 */
export function PageShell({
  eyebrow,
  title,
  subtitle,
  breadcrumbs,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="relative bg-imme-concrete">
      <header className="relative overflow-hidden border-b border-imme-line bg-imme-surface">
        {/* Decorative spine — navy → amber vertical accent (Brief §3 primary / secondary). */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 hidden h-full w-1.5 bg-gradient-to-b from-imme-navy via-imme-amber/90 to-imme-green lg:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-px top-0 h-[320px] w-[min(55vw,420px)] rounded-bl-[40px] bg-gradient-to-bl from-imme-amber/[0.11] via-transparent to-transparent"
        />
        <div className="imme-container relative py-12 sm:py-16 lg:pl-6">
          {breadcrumbs?.length ? (
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-[12px] font-mono uppercase tracking-[0.14em] text-imme-muted">
                <li>
                  <Link href="/" className="transition hover:text-imme-navy hover:underline">
                    Home
                  </Link>
                </li>
                {breadcrumbs.map((crumb, idx) => (
                  <li key={`${crumb.label}-${idx}`} className="flex items-center gap-1.5">
                    <span aria-hidden className="text-imme-line">
                      /
                    </span>
                    {crumb.href ? (
                      <Link href={crumb.href} className="transition hover:text-imme-navy hover:underline">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-imme-ink">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
          <p className="imme-eyebrow">{eyebrow}</p>
          <h1 className="imme-h1 mt-3 max-w-4xl">{title}</h1>
          {subtitle ? (
            <p className="mt-5 max-w-3xl text-base leading-8 text-imme-muted sm:text-[17px] sm:leading-8">{subtitle}</p>
          ) : null}
          {intro ? <div className="mt-10 max-w-3xl">{intro}</div> : null}
        </div>
      </header>
      {children}
    </article>
  );
}

/**
 * Vertical rhythm wrapper — drops a content section with optional title/eyebrow that matches
 * the brief's typography & spacing rules (Brief §7: 24px gap between cards / 16px+ padding).
 */
export function PageSection({
  eyebrow,
  title,
  description,
  className = "",
  children,
  variant = "default",
  id,
}: {
  eyebrow?: string;
  title?: string;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
  variant?: "default" | "navy" | "concrete";
  id?: string;
}) {
  const surfaceClass =
    variant === "navy"
      ? "bg-imme-navy text-white"
      : variant === "concrete"
        ? "bg-imme-concrete"
        : "bg-white";

  return (
    <section id={id} className={[surfaceClass, "imme-section scroll-mt-24", className].filter(Boolean).join(" ")}>
      <div className="imme-container">
        {eyebrow ? (
          <p
            className={[
              "imme-eyebrow",
              variant === "navy" ? "text-imme-amber-300" : "",
            ].join(" ")}
          >
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2
            className={[
              "imme-h2 mt-2 max-w-3xl",
              variant === "navy" ? "text-white" : "",
            ].join(" ")}
          >
            {title}
          </h2>
        ) : null}
        {description ? (
          <div
            className={[
              "mt-4 max-w-3xl text-[15px] leading-7",
              variant === "navy" ? "text-white/75" : "text-imme-muted",
            ].join(" ")}
          >
            {description}
          </div>
        ) : null}
        <div className={title || eyebrow || description ? "mt-10" : ""}>{children}</div>
      </div>
    </section>
  );
}
