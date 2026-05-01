import { getPdfViewerPresignedUrl } from "@/lib/api";

/**
 * Full buffered PDF fetch for intentional downloads.
 *
 * 1. Browser → EC2 (`/files/pdf/:id`) — auth cookies + Bearer ride the shared `api`.
 * 2. Browser → presigned S3 URL — single GET, streamed into a Blob.
 *
 * S3 CORS for the deployed origin must allow `GET` (no preflight) for step 2 to succeed.
 */
export async function fetchPdfBlobThroughAppProxy(fileId: string, signal?: AbortSignal): Promise<Blob> {
  const { url } = await getPdfViewerPresignedUrl(fileId, signal);

  const response = await fetch(url, { signal, cache: "no-store", credentials: "omit" });
  if (!response.ok) {
    const msg = `Storage returned ${response.status} when reading the PDF.`;
    console.error(`[pdf-download] HTTP ${response.status}: ${msg}`);
    throw new Error(msg);
  }

  const blob = await response.blob();
  if (blob.size < 16) {
    throw new Error("PDF download was empty or incomplete.");
  }
  return blob;
}
