export type UserRole = "ADMIN" | "USER";

/** Account approval workflow (Prisma-style enums often stringify as WAITING / APPROVED / REJECTED). */
export type UserStatus = "WAITING" | "REJECTED" | "APPROVED";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  /** Account lifecycle (sign-in allowed only when APPROVED or omitted). */
  status?: UserStatus;
}

export interface AuthTokens {
  accessToken: string;
  csrfToken?: string;
}

export interface SignInResponse {
  message?: string;
  /** Present when API returns JWT in JSON; otherwise tokens are HttpOnly cookies only. */
  accessToken?: string;
  /** Echoed from backend so UI can show ADMIN/USER without decoding HttpOnly JWT. */
  role?: UserRole;
  /** Account approval gate — WAITING / REJECTED must not complete login. */
  status?: UserStatus;
  user?: AuthUser;
}

export interface FolderFile {
  id: string;
  filename: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  foldername: string;
  lock?: boolean;
  createdAt?: string;
  updatedAt?: string;
  /** Server sort index (lowest first). */
  order?: number;
  /** @deprecated prefer `order` if present */
  sortOrder?: number;
  files: FolderFile[];
}

export interface FileDetails {
  id: string;
  filename: string;
  folderId: string;
  createdAt: string;
  content?: string[];
  fileUrl?: string;
}

export interface SearchResult {
  id: string; // unique result row id
  fileId: string;
  filename: string;
  page: number;
  snippet: string;
}

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  password?: string;
  passwordHash?: string;
  refreshToken?: string;
  accessToken?: string;
  createdAt?: string;
}

export interface BookmarkItem {
  id: string;
  fileId: string;
  page: number;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}
