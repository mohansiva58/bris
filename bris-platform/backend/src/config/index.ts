import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validate required environment variables
const required = [
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'ML_SERVICE_URL',
];

for (const key of required) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}

export const config = {
    // Environment
    env: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',

    // Server
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || '0.0.0.0',
    },

    // Database
    database: {
        url: process.env.DATABASE_URL!,
        max_connections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
        idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    },

    // Redis
    redis: {
        url: process.env.REDIS_URL!,
        password: process.env.REDIS_PASSWORD,
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET!,
        access_expiry: process.env.JWT_EXPIRY || '1h',
        refresh_expiry: process.env.JWT_REFRESH_EXPIRY || '7d',
        issuer: 'bris-platform',
    },

    // CORS
    cors: {
        origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
        credentials: true,
    },

    // ML Service
    ml: {
        service_url: process.env.ML_SERVICE_URL!,
        timeout: parseInt(process.env.ML_TIMEOUT || '5000', 10),
    },

    // n8n
    n8n: {
        webhook_url: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/risk-alert',
    },

    // Rate Limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    // Risk Thresholds
    risk: {
        high_threshold: parseInt(process.env.RISK_SCORE_HIGH_THRESHOLD || '75', 10),
        critical_threshold: parseInt(process.env.RISK_SCORE_CRITICAL_THRESHOLD || '90', 10),
    },

    // Event Processing
    events: {
        batch_size: parseInt(process.env.EVENT_BATCH_SIZE || '100', 10),
        batch_interval: parseInt(process.env.EVENT_BATCH_INTERVAL || '5000', 10),
        queue_concurrency: parseInt(process.env.EVENT_QUEUE_CONCURRENCY || '5', 10),
    },

    // Session
    session: {
        timeout_minutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10),
        inactivity_minutes: parseInt(process.env.SESSION_INACTIVITY_MINUTES || '15', 10),
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },

    // Feature Flags
    features: {
        enableSwagger: process.env.ENABLE_SWAGGER === 'true',
        enableMetrics: process.env.ENABLE_METRICS === 'true',
        enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
    },
};

export default config;
