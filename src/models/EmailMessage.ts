import mongoose, { Schema, Document } from 'mongoose';
import { EmailMessage as IEmailMessage, EmailCategory } from '../types';

export interface EmailMessageDocument extends Omit<IEmailMessage, 'id'>, Document {}

const EmailAttachmentSchema = new Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  size: { type: Number, required: true },
  content: { type: Buffer, required: true }
}, { _id: false });

const EmailLabelSchema = new Schema({
  name: { type: String, required: true },
  color: { type: String }
}, { _id: false });

const EmailMessageSchema = new Schema<EmailMessageDocument>({
  accountId: {
    type: String,
    required: true,
    ref: 'EmailAccount'
  },
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  from: {
    type: String,
    required: true,
    trim: true
  },
  to: [{
    type: String,
    required: true,
    trim: true
  }],
  cc: [{
    type: String,
    trim: true
  }],
  bcc: [{
    type: String,
    trim: true
  }],
  date: {
    type: Date,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  htmlBody: {
    type: String
  },
  attachments: [EmailAttachmentSchema],
  folder: {
    type: String,
    required: true,
    default: 'INBOX'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  labels: [EmailLabelSchema],
  aiCategory: {
    type: String,
    enum: Object.values(EmailCategory),
    default: EmailCategory.UNCATEGORIZED
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
EmailMessageSchema.index({ accountId: 1, date: -1 });
EmailMessageSchema.index({ from: 1 });
EmailMessageSchema.index({ subject: 'text', body: 'text' });
EmailMessageSchema.index({ aiCategory: 1 });
EmailMessageSchema.index({ folder: 1 });
EmailMessageSchema.index({ isRead: 1 });
EmailMessageSchema.index({ isFlagged: 1 });

export const EmailMessageModel = mongoose.model<EmailMessageDocument>('EmailMessage', EmailMessageSchema);
