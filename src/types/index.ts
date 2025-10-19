export interface EmailAccount {
  id: string;
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  secure: boolean;
  isActive: boolean;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailMessage {
  id: string;
  accountId: string;
  messageId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  date: Date;
  body: string;
  htmlBody?: string;
  attachments?: EmailAttachment[];
  folder: string;
  isRead: boolean;
  isFlagged: boolean;
  labels: EmailLabel[];
  aiCategory?: EmailCategory;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content: ArrayBuffer;
}

export interface EmailLabel {
  name: string;
  color?: string;
}

export enum EmailCategory {
  INTERESTED = 'interested',
  MEETING_BOOKED = 'meeting_booked',
  NOT_INTERESTED = 'not_interested',
  SPAM = 'spam',
  OUT_OF_OFFICE = 'out_of_office',
  UNCATEGORIZED = 'uncategorized'
}

export interface SearchFilters {
  accountId?: string;
  folder?: string;
  category?: EmailCategory;
  dateFrom?: Date;
  dateTo?: Date;
  isRead?: boolean;
  isFlagged?: boolean;
  searchText?: string;
}

export interface SlackNotification {
  channel: string;
  text: string;
  attachments?: any[];
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: Date;
}

export interface AISuggestion {
  category: EmailCategory;
  confidence: number;
  suggestedReply?: string;
  reasoning?: string;
}

export interface RAGContext {
  productInfo: string;
  outreachAgenda: string;
  meetingLink: string;
}

export interface IMAPConnection {
  accountId: string;
  connection: any;
  isConnected: boolean;
  lastActivity: Date;
}
