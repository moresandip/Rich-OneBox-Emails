import { Request, Response } from 'express';
export declare class AccountController {
    private imapService;
    private slackService;
    private webhookService;
    constructor();
    getAccounts(req: Request, res: Response): Promise<void>;
    getAccountById(req: Request, res: Response): Promise<void>;
    createAccount(req: Request, res: Response): Promise<void>;
    updateAccount(req: Request, res: Response): Promise<void>;
    deleteAccount(req: Request, res: Response): Promise<void>;
    testConnection(req: Request, res: Response): Promise<void>;
    getConnectionStatus(req: Request, res: Response): Promise<void>;
    syncAccount(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AccountController.d.ts.map