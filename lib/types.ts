export type UserRole = "ADMIN" | "USER";

export type UserStatus = "WAITING" | "APPROVED" | "REJECTED";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  username?: string;
  status?: UserStatus;
}

export interface AuthTokens {
  accessToken: string;
  csrfToken?: string;
}

export interface SignInResponse {
  message: string | undefined;
  accessToken: string;
  user?: AuthUser;
  role?: UserRole;
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

/** GET `/files/pdf/:fileId` — presigned S3 URL for viewer and downloads. */
export interface PdfPresignedUrlResponse {
  url: string;
  filename?: string;
  /** Presigned URL lifetime in seconds from the backend (e.g. 300). */
  expiresIn?: number;
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
  /** Display / login handle — aligned with POST signup payloads. */
  username?: string;
  status?: UserStatus;
  password?: string;
  passwordHash?: string;
  refreshToken?: string;
  accessToken?: string;
  createdAt?: string;
  /** OAuth / SSO hints from API (admin listings, profile). */
  authProvider?: string;
  provider?: string;
  oauthProvider?: string;
  signInProvider?: string;
  googleId?: string;
  googleSub?: string;
  /** When false, account has no local password (e.g. OAuth-only). */
  hasLocalPassword?: boolean;
}

export interface BookmarkItem {
  id: string;
  fileId: string;
  page: number;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
}
