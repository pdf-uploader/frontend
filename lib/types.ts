export type UserRole = "ADMIN" | "USER";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  csrfToken?: string;
}

export interface SignInResponse {
  message: string | undefined;
  accessToken: string;
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
  username?: string;
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
