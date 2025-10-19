import mongoose, { Document } from 'mongoose';
import { EmailAccount as IEmailAccount } from '../types';
export interface EmailAccountDocument extends Omit<IEmailAccount, 'id'>, Document {
}
export declare const EmailAccountModel: mongoose.Model<EmailAccountDocument, {}, {}, {}, mongoose.Document<unknown, {}, EmailAccountDocument, {}, {}> & EmailAccountDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=EmailAccount.d.ts.map