import { getPdfViewerPresignedUrl } from "@/lib/api";

/**
 * Full buffered PDF fetch for intentional downloads.
 *
 * Browser → EC2 to obtain the presigned S3 URL (cookies + Bearer attach via the shared `api`),
 * then Browser → S3 to read the bytes. Avoids the Vercel `/api/.../pdf-stream` proxy hop —
 * Vercel's edge replaces `Authorization` with its own internal JWT, which EC2 rejects.
 */
export async function fetchPdfBlobThroughAppProxy(fileId: string, signal?: AbortSignal): Promise<Blob> {
  const { url } = await getPdfViewerPresignedUrl(fileId, signal);

  const response = await fetch(url, { signal, cache: "no-store" });
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
