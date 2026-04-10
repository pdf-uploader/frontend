import type { AuthUser, UserRole } from "@/lib/types";

type LooseUser = Record<string, unknown>;

function normalizeRole(value: unknown): UserRole {
  if (typeof value === "string") {
    const r = value.trim().toUpperCase();
    if (r === "ADMIN" || r === "ADMINISTRATOR" || r === "SUPERADMIN" || r === "ROOT") {
      return "ADMIN";
    }
    if (r === "USER" || r === "MEMBER" || r === "STANDARD") {
      return "USER";
    }
  }
  if (typeof value === "number") {
    if (value === 1) return "ADMIN";
    if (value === 0) return "USER";
  }
  return "USER";
}

/**
 * Maps common API shapes (camelCase, lowercase enums, alternate keys) to AuthUser.
 */
export function normalizeAuthUser(input: unknown): AuthUser | null {
  if (!input || typeof input !== "object") {
    return null;
  }
  const o = input as LooseUser;

  const id = o.id ?? o.userId ?? o.sub;
  const email = o.email ?? o.username ?? o.mail;
  const roleRaw = o.role ?? o.userRole ?? o.type;

  if (typeof id !== "string" || !id) {
    return null;
  }
  if (typeof email !== "string" || !email) {
    return null;
  }

  if (o.isAdmin === true || o.admin === true) {
    return { id, email, role: "ADMIN" as const };
  }

  return {
    id,
    email,
    role: normalizeRole(roleRaw),
  };
}

export function isAdminUser(user: AuthUser | null | undefined): boolean {
  return user?.role === "ADMIN";
}

/**
 * Best-effort decode of JWT payload for UI (role/sub/email). Not verified — same as any client JWT read.
 */
export function authUserFromAccessToken(token: string, fallbackEmail?: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const json = JSON.parse(base64UrlDecode(parts[1])) as Record<string, unknown>;
    const id = String(json.sub ?? json.userId ?? json.id ?? "");
    const email = String(json.email ?? json.preferred_username ?? json.username ?? fallbackEmail ?? "");
    if (!id || !email) return null;
    const rolesArray = Array.isArray(json.roles) ? json.roles[0] : json.roles;
    if (json.isAdmin === true || json.admin === true) {
      return { id, email, role: "ADMIN" as const };
    }
    return {
      id,
      email,
      role: normalizeRole(
        json.role ??
          json.userRole ??
          rolesArray ??
          json["https://example.com/role"] ??
          json["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
      ),
    };
  } catch {
    return null;
  }
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}
