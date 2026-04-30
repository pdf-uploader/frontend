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
  /**
   * How the user authenticates — e.g. `LOCAL` | `GOOGLE`.
   * Backend should set for OAuth accounts so the admin UI can hide local password fields.
   */
  authProvider?: string;
  /** Alternate API key for the same concept as `authProvider`. */
  provider?: string;
  oauthProvider?: string;
  signInProvider?: string;
  /** Present when linked to Google OAuth (some APIs use `googleSub` instead). */
  googleId?: string;
  googleSub?: string;
  /** When false, user has no local password (OAuth / SSO only) — admin UI must not show password. */
  hasLocalPassword?: boolean;
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
