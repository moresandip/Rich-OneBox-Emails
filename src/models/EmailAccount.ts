import mongoose, { Schema, Document } from 'mongoose';
import { EmailAccount as IEmailAccount } from '../types';

export interface EmailAccountDocument extends Omit<IEmailAccount, 'id'>, Document {}

const EmailAccountSchema = new Schema<EmailAccountDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  imapHost: {
    type: String,
    required: true
  },
  imapPort: {
    type: Number,
    required: true
  },
  secure: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSync: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

// Index for efficient queries
EmailAccountSchema.index({ email: 1 });
EmailAccountSchema.index({ isActive: 1 });

export const EmailAccountModel = mongoose.model<EmailAccountDocument>('EmailAccount', EmailAccountSchema);
