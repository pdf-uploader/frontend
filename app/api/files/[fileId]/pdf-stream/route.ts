import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function readPresignedUrlFromJson(data: unknown): string {
  if (data == null || typeof data !== "object") {
    throw new Error("Invalid presign response");
  }
  const url = typeof (data as { url?: unknown }).url === "string" ? (data as { url: string }).url.trim() : "";
  if (!url) {
    throw new Error('Presign response missing "url"');
  }
  return url;
}

/**
 * Server-side API base (reachable from the Next.js server). Prefer EXPRESS_SERVER_URL in production
 * so it can differ from the public browser URL.
 */
function backendBaseUrl(): string {
  return (
    process.env.EXPRESS_SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL?.trim() ||
    "http://localhost:4000"
  );
}

/**
 * Streams the PDF through this app’s origin so the browser never cross-origin fetches S3.
 * Postman → S3 works without CORS; browsers require CORS or a same-origin proxy like this route.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await context.params;

  const forward = new Headers();
  const auth = request.headers.get("authorization");
  if (auth) {
    forward.set("Authorization", auth);
  }
  const cookie = request.headers.get("cookie");
  if (cookie) {
    forward.set("Cookie", cookie);
  }

  const presignRes = await fetch(`${backendBaseUrl()}/files/pdf/${encodeURIComponent(fileId)}`, {
    headers: forward,
  });

  if (!presignRes.ok) {
    let message = `Could not authorize PDF access (${presignRes.status}).`;
    try {
      const errJson = (await presignRes.json()) as { message?: string };
      if (typeof errJson.message === "string" && errJson.message.trim()) {
        message = errJson.message.trim();
      }
    } catch {
      // ignore
    }
    return NextResponse.json({ message }, { status: presignRes.status });
  }

  let presignedUrl: string;
  try {
    const json: unknown = await presignRes.json();
    presignedUrl = readPresignedUrlFromJson(json);
  } catch {
    return NextResponse.json({ message: "Backend presign response was not valid JSON." }, { status: 502 });
  }

  const upstreamHeaders = new Headers();
  const range = request.headers.get("range");
  if (range) {
    upstreamHeaders.set("Range", range);
  }
  const ifRange = request.headers.get("if-range");
  if (ifRange) {
    upstreamHeaders.set("If-Range", ifRange);
  }

  const pdfRes = await fetch(presignedUrl, {
    redirect: "follow",
    headers: upstreamHeaders,
  });

  if (!pdfRes.ok) {
    return NextResponse.json(
      { message: `Storage returned ${pdfRes.status} when reading the PDF.` },
      { status: 502 },
    );
  }

  const outHeaders = new Headers();
  const ct = pdfRes.headers.get("content-type");
  outHeaders.set("Content-Type", ct && ct.includes("pdf") ? ct : "application/pdf");
  outHeaders.set("Cache-Control", "private, no-store");

  const contentLength = pdfRes.headers.get("content-length");
  if (contentLength) {
    outHeaders.set("Content-Length", contentLength);
  }
  const contentRange = pdfRes.headers.get("content-range");
  if (contentRange) {
    outHeaders.set("Content-Range", contentRange);
  }
  const acceptRanges = pdfRes.headers.get("accept-ranges");
  if (acceptRanges) {
    outHeaders.set("Accept-Ranges", acceptRanges);
  }

  return new NextResponse(pdfRes.body, {
    status: pdfRes.status,
    headers: outHeaders,
  });
}
