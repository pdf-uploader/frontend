import type { CSSProperties } from "react";

/**
 * Geometry for the document chat widget on the PDF book viewer only
 * (`DocumentChatWidget` with `layout="reader"` on `/files/[fileId]`).
 *
 * Adjust these values to resize the launcher button and open chat panel.
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

/**
 * Chat transcript font sizes for book view (`layout="reader"`).
 * Values are in px for easy tweaking.
 */
export const READER_CHAT_FONT = {
  messagePx: 20,
  /**
   * Bottom chat field only: size for typed text and the placeholder (px).
   * Increase this to enlarge input text without changing message bubbles.
   */
  inputTextPx: 18,
  referenceLinkPx: 11,
} as const;

/** Same roles as {@link READER_CHAT_FONT} for folder / library chat (`layout="default"`). */
export const DEFAULT_CHAT_FONT = {
  messagePx: 13,
  /** Bottom chat input: typed text + placeholder (px). */
  inputTextPx: 14,
  referenceLinkPx: 11,
} as const;

/** Computes fixed positioning + size for reader-layout FAB and panel from {@link READER_CHAT_ROOM}. */
export function getReaderChatRoomStyles(): { fab: CSSProperties; panel: CSSProperties } {
  const r = READER_CHAT_ROOM;
  const panelBottomRem = r.fabBottomRem + r.fabSizeRem + r.gapFabPanelRem;

  return {
    fab: {
      width: `${r.fabSizeRem}rem`,
      height: `${r.fabSizeRem}rem`,
      bottom: `${r.fabBottomRem}rem`,
      right: `${r.fabRightRem}rem`,
    },
    panel: {
      width: `min(${r.panelWidthRem}rem, ${r.panelMaxWidthCss})`,
      height: `min(${r.panelHeightRem}rem, ${r.panelMaxHeightCss})`,
      bottom: `${panelBottomRem}rem`,
      right: `${r.fabRightRem}rem`,
    },
  };
}
