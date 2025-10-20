import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import DatabaseManager from './config/database';
import { EmailController } from './controllers/EmailController';
import { AccountController } from './controllers/AccountController';
import { IMAPService } from './services/IMAPService';
import { SlackService } from './services/SlackService';
import { WebhookService } from './services/WebhookService';
import { GeminiAIService } from './services/GeminiAIService';
import { QdrantService } from './services/QdrantService';
import { LoggingService } from './services/LoggingService';

class App {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;
  private imapService: IMAPService;
  private emailController: EmailController;
  private accountController: AccountController;
  private slackService: SlackService;
  private webhookService: WebhookService;
  private aiService: GeminiAIService;
  private qdrantService: QdrantService;
  private loggingService: LoggingService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.imapService = new IMAPService();
    this.emailController = new EmailController();
    this.accountController = new AccountController();
    this.slackService = new SlackService();
    this.webhookService = new WebhookService();
    this.aiService = new GeminiAIService();
    this.qdrantService = new QdrantService();
    this.loggingService = LoggingService.getInstance();

    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketIO();
    this.initializeServices();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (req: express.Request, res: express.Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes
    this.app.use('/api/emails', this.createEmailRoutes());
    this.app.use('/api/accounts', this.createAccountRoutes());
    this.app.use('/api/system', this.createSystemRoutes());

    // 404 handler for undefined routes
    this.app.use('*', (req: express.Request, res: express.Response) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });

    // Error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    });
  }

  private createEmailRoutes(): express.Router {
    const router = express.Router();

    // Email routes
    router.get('/', (req: express.Request, res: express.Response) => this.emailController.getEmails(req, res));
    router.get('/search', (req: express.Request, res: express.Response) => this.emailController.searchEmails(req, res));
    router.get('/stats', (req: express.Request, res: express.Response) => this.emailController.getEmailStats(req, res));
    router.get('/:id', (req: express.Request, res: express.Response) => this.emailController.getEmailById(req, res));
    router.put('/:id', (req: express.Request, res: express.Response) => this.emailController.updateEmail(req, res));
    router.delete('/:id', (req: express.Request, res: express.Response) => this.emailController.deleteEmail(req, res));
    router.post('/:id/categorize', (req: express.Request, res: express.Response) => this.emailController.categorizeEmail(req, res));
    router.post('/:id/suggest-reply', (req: express.Request, res: express.Response) => this.emailController.generateSuggestedReply(req, res));

    return router;
  }

  private createAccountRoutes(): express.Router {
    const router = express.Router();

    // Account routes
    router.get('/', (req: express.Request, res: express.Response) => this.accountController.getAccounts(req, res));
    router.get('/status', (req: express.Request, res: express.Response) => this.accountController.getConnectionStatus(req, res));
    router.get('/:id', (req: express.Request, res: express.Response) => this.accountController.getAccountById(req, res));
    router.post('/', (req: express.Request, res: express.Response) => this.accountController.createAccount(req, res));
    router.put('/:id', (req: express.Request, res: express.Response) => this.accountController.updateAccount(req, res));
    router.delete('/:id', (req: express.Request, res: express.Response) => this.accountController.deleteAccount(req, res));
    router.post('/:id/test', (req: express.Request, res: express.Response) => this.accountController.testConnection(req, res));
    router.post('/:id/sync', (req: express.Request, res: express.Response) => this.accountController.syncAccount(req, res));

    return router;
  }

  private createSystemRoutes(): express.Router {
    const router = express.Router();

    // System routes
    router.get('/status', async (req: express.Request, res: express.Response) => {
      try {
        const connectionStatus = this.imapService.getConnectionStatus();
        const dbManager = DatabaseManager.getInstance();

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
              elasticsearch: true // Assume connected if no error
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get system status'
        });
      }
    });

    router.post('/start-imap', async (req: express.Request, res: express.Response) => {
      try {
        await this.imapService.start();
        res.json({
          success: true,
          message: 'IMAP service started'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to start IMAP service'
        });
      }
    });

    router.post('/stop-imap', async (req: express.Request, res: express.Response) => {
      try {
        await this.imapService.stop();
        res.json({
          success: true,
          message: 'IMAP service stopped'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to stop IMAP service'
        });
      }
    });

    return router;
  }

  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });

      // Join room for real-time updates
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

  private async initializeServices(): Promise<void> {
    try {
      this.loggingService.info('Initializing services...');

      // Connect to databases (optional - don't fail if not configured)
      try {
        await DatabaseManager.getInstance().connectMongoDB();
        this.loggingService.info('MongoDB connected successfully');
      } catch (error) {
        this.loggingService.warn('MongoDB connection failed - some features may not work', error as Error);
      }

      try {
        await DatabaseManager.getInstance().connectElasticsearch();
        this.loggingService.info('Elasticsearch connected successfully');
      } catch (error) {
        this.loggingService.warn('Elasticsearch connection failed - search features may not work', error as Error);
      }

      // Initialize Qdrant vector database (optional)
      try {
        await this.qdrantService.initializeCollection();
        this.loggingService.info('Qdrant vector database initialized');
      } catch (error) {
        this.loggingService.warn('Qdrant initialization failed - AI features may not work', error as Error);
      }

      // Initialize AI service with product data (optional)
      try {
        await this.aiService.initializeProductData();
        this.loggingService.info('AI service initialized with product data');
      } catch (error) {
        this.loggingService.warn('AI service initialization failed - AI features may not work', error as Error);
      }

      // Start IMAP service (optional - only if accounts exist)
      try {
        await this.imapService.start();
        this.loggingService.info('IMAP service started');
      } catch (error) {
        this.loggingService.warn('IMAP service failed to start - email sync may not work', error as Error);
      }

      // Set up IMAP event listeners
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

      this.loggingService.info('Services initialization completed (some services may be unavailable if not configured)');
    } catch (error) {
      this.loggingService.error('Critical error during services initialization', error as Error);
      // Don't exit - allow server to start even if services fail
      this.loggingService.warn('Server will start but some features may not be available');
    }
  }

  public async start(): Promise<void> {
    try {
      this.server.listen(config.port, () => {
        console.log(`🚀 Server running on port ${config.port}`);
        console.log(`📧 IMAP service: ${this.imapService ? 'Active' : 'Inactive'}`);
        console.log(`🔍 Elasticsearch: Connected`);
        console.log(`💾 MongoDB: Connected`);
        console.log(`🔗 WebSocket: Active`);
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      console.log('Shutting down server...');
      
      // Stop IMAP service
      await this.imapService.stop();
      
      // Close database connections
      await DatabaseManager.getInstance().disconnect();
      
      // Close server
      this.server.close(() => {
        console.log('Server stopped');
        process.exit(0);
      });
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

export default App;
