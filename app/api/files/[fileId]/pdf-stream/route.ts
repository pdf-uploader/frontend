import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/lib/api";

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
 * Matches server reachability logic; `api` defaults use `NEXT_PUBLIC_EXPRESS_SERVER_URL` only —
 * Override `baseURL` per request when `EXPRESS_SERVER_URL` is set (e.g. Vercel → private backend).
 */
function backendBaseUrl(): string {
  return (
    process.env.EXPRESS_SERVER_URL?.trim() ||
    process.env.NEXT_PUBLIC_EXPRESS_SERVER_URL?.trim() ||
    "http://localhost:4000"
  );
}

function axiosErrorPayloadMessage(error: AxiosError<{ message?: string }>): string {
  const data = error.response?.data;
  if (data && typeof data === "object" && typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  return error.message || "Upstream request failed.";
}

/**
 * Proxies GET `/files/pdf/:id` via the shared axios `api` (cookies + Bearer when forwarded).
 * Streams the PDF from the presigned storage URL same-origin on the frontend.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  try {
    console.log("===============")
    const { fileId } = await context.params;

    const auth = request.headers.get("authorization");
    const cookie = request.headers.get("cookie");
    console.log("auth", auth);
    console.log("cookie", cookie);

    const { data } = await api.get<unknown>(`/files/pdf/${encodeURIComponent(fileId)}`, {
      baseURL: backendBaseUrl(),
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(auth ? { Authorization: auth } : {}),
      },
    });
    console.log("data", data);

    const presignedUrl = readPresignedUrlFromJson(data);
    console.log("presignedUrl", presignedUrl);

    const pdfRes = await fetch(presignedUrl, {
      redirect: "follow",
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
  } catch (error) {
    console.log("error", error);
    return NextResponse.json({ message: "Error fetching PDF from storage" }, { status: 500 });
  }
}
