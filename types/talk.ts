export interface TalkSession {
  id: string;
  email: string;
  name: string;
  role: "superadmin" | "owner";
  loggedInAt: number;
  expiresAt: number;
}

export interface TalkOtpChallenge {
  id: string;
  email: string;
  otpHash: string;
  salt: string;
  attemptsCount: number;
  isConsumed: boolean;
  clientIp?: string | null;
  userAgent?: string;
  createdAt: number;
  expiresAt: number;
}

export interface TalkVaultFile {
  id: string;
  fileName: string;
  originalName: string;
  storagePath: string;
  downloadUrl: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: number;
}

export interface TalkNotepad {
  id: string;
  content: string;
  lastModifiedAt: number;
  charCount: number;
  wordCount: number;
}

export type TalkMessageTag = "general" | "urgent" | "link" | "idea" | "secret";

export interface TalkMessage {
  id: string;
  text: string;
  tag: TalkMessageTag;
  createdAt: number;
}

export interface TalkPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

