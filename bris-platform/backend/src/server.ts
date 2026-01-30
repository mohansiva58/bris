import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import { createServer } from 'http';
import config from './config';
import { logger, stream } from './utils/logger';
import { createRedisClient } from './config/redis';
import { healthCheck as dbHealthCheck } from './config/database';
import { apiLimiter } from './middleware/ratelimit.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/events.routes';
import riskRoutes from './routes/risk.routes';
import userRoutes from './routes/users.routes';

// Import services
import { initializeWebSocket } from './services/websocket.service';
import { initializeQueue } from './services/queue.service';
import { initializeDatabase } from './config/db-init';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {
            if (!origin || origin === 'null' || config.cors.origins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    },
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl) or local files (origin 'null')
        if (!origin || origin === 'null' || config.cors.origins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: config.cors.credentials,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('combined', { stream }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`);
    next();
});

// Rate limiting
app.use('/api/', apiLimiter);

// Health check (no rate limit)
app.get('/health', async (req: Request, res: Response) => {
    const dbHealth = await dbHealthCheck();

    res.json({
        success: true,
        data: {
            status: dbHealth ? 'healthy' : 'degraded',
            timestamp: new Date(),
            uptime: process.uptime(),
            environment: config.env,
        },
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/users', userRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'BRIS Platform API',
        version: '1.0.0',
        documentation: '/api/docs',
        timestamp: new Date(),
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
        timestamp: new Date(),
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
    });

    res.status(500).json({
        success: false,
        error: config.isDevelopment ? err.message : 'Internal server error',
        timestamp: new Date(),
    });
});

// Initialize services
async function initializeServices() {
    // Initialize Database (first!)
    await initializeDatabase();

    // Initialize Redis (optional - graceful degradation)
    try {
        await createRedisClient();
        logger.info('✅ Redis client initialized');
    } catch (error) {
        logger.warn('⚠️  Redis not available - running without cache/queue (development mode)', { error: (error as Error).message });
    }

    // Initialize WebSocket (required)
    try {
        initializeWebSocket(io);
        logger.info('✅ WebSocket server initialized');
    } catch (error) {
        logger.error('❌ Failed to initialize WebSocket', { error });
        throw error;
    }

    // Initialize Queue (optional - graceful degradation)
    try {
        await initializeQueue();
        logger.info('✅ Queue service initialized');
    } catch (error) {
        logger.warn('⚠️  Queue service not available - events will process synchronously', { error: (error as Error).message });
    }

    logger.info('🚀 Services initialized (degraded mode OK for development)');
}

// Start server
async function startServer() {
    try {
        await initializeServices();

        httpServer.listen(config.server.port, config.server.host, () => {
            logger.info(
                `🚀 BRIS Backend listening on http://${config.server.host}:${config.server.port}`
            );
            logger.info(`📊 Environment: ${config.env}`);
            logger.info(`🔒 CORS enabled for: ${config.cors.origins.join(', ')}`);
        });
    } catch (error) {
        logger.error('Failed to start server', { error });
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    httpServer.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

// Start if not in test mode
if (require.main === module) {
    startServer();
}

export { app, io, httpServer };
export default app;
