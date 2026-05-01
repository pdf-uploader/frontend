/**
 * Vercel can drop or relocate `Authorization` on ingress (e.g. apex→www redirects, edge rules).
 * Browsers retain custom headers reliably; duplicate the Bearer here and read fallbacks server-side.
 * @see https://stackoverflow.com/questions/79763676/next-js-vercel-api-route-loses-authorization-header-in-production-works-in-dev
 */

export const PDF_STREAM_PROXY_AUTH_HEADER = "x-pdf-stream-auth";

export type IncomingRequestHeaders = Pick<Headers, "get">;

function parseAuthorizationFromVercelScHeaders(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const auth = obj.Authorization ?? obj.authorization;
    if (typeof auth === "string") {
      const s = auth.trim();
      return s.length > 0 ? s : null;
    }
  } catch {
    //
  }
  return null;
}

/**
 * Bearer (+ optional duplicates) forwarded from Next Route Handler → Express presign route.
 *
 * Read the custom header **first**: Vercel's edge proxy overwrites `Authorization` with its own
 * internal OIDC JWT (`iss: "serverless"`, `domain: "<vercel-domain>"`), which would be forwarded
 * verbatim and fail `jsonwebtoken.verify()` on EC2 with `invalid signature`. Custom headers like
 * `x-pdf-stream-auth` pass through untouched.
 * @see https://stackoverflow.com/questions/70996838/vercel-production-branch-is-stripping-authorization-header-on-post-to-serverless
 */
export function authorizationForPdfStreamUpstream(incoming: IncomingRequestHeaders): string | null {
  const dup = incoming.get(PDF_STREAM_PROXY_AUTH_HEADER)?.trim();
  if (dup) {
    return dup;
  }
  const std = incoming.get("authorization")?.trim();
  if (std && !looksLikeVercelInternalBearer(std)) {
    return std;
  }
  const forwarded = incoming.get("x-forwarded-authorization")?.trim();
  if (forwarded) {
    return forwarded;
  }
  return parseAuthorizationFromVercelScHeaders(incoming.get("x-vercel-sc-headers"));
}

/** Heuristic: Vercel proxy bearer claims `iss: "serverless"` (or contains `deploymentId`). */
function looksLikeVercelInternalBearer(value: string): boolean {
  const token = value.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length < 2) {
    return false;
  }
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const payload = JSON.parse(json) as Record<string, unknown>;
    if (payload.iss === "serverless") {
      return true;
    }
    if (typeof payload.deploymentId === "string") {
      return true;
    }
  } catch {
    //
  }
  return false;
}

/** Browser → `/api/files/…/pdf-stream`: send both headers so ingress cannot strip auth entirely. */
export function pdfStreamProxyRequestHeaders(accessToken: string): HeadersInit {
  const t = accessToken.trim();
  if (!t) {
    return {};
  }
  const bearer = t.toLowerCase().startsWith("bearer ") ? t : `Bearer ${t}`;
  return {
    Authorization: bearer,
    [PDF_STREAM_PROXY_AUTH_HEADER]: bearer,
  };
}

/**
 * Express `auth.middleware` reads `req.cookies.accessToken`; the real cookie lives on the EC2
 * domain, so it never reaches a Vercel `/api/...` Route Handler. Mirror the Bearer into a
 * `Cookie: accessToken=...` header on the server-to-server hop so the existing middleware works
 * unchanged. Inbound cookies (if any) are preserved.
 */
export function pdfStreamUpstreamCookieHeader(
  incomingCookie: string | null | undefined,
  authorization: string | null | undefined,
): string | undefined {
  const parts: string[] = [];
  if (incomingCookie && incomingCookie.trim()) {
    parts.push(incomingCookie.trim());
  }
  if (authorization) {
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (token) {
      const joined = parts.join("; ");
      if (!/(?:^|;\s*)accessToken=/i.test(joined)) {
        parts.push(`accessToken=${token}`);
      }
    }
  }
  return parts.length > 0 ? parts.join("; ") : undefined;
}
