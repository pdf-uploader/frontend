import type { CSSProperties } from "react";

/**
 * Geometry for the document chat widget on the PDF book viewer only
 * (`DocumentChatWidget` with `layout="reader"` on `/files/[fileId]`).
 *
 * Base values below are the **fullscreen** size. Normal (non-fullscreen) reader rendering
 * halves them via the `fullscreen` flag in {@link getReaderChatRoomStyles} and
 * {@link getReaderChatFonts}. Adjust these values to resize the launcher and open panel.
 *
 * NOTE: FAB / panel size values are intentionally doubled vs. their original tuning so the
 * chat surface reads as ~2× larger across both reader and default layouts. The magnifier
 * pill (see {@link MAGNIFIER_REF_FAB_REM}) is locked to a separate reference so doubling
 * here also doubles the magnifier proportionally.
 */
export const READER_CHAT_ROOM = {
  /** Floating launcher: square size (rem). */
  fabSizeRem: 8,
  /** Launcher inset from viewport bottom (rem). */
  fabBottomRem: 1.25,
  /** Launcher inset from viewport right (rem). */
  fabRightRem: 1.25,
  /** Vertical gap between launcher top and panel bottom (rem). */
  gapFabPanelRem: 0.25,
  /** Emoji / icon scale inside launcher (rem font-size). */
  fabIconFontRem: 3.5,

  /** Panel: preferred width before max-width clamp (rem). */
  panelWidthRem: 52,
  /** Panel: preferred height before max-height clamp (rem). */
  panelHeightRem: 68,
  /** Panel: CSS max-width expression (narrow screens). */
  panelMaxWidthCss: "calc(100vw - 2.5rem)",
  /** Panel: CSS max-height expression (short screens). */
  panelMaxHeightCss: "85dvh",
} as const;

/**
 * Reference FAB size used by {@link getReaderPdfZoomChromePack} to compute magnifier metrics.
 * Held at the *pre-doubling* value so that scaling {@link READER_CHAT_ROOM.fabSizeRem} (e.g.
 * to 2×) also scales the magnifier pill by the same factor, instead of cancelling out via
 * the ratio `fabSizeRem / refFab`.
 */
const MAGNIFIER_REF_FAB_REM = 4;

/** Pixel sizes for message bubbles, input, and reference pills (reader vs compact reader). */
export type ReaderChatFontSizes = {
  messagePx: number;
  inputTextPx: number;
  referenceLinkPx: number;
};

/**
 * Chat transcript font sizes for book view (`layout="reader"`).
 * Values are in px and represent the **fullscreen** size; non-fullscreen reader mode
 * halves them via {@link getReaderChatFonts}.
 *
 * NOTE: doubled vs. original tuning so reader chat text scales with the 2× FAB / panel.
 */
export const READER_CHAT_FONT: ReaderChatFontSizes = {
  messagePx: 40,
  /**
   * Bottom chat field only: size for typed text and the placeholder (px).
   * Increase this to enlarge input text without changing message bubbles.
   */
  inputTextPx: 36,
  referenceLinkPx: 22,
};

/**
 * Same roles as {@link READER_CHAT_FONT} for folder / library chat (`layout="default"`).
 *
 * NOTE: doubled vs. original tuning so default-layout chat text scales with the 2× FAB / panel.
 */
export const DEFAULT_CHAT_FONT = {
  messagePx: 26,
  /** Bottom chat input: typed text + placeholder (px). */
  inputTextPx: 28,
  referenceLinkPx: 22,
} as const;

/** Computes fixed positioning + size for reader-layout FAB and panel from {@link READER_CHAT_ROOM}. */
export function getReaderChatRoomStyles(options?: { fullscreen?: boolean }): {
  fab: CSSProperties;
  panel: CSSProperties;
} {
  const fullscreen = Boolean(options?.fullscreen);
  // Fullscreen renders at full base size; non-fullscreen reader halves everything.
  const s = fullscreen ? 1 : 0.5;
  const r = READER_CHAT_ROOM;
  const panelBottomRem = s * (r.fabBottomRem + r.fabSizeRem + r.gapFabPanelRem);

  return {
    fab: {
      width: `${r.fabSizeRem * s}rem`,
      height: `${r.fabSizeRem * s}rem`,
      bottom: `${r.fabBottomRem * s}rem`,
      right: `${r.fabRightRem * s}rem`,
    },
    panel: {
      width: `min(${r.panelWidthRem * s}rem, ${r.panelMaxWidthCss})`,
      height: `min(${r.panelHeightRem * s}rem, ${r.panelMaxHeightCss})`,
      bottom: `${panelBottomRem}rem`,
      right: `${r.fabRightRem * s}rem`,
    },
  };
}

/** Reader transcript/input sizes; halves in normal (non-fullscreen) reader mode. */
export function getReaderChatFonts(fullscreen: boolean): ReaderChatFontSizes {
  if (fullscreen) {
    return READER_CHAT_FONT;
  }
  return {
    messagePx: Math.round(READER_CHAT_FONT.messagePx / 2),
    inputTextPx: Math.round(READER_CHAT_FONT.inputTextPx / 2),
    referenceLinkPx: Math.round(READER_CHAT_FONT.referenceLinkPx / 2),
  };
}

/**
 * Metrics for PDF fullscreen zoom pill, tied to a *fixed* reference FAB rem so that
 * scaling {@link READER_CHAT_ROOM.fabSizeRem} (chat) cleanly scales the magnifier too.
 * Caller still passes the desired effective FAB rem (typically `READER_CHAT_ROOM.fabSizeRem * 0.75`).
 */
export function getReaderPdfZoomChromePack(fabSizeRem: number): {
  bar: CSSProperties;
  emojiBtn: CSSProperties;
  circleBtn: CSSProperties;
  pctBtn: CSSProperties;
} {
  const refFab = MAGNIFIER_REF_FAB_REM;
  const t = fabSizeRem / refFab;

  const gapRem = 0.4375 * t;
  const padXRem = 0.5 * t;
  const padYRem = 0.3125 * t;
  const btnRem = fabSizeRem * (32 / (refFab * 16)); // 32px circle when ref FAB = 4rem @ 16px/rem
  const labelFontRem = fabSizeRem * (12 / (refFab * 16));
  const glyphFontRem = fabSizeRem * (16 / (refFab * 16));

  return {
    bar: {
      gap: `${gapRem}rem`,
      padding: `${padYRem}rem ${padXRem}rem`,
    },
    emojiBtn: {
      paddingLeft: `${0.3125 * t}rem`,
      paddingRight: `${0.3125 * t}rem`,
      fontSize: `${labelFontRem}rem`,
    },
    circleBtn: {
      width: `${btnRem}rem`,
      height: `${btnRem}rem`,
      fontSize: `${glyphFontRem}rem`,
    },
    pctBtn: {
      minWidth: `${(2.75 * fabSizeRem) / refFab}rem`,
      padding: `${padYRem}rem ${0.75 * t}rem`,
      fontSize: `${labelFontRem}rem`,
    },
  };
}
