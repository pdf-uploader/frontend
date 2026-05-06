import type { SVGProps } from "react";

/**
 * Hand-rolled icon set inspired by Phosphor / Lucide line styles. Inline SVG keeps the public
 * site free of an icon-package dependency and lets us match the brief's exact stroke / fill rules.
 *
 * Every icon accepts standard `SVGProps<SVGSVGElement>` so callers can size with Tailwind
 * (`className="h-6 w-6"`) and override stroke color via `currentColor`.
 */

interface IconProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

function withDefaults({ className, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: 24,
    height: 24,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...rest,
    className,
  };
}

export function BookStackIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M4 5a2 2 0 0 1 2-2h11v15H6a2 2 0 0 0-2 2V5Z" />
      <path d="M17 3v15" />
      <path d="M4 20a2 2 0 0 0 2 2h13" />
    </svg>
  );
}

export function BridgeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M3 11c4 0 6-5 9-5s5 5 9 5" />
      <path d="M3 11v6" />
      <path d="M21 11v6" />
      <path d="M3 17h18" />
      <path d="M9 17v-3" />
      <path d="M15 17v-3" />
    </svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
      <path d="M15 19c0-2.4 1.6-4 4-4" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-2 5-5 2 2-5 5-2Z" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function MagnifierIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M19 11c0 5.5-7 11-7 11s-7-5.5-7-11a7 7 0 0 1 14 0Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5L16 10" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function CircleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** Dropdown caret — navigation mega-menus (Brief §6 primary navigation). */
export function ChevronDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function CapIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M2 9 12 5l10 4-10 4Z" />
      <path d="M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4" />
      <path d="M22 9v5" />
    </svg>
  );
}

export function ToolboxIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

export function FlagPairIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M5 21V4" />
      <path d="M5 4h7l-1.5 3L12 10H5" />
      <path d="M19 21V4" />
      <path d="M19 4h-7l1.5 3L12 10h7" />
    </svg>
  );
}

export function SearchSparkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <circle cx="10" cy="10" r="5" />
      <path d="m20 20-4-4" />
      <path d="M18 4v3" />
      <path d="M16.5 5.5h3" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...withDefaults(props)}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
