import { Request, Response } from 'express';
export declare class EmailController {
    private elasticsearchService;
    private aiService;
    constructor();
    getEmails(req: Request, res: Response): Promise<void>;
    getEmailById(req: Request, res: Response): Promise<void>;
    updateEmail(req: Request, res: Response): Promise<void>;
    deleteEmail(req: Request, res: Response): Promise<void>;
    categorizeEmail(req: Request, res: Response): Promise<void>;
    generateSuggestedReply(req: Request, res: Response): Promise<void>;
    getEmailStats(req: Request, res: Response): Promise<void>;
    searchEmails(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=EmailController.d.ts.map