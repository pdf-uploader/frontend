"use client";

import { FolderBrowser } from "@/components/folder-browser";

/**
 * Staff document library: folder list, global file search, uploads (when permitted).
 * Routed under `/search` so it inherits `MainShell` staff chrome (`Navbar` + `ui-shell`).
 */
export default function SearchPage() {
  return <FolderBrowser />;
}
