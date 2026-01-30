import rateLimit from 'express-rate-limit';
import config from '../config';
import { logger } from '../utils/logger';

// General API rate limiter
export const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
        timestamp: new Date(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
        });
        res.status(429).json({
            success: false,
            error: 'Too many requests from this IP, please try again later.',
            timestamp: new Date(),
        });
    },
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        error: 'Too many authentication attempts, please try again later.',
        timestamp: new Date(),
    },
    skipSuccessfulRequests: true,
});

// Event ingestion rate limiter (higher limit)
export const eventLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 events per minute
    message: {
        success: false,
        error: 'Event rate limit exceeded.',
        timestamp: new Date(),
    },
});

export default {
    apiLimiter,
    authLimiter,
    eventLimiter,
};
