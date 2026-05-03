"use client";

import { useEffect, useState } from "react";

/**
 * Multiplier for `transform: scale(...)` on fixed UI so it stays a stable on-screen size
 * regardless of:
 *  - mobile pinch-zoom (`visualViewport.scale`), and
 *  - desktop browser zoom (Ctrl + / − / mouse wheel).
 *
 * Effectively returns `1 / (pinchZoomScale * browserZoom)`.
 *
 * `visualViewport.scale` only reflects pinch-zoom; on Chromium / Firefox / Edge desktop,
 * Ctrl+± does not update it. We approximate desktop zoom from `window.outerWidth /
 * window.innerWidth`, which scales by the browser zoom factor (off by a tiny chrome-frame
 * delta but close enough for chrome-sized UI). DPR-based heuristics are unreliable on
 * HiDPI screens because `devicePixelRatio` already encodes the panel density.
 */
export function useFixedChromeInverseScale(): number {
  const [inverse, setInverse] = useState(1);

  useEffect(() => {
    const vv = window.visualViewport;

    const tick = () => {
      const rawPinch = vv && vv.scale > 0 && Number.isFinite(vv.scale) ? vv.scale : 1;
      const pinchScale = Math.min(8, Math.max(0.25, rawPinch));

      let browserZoom = 1;
      const outerW = window.outerWidth;
      const innerW = window.innerWidth;
      if (outerW > 0 && innerW > 0) {
        const ratio = outerW / innerW;
        if (Number.isFinite(ratio) && ratio > 0) {
          // Outer/inner can drift up to ~1.05 even at 100% zoom because of the browser
          // chrome frame; clamp so we don't shrink UI when the user hasn't actually zoomed.
          browserZoom = Math.min(8, Math.max(0.25, ratio));
        }
      }

      const totalScale = Math.min(8, Math.max(0.25, pinchScale * browserZoom));
      // Deadband around 100%: at native browser zoom the outer/inner ratio drifts a few
      // percent because of window-chrome / scrollbar widths. Treat anything within 3% of
      // 1.0 as "no zoom" so we don't shrink the chrome at 100%.
      const effectiveScale = Math.abs(totalScale - 1) < 0.03 ? 1 : totalScale;
      const next = 1 / effectiveScale;
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
