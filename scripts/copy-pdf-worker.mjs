/**
 * Copies PDF.js worker from pdfjs-dist into /public so the worker runs same-origin as the app.
 * Cross-origin workers (e.g. unpkg) often fetch the PDF URL without credentialed cookies, so HttpOnly
 * auth cookies never reach `/api/files/.../pdf-stream`.
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pdfPkgDir = dirname(require.resolve("pdfjs-dist/package.json"));
const src = join(pdfPkgDir, "build", "pdf.worker.min.mjs");
const destDir = join(__dirname, "..", "public");
const dest = join(destDir, "pdf.worker.min.mjs");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
