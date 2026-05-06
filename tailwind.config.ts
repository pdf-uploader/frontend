import type { Config } from "tailwindcss";

/**
 * IMME Project design tokens (see `website_design_brief.md`).
 *
 * - `imme.navy`     — deep infrastructure navy (primary). Used for headers, primary buttons, dark
 *                     section backgrounds, and headings.
 * - `imme.amber`    — Uganda earth/amber (secondary). Used for accents and the "Uganda-first" tone
 *                     visual cue (callouts, key numerals, strategy pillar 2).
 * - `imme.green`    — fresh asphalt green (accent). Used for "completed/on-track" status and the
 *                     localization pillar.
 * - `imme.concrete` — off-white background (`#F4F2EE`). Page background.
 * - `imme.surface`  — pure white card surface.
 * - `imme.ink`      — near-black body text.
 * - `imme.muted`    — mid-grey muted text.
 *
 * Type system: `font-display` (Montserrat) for headings, `font-sans` (Inter) for body, and
 * `font-mono` (JetBrains Mono) for milestone dates / budget figures / manual codes.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        "13": "repeat(13, minmax(0, 1fr))",
      },
      colors: {
        blue: {
          400: "#2589FE",
          500: "#0070F3",
          600: "#2F6FEB",
        },
        imme: {
          navy: "#1A2D4F",
          "navy-700": "#22406E",
          "navy-300": "#5C7AA9",
          amber: "#C8813A",
          "amber-300": "#E6A86A",
          green: "#2E7D52",
          "green-300": "#5BB082",
          concrete: "#F4F2EE",
          surface: "#FFFFFF",
          ink: "#1C1C1C",
          muted: "#6B6B6B",
          line: "#E2DED7",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-imme-sans)",
          "Inter",
          "Source Sans 3",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-imme-display)",
          "Montserrat",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-imme-mono)",
          "JetBrains Mono",
          "Roboto Mono",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      fontSize: {
        "data-xl": ["4.5rem", { lineHeight: "1", letterSpacing: "-0.02em" }],
        "data-lg": ["3.5rem", { lineHeight: "1", letterSpacing: "-0.015em" }],
        "data-md": ["2.25rem", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
      },
      boxShadow: {
        "imme-card": "0 1px 2px rgba(28, 28, 28, 0.04), 0 4px 16px rgba(28, 28, 28, 0.05)",
        "imme-soft": "0 8px 24px rgba(26, 45, 79, 0.08)",
      },
      borderRadius: {
        imme: "14px",
      },
    },
    keyframes: {
      shimmer: {
        "100%": {
          transform: "translateX(100%)",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
export default config;
