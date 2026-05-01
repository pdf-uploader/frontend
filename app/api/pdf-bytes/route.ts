import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Same-origin passthrough for **already-presigned** storage URLs (S3 SigV4 in the query string).
 *
 * Why this exists: cross-origin `fetch(presignedUrl)` from the browser fails when the bucket has
 * no `Access-Control-Allow-Origin` header — even though the URL is public and opens fine in a tab.
 * The route runs in Node on Vercel, so CORS doesn't apply, and no `Authorization` is involved
 * (presign auth lives in `?X-Amz-*=...`), which sidesteps Vercel's edge mangling `Authorization`.
 *
 * SSRF guard: only hostnames matching `S3_PROXY_ALLOWED_HOST_SUFFIX` (defaults to
 * `amazonaws.com`) are fetched.
 */

function allowedHostSuffix(): string {
  const raw = process.env.S3_PROXY_ALLOWED_HOST_SUFFIX?.trim();
  return raw && raw.length > 0 ? raw : ".amazonaws.com";
}

function isAllowedHost(hostname: string): boolean {
  const suffix = allowedHostSuffix();
  const normalized = suffix.startsWith(".") ? suffix : `.${suffix}`;
  const lower = hostname.toLowerCase();
  return lower === normalized.slice(1) || lower.endsWith(normalized);
}

function badRequest(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 400 });
}

export async function GET(request: NextRequest): Promise<Response> {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return badRequest("Missing 'url' query parameter.");
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return badRequest("Invalid 'url' query parameter.");
  }

  if (target.protocol !== "https:") {
    return badRequest("Only https URLs are allowed.");
  }
  if (!isAllowedHost(target.hostname)) {
    return badRequest(`Host '${target.hostname}' is not allowed.`);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      redirect: "follow",
      cache: "no-store",
      // The user-agent for SigV4 doesn't need cookies, custom headers, or auth.
      headers: { Accept: "*/*" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Upstream fetch failed.";
    return NextResponse.json({ message: `Storage fetch failed: ${msg}` }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { message: `Storage returned ${upstream.status} when reading the PDF.` },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  headers.set("Content-Type", ct && ct.includes("pdf") ? ct : "application/pdf");
  headers.set("Cache-Control", "private, no-store");

  // Pass length/range info through so the viewer can report download progress accurately.
  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }
  const contentRange = upstream.headers.get("content-range");
  if (contentRange) {
    headers.set("Content-Range", contentRange);
  }
  const acceptRanges = upstream.headers.get("accept-ranges");
  if (acceptRanges) {
    headers.set("Accept-Ranges", acceptRanges);
  }

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
