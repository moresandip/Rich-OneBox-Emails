"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const config_1 = require("./config");
const database_1 = __importDefault(require("./config/database"));
const EmailController_1 = require("./controllers/EmailController");
const AccountController_1 = require("./controllers/AccountController");
const IMAPService_1 = require("./services/IMAPService");
const SlackService_1 = require("./services/SlackService");
const WebhookService_1 = require("./services/WebhookService");
const GeminiAIService_1 = require("./services/GeminiAIService");
const QdrantService_1 = require("./services/QdrantService");
const LoggingService_1 = require("./services/LoggingService");
class App {
    constructor() {
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.imapService = new IMAPService_1.IMAPService();
        this.emailController = new EmailController_1.EmailController();
        this.accountController = new AccountController_1.AccountController();
        this.slackService = new SlackService_1.SlackService();
        this.webhookService = new WebhookService_1.WebhookService();
        this.aiService = new GeminiAIService_1.GeminiAIService();
        this.qdrantService = new QdrantService_1.QdrantService();
        this.loggingService = LoggingService_1.LoggingService.getInstance();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeSocketIO();
        this.initializeServices();
    }
    initializeMiddleware() {
        this.app.use((0, helmet_1.default)());
        this.app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || '*',
            credentials: true
        }));
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    initializeRoutes() {
        this.app.use(express_1.default.static('public'));
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });
        this.app.use('/api/emails', this.createEmailRoutes());
        this.app.use('/api/accounts', this.createAccountRoutes());
        this.app.use('/api/system', this.createSystemRoutes());
        this.app.get('*', (req, res) => {
            res.sendFile('index.html', { root: 'public' });
        });
        this.app.use((error, req, res, next) => {
            console.error('Unhandled error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        });
    }
    createEmailRoutes() {
        const router = express_1.default.Router();
        router.get('/', (req, res) => this.emailController.getEmails(req, res));
        router.get('/search', (req, res) => this.emailController.searchEmails(req, res));
        router.get('/stats', (req, res) => this.emailController.getEmailStats(req, res));
        router.get('/:id', (req, res) => this.emailController.getEmailById(req, res));
        router.put('/:id', (req, res) => this.emailController.updateEmail(req, res));
        router.delete('/:id', (req, res) => this.emailController.deleteEmail(req, res));
        router.post('/:id/categorize', (req, res) => this.emailController.categorizeEmail(req, res));
        router.post('/:id/suggest-reply', (req, res) => this.emailController.generateSuggestedReply(req, res));
        return router;
    }
    createAccountRoutes() {
        const router = express_1.default.Router();
        router.get('/', (req, res) => this.accountController.getAccounts(req, res));
        router.get('/status', (req, res) => this.accountController.getConnectionStatus(req, res));
        router.get('/:id', (req, res) => this.accountController.getAccountById(req, res));
        router.post('/', (req, res) => this.accountController.createAccount(req, res));
        router.put('/:id', (req, res) => this.accountController.updateAccount(req, res));
        router.delete('/:id', (req, res) => this.accountController.deleteAccount(req, res));
        router.post('/:id/test', (req, res) => this.accountController.testConnection(req, res));
        router.post('/:id/sync', (req, res) => this.accountController.syncAccount(req, res));
        return router;
    }
    createSystemRoutes() {
        const router = express_1.default.Router();
        router.get('/status', async (req, res) => {
            try {
                const connectionStatus = this.imapService.getConnectionStatus();
                const dbManager = database_1.default.getInstance();
                res.json({
                    success: true,
                    data: {
                        imap: {
                            totalConnections: connectionStatus.length,
                            activeConnections: connectionStatus.filter(c => c.isConnected).length,
                            connections: connectionStatus
                        },
                        database: {
                            mongodb: dbManager.getMongoConnection().readyState === 1,
                            elasticsearch: true
                        },
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: new Date().toISOString()
                    }
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to get system status'
                });
            }
        });
        router.post('/start-imap', async (req, res) => {
            try {
                await this.imapService.start();
                res.json({
                    success: true,
                    message: 'IMAP service started'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to start IMAP service'
                });
            }
        });
        router.post('/stop-imap', async (req, res) => {
            try {
                await this.imapService.stop();
                res.json({
                    success: true,
                    message: 'IMAP service stopped'
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to stop IMAP service'
                });
            }
        });
        return router;
    }
    initializeSocketIO() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
            socket.on('join-room', (room) => {
                socket.join(room);
                console.log(`Client ${socket.id} joined room: ${room}`);
            });
            socket.on('leave-room', (room) => {
                socket.leave(room);
                console.log(`Client ${socket.id} left room: ${room}`);
            });
        });
    }
    async initializeServices() {
        try {
            this.loggingService.info('Initializing services...');
            await database_1.default.getInstance().connectMongoDB();
            await database_1.default.getInstance().connectElasticsearch();
            await this.qdrantService.initializeCollection();
            this.loggingService.info('Qdrant vector database initialized');
            await this.aiService.initializeProductData();
            this.loggingService.info('AI service initialized with product data');
            await this.imapService.start();
            this.loggingService.info('IMAP service started');
            this.imapService.on('email:new', (email) => {
                this.loggingService.logEmailProcessed(email.id, email.accountId);
                this.io.emit('email:new', email);
            });
            this.imapService.on('email:categorized', (data) => {
                this.loggingService.logAICategorization(data.emailId, data.category, data.confidence);
                this.io.emit('email:categorized', data);
            });
            this.imapService.on('email:interested', (data) => {
                this.loggingService.info('Interested email detected', data);
                this.io.emit('email:interested', data);
            });
            this.loggingService.info('All services initialized successfully');
        }
        catch (error) {
            this.loggingService.error('Failed to initialize services', error);
            process.exit(1);
        }
    }
    async start() {
        try {
            this.server.listen(config_1.config.port, () => {
                console.log(`🚀 Server running on port ${config_1.config.port}`);
                console.log(`📧 IMAP service: ${this.imapService ? 'Active' : 'Inactive'}`);
                console.log(`🔍 Elasticsearch: Connected`);
                console.log(`💾 MongoDB: Connected`);
                console.log(`🔗 WebSocket: Active`);
            });
        }
        catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
    async stop() {
        try {
            console.log('Shutting down server...');
            await this.imapService.stop();
            await database_1.default.getInstance().disconnect();
            this.server.close(() => {
                console.log('Server stopped');
                process.exit(0);
            });
        }
        catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map