import type { CSSProperties } from "react";

/**
 * Geometry for the document chat widget on the PDF book viewer only
 * (`DocumentChatWidget` with `layout="reader"` on `/files/[fileId]`).
 *
 * Adjust these values to resize the launcher button and open chat panel.
 * Fullscreen viewer passes `fullscreenCompact` to halve FAB/panel metrics.
 */
export const READER_CHAT_ROOM = {
  /** Floating launcher: square size (rem). */
  fabSizeRem: 4,
  /** Launcher inset from viewport bottom (rem). */
  fabBottomRem: 1.25,
  /** Launcher inset from viewport right (rem). */
  fabRightRem: 1.25,
  /** Vertical gap between launcher top and panel bottom (rem). */
  gapFabPanelRem: 0.25,
  /** Emoji / icon scale inside launcher (rem font-size). */
  fabIconFontRem: 1.75,

  /** Panel: preferred width before max-width clamp (rem). */
  panelWidthRem: 40,
  /** Panel: preferred height before max-height clamp (rem). */
  panelHeightRem: 40,
  /** Panel: CSS max-width expression (narrow screens). */
  panelMaxWidthCss: "calc(100vw - 2.5rem)",
  /** Panel: CSS max-height expression (short screens). */
  panelMaxHeightCss: "85dvh",
} as const;

/** Pixel sizes for message bubbles, input, and reference pills (reader vs compact reader). */
export type ReaderChatFontSizes = {
  messagePx: number;
  inputTextPx: number;
  referenceLinkPx: number;
};

/**
 * Chat transcript font sizes for book view (`layout="reader"`).
 * Values are in px for easy tweaking. Fullscreen viewer uses {@link getReaderChatFonts} with `fullscreenCompact` (~half).
 */
export const READER_CHAT_FONT: ReaderChatFontSizes = {
  messagePx: 20,
  /**
   * Bottom chat field only: size for typed text and the placeholder (px).
   * Increase this to enlarge input text without changing message bubbles.
   */
  inputTextPx: 18,
  referenceLinkPx: 11,
};

/** Same roles as {@link READER_CHAT_FONT} for folder / library chat (`layout="default"`). */
export const DEFAULT_CHAT_FONT = {
  messagePx: 13,
  /** Bottom chat input: typed text + placeholder (px). */
  inputTextPx: 14,
  referenceLinkPx: 11,
} as const;

/** Computes fixed positioning + size for reader-layout FAB and panel from {@link READER_CHAT_ROOM}. */
export function getReaderChatRoomStyles(options?: { fullscreenCompact?: boolean }): {
  fab: CSSProperties;
  panel: CSSProperties;
} {
  const compact = Boolean(options?.fullscreenCompact);
  const s = compact ? 0.5 : 1;
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

/** Reader transcript/input sizes; halves when {@link getReaderChatRoomStyles} uses `fullscreenCompact`. */
export function getReaderChatFonts(fullscreenCompact: boolean): ReaderChatFontSizes {
  if (!fullscreenCompact) {
    return READER_CHAT_FONT;
  }
  return {
    messagePx: Math.round(READER_CHAT_FONT.messagePx / 2),
    inputTextPx: Math.round(READER_CHAT_FONT.inputTextPx / 2),
    referenceLinkPx: Math.round(READER_CHAT_FONT.referenceLinkPx / 2),
  };
}

/** Metrics for PDF fullscreen zoom pill, tied to reader FAB `fabSizeRem` (fixed proportion). */
export function getReaderPdfZoomChromePack(fabSizeRem: number): {
  bar: CSSProperties;
  emojiBtn: CSSProperties;
  circleBtn: CSSProperties;
  pctBtn: CSSProperties;
} {
  const refFab = READER_CHAT_ROOM.fabSizeRem;
  const t = fabSizeRem / refFab;

  const gapRem = 0.375 * t;
  const padXRem = 0.375 * t;
  const padYRem = 0.25 * t;
  const btnRem = fabSizeRem * (28 / (refFab * 16)); // 28px circle when ref FAB = 4rem @ 16px/rem
  const labelFontRem = fabSizeRem * (11 / (refFab * 16));
  const glyphFontRem = fabSizeRem * (14 / (refFab * 16));

  return {
    bar: {
      gap: `${gapRem}rem`,
      padding: `${padYRem}rem ${padXRem}rem`,
    },
    emojiBtn: {
      paddingLeft: `${0.25 * t}rem`,
      paddingRight: `${0.25 * t}rem`,
      fontSize: `${labelFontRem}rem`,
    },
    circleBtn: {
      width: `${btnRem}rem`,
      height: `${btnRem}rem`,
      fontSize: `${glyphFontRem}rem`,
    },
    pctBtn: {
      minWidth: `${(2.375 * fabSizeRem) / refFab}rem`,
      padding: `${padYRem}rem ${0.625 * t}rem`,
      fontSize: `${labelFontRem}rem`,
    },
  };
}
