"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailMessageModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("../types");
const EmailAttachmentSchema = new mongoose_1.Schema({
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    content: { type: Buffer, required: true }
}, { _id: false });
const EmailLabelSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    color: { type: String }
}, { _id: false });
const EmailMessageSchema = new mongoose_1.Schema({
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
        enum: Object.values(types_1.EmailCategory),
        default: types_1.EmailCategory.UNCATEGORIZED
    }
}, {
    timestamps: true
});
EmailMessageSchema.index({ accountId: 1, date: -1 });
EmailMessageSchema.index({ from: 1 });
EmailMessageSchema.index({ subject: 'text', body: 'text' });
EmailMessageSchema.index({ aiCategory: 1 });
EmailMessageSchema.index({ folder: 1 });
EmailMessageSchema.index({ isRead: 1 });
EmailMessageSchema.index({ isFlagged: 1 });
exports.EmailMessageModel = mongoose_1.default.model('EmailMessage', EmailMessageSchema);
//# sourceMappingURL=EmailMessage.js.map