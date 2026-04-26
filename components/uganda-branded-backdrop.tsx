import Image from "next/image";

type UgandaBrandedBackdropProps = {
  /**
   * `content` = fill the parent (use between top/bottom bars so the whole map is visible
   * in the gap). `fixed` = legacy full-viewport underlay (can crop visually behind chrome).
   */
  variant?: "content" | "fixed";
};

/**
 * Branded background image. Prefer `content` inside a `relative min-h-0 flex-1` row so
 * object-contain keeps the full graphic visible between header and footer.
 */
export function UgandaBrandedBackdrop({ variant = "content" }: UgandaBrandedBackdropProps) {
  const rootClass =
    variant === "fixed"
      ? "pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#e4ebf0]"
      : "pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#e4ebf0]";

  return (
    <div className={rootClass} aria-hidden>
      <div className="absolute inset-0">
        <Image
          src="/logo/uganda-map.png"
          alt=""
          fill
          priority
          className="object-contain object-center"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-slate-50/10" />
    </div>
  );
}
