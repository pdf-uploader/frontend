import type { Content, Element, Root } from "hast";

/* Do not use "code" here: block <code> is replaced by ChatCodeBlock and would drop the span. Fenced blocks use "pre". */
const CURSOR_HOST = new Set([
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "th",
  "td",
  "li",
  "pre",
]);

const cursorSpan: Element = {
  type: "element",
  tagName: "span",
  properties: { class: "chat-stream-cursor", "aria-hidden": "true" },
  children: [],
};

/**
 * Appends an inline blinking bar at the end of the last (depth-first) block that
 * can hold the streaming cursor. Stays on the same line as the last characters
 * (unlike a block ::after, which can wrap to the next line when the line is full).
 */
export function rehypeAppendStreamCursor() {
  return (tree: Root) => {
    const matches: Element[] = [];

    const visit = (node: Content) => {
      if (node.type !== "element") {
        return;
      }
      if (CURSOR_HOST.has(node.tagName)) {
        matches.push(node);
      }
      for (const c of node.children) {
        visit(c);
      }
    };

    for (const c of tree.children) {
      visit(c);
    }

    const last = matches[matches.length - 1];
    if (!last) {
      return;
    }
    last.children = [...last.children, { ...cursorSpan }];
  };
}
