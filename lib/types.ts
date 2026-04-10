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
  accessToken: string;
  csrfToken?: string;
  user: AuthUser;
}

export interface FolderFile {
  id: string;
  filename: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  files: FolderFile[];
}

export interface FileDetails {
  id: string;
  filename: string;
  folderId: string;
  folderName?: string;
  fileUrl: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  fileId: string;
  filename: string;
  page: number;
  snippet: string;
}

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}
