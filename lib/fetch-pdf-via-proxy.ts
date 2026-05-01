import { authStore } from "@/lib/auth-store";
import { pdfStreamProxyRequestHeaders } from "@/lib/pdf-stream-proxy-auth";

/** Full buffered fetch for intentional downloads (loads entire file into RAM once). Prefer passing the `/api/files/…/pdf-stream` URL to pdf.js for viewing. */
export async function fetchPdfBlobThroughAppProxy(fileId: string, signal?: AbortSignal): Promise<Blob> {
  const token = authStore.getAccessToken();
  const path = `/api/files/${encodeURIComponent(fileId)}/pdf-stream`;
  const response = await fetch(path, {
    signal,
    credentials: "include",
    cache: "no-store",
    headers: token ? pdfStreamProxyRequestHeaders(token) : {},
  });

  if (response.status === 401) {
    console.error("[pdf-stream] HTTP 401: Session expired. Sign in again.");
    console.error(`[pdf-stream] path: ${path}`);
    throw new Error("Session expired. Sign in again.");
  }

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
        // ignore malformed JSON body
      }
    }
    const msg = detail || `Could not load PDF (${response.status}).`;
    console.error(`[pdf-stream] HTTP ${response.status}: ${msg}`);
    console.error(`[pdf-stream] path: ${path}`);
    throw new Error(msg);
  }

  const blob = await response.blob();
  if (blob.size < 16) {
    throw new Error("PDF download was empty or incomplete.");
  }
  return blob;
}
