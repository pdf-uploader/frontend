"use client";

import { useEffect, useState } from "react";

/**
 * Multiplier for `transform: scale(...)` on fixed UI so it stays a stable on-screen size when
 * `visualViewport.scale` changes (mobile pinch-zoom). Effectively uses `1 / visualViewport.scale`.
 * Desktop Ctrl+/− zoom does not always update `scale`; rem-based sizing still locks chrome together.
 */
export function useFixedChromeInverseScale(): number {
  const [inverse, setInverse] = useState(1);

  useEffect(() => {
    const vv = window.visualViewport;

    const tick = () => {
      const raw = vv && vv.scale > 0 && Number.isFinite(vv.scale) ? vv.scale : 1;
      const scale = Math.min(8, Math.max(0.25, raw));
      const next = 1 / scale;
      setInverse((prev) => (Math.abs(prev - next) < 0.0005 ? prev : next));
    };

    tick();
    vv?.addEventListener("resize", tick);
    vv?.addEventListener("scroll", tick);
    window.addEventListener("resize", tick);
    return () => {
      vv?.removeEventListener("resize", tick);
      vv?.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
    };
  }, []);

  return inverse;
}
