import { getPdfViewerPresignedUrl } from "@/lib/api";

/**
 * Full buffered PDF fetch for intentional downloads.
 *
 * Browser → EC2 (`/files/pdf/:id`) for the presigned S3 URL (cookies + Bearer ride the shared `api`),
 * then Browser → `/api/pdf-bytes?url=...` (same-origin) to bypass S3 CORS without re-introducing
 * the Vercel→EC2 auth hop. Cross-origin `fetch(presignedUrl)` fails when the bucket has no
 * `Access-Control-Allow-Origin` for our domain.
 */
export async function fetchPdfBlobThroughAppProxy(fileId: string, signal?: AbortSignal): Promise<Blob> {
  const { url } = await getPdfViewerPresignedUrl(fileId, signal);

  const proxyPath = `/api/pdf-bytes?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyPath, { signal, cache: "no-store", credentials: "omit" });
  if (!response.ok) {
    let detail = "";
    const ct = response.headers.get("content-type");
    if (ct?.includes("application/json")) {
      try {
        const j = (await response.json()) as { message?: string };
        if (typeof j.message === "string" && j.message.trim()) {
          detail = j.message.trim();
        }
      } catch {
        //
      }
    }
    const msg = detail || `Could not load PDF (${response.status}).`;
    console.error(`[pdf-download] HTTP ${response.status}: ${msg}`);
    throw new Error(msg);
  }

  const blob = await response.blob();
  if (blob.size < 16) {
    throw new Error("PDF download was empty or incomplete.");
  }
  return blob;
}
