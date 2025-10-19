import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
declare class App {
    app: express.Application;
    server: any;
    io: SocketIOServer;
    private imapService;
    private emailController;
    private accountController;
    private slackService;
    private webhookService;
    private aiService;
    private qdrantService;
    private loggingService;
    constructor();
    private initializeMiddleware;
    private initializeRoutes;
    private createEmailRoutes;
    private createAccountRoutes;
    private createSystemRoutes;
    private initializeSocketIO;
    private initializeServices;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export default App;
//# sourceMappingURL=app.d.ts.map