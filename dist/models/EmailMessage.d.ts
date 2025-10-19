import mongoose, { Document } from 'mongoose';
import { EmailMessage as IEmailMessage } from '../types';
export interface EmailMessageDocument extends Omit<IEmailMessage, 'id'>, Document {
}
export declare const EmailMessageModel: mongoose.Model<EmailMessageDocument, {}, {}, {}, mongoose.Document<unknown, {}, EmailMessageDocument, {}, {}> & EmailMessageDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=EmailMessage.d.ts.map