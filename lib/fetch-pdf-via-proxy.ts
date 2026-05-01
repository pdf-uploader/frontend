import { authStore } from "@/lib/auth-store";

/** Full buffered fetch for intentional downloads (loads entire file into RAM once). Prefer passing the `/api/files/…/pdf-stream` URL to pdf.js for viewing. */
export async function fetchPdfBlobThroughAppProxy(fileId: string, signal?: AbortSignal): Promise<Blob> {
  const token = authStore.getAccessToken();
  const path = `/api/files/${encodeURIComponent(fileId)}/pdf-stream`;
  const response = await fetch(path, {
    signal,
    credentials: "include",
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (response.status === 401) {
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
    throw new Error(detail || `Could not load PDF (${response.status}).`);
  }

  const blob = await response.blob();
  if (blob.size < 16) {
    throw new Error("PDF download was empty or incomplete.");
  }
  return blob;
}
