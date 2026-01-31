import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthRequest, UserPayload, AuthenticationError, AuthorizationError } from '../types';
import { logger } from '../utils/logger';

// Verify JWT token
export function verifyToken(token: string): UserPayload {
    try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;

        return {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AuthenticationError('Token expired');
        } else if (error instanceof jwt.JsonWebTokenError) {
            throw new AuthenticationError('Invalid token');
        }
        throw new AuthenticationError('Token verification failed');
    }
}

// Authentication middleware
export async function authenticate(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('No token provided');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const user = verifyToken(token);

        // Attach user to request
        req.user = user;

        next();
    } catch (error: any) {
        if (error.statusCode === 401) {
            res.status(401).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        } else {
            logger.error('Authentication error', { error: error.message || error });
            res.status(500).json({
                success: false,
                error: 'Internal authentication error',
                timestamp: new Date(),
            });
        }
    }
}

// Authorization middleware - check user role
export function authorize(...allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        try {
            if (!req.user) {
                throw new AuthenticationError('User not authenticated');
            }

            if (!allowedRoles.includes(req.user.role)) {
                throw new AuthorizationError(
                    `Insufficient permissions. Required roles: ${allowedRoles.join(', ')}`
                );
            }

            next();
        } catch (error: any) {
            if (error.statusCode === 403) {
                res.status(403).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date(),
                });
            } else if (error.statusCode === 401) {
                res.status(401).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date(),
                });
            } else {
                logger.error('Authorization error', { error: error.message || error });
                res.status(500).json({
                    success: false,
                    error: 'Internal authorization error',
                    timestamp: new Date(),
                });
            }
        }
    };
}

// Optional authentication - doesn't fail if token is missing
export async function optionalAuth(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            req.user = verifyToken(token);
        }

        next();
    } catch (error) {
        // Log error but don't fail request
        logger.warn('Optional auth failed', { error });
        next();
    }
}

export function generateAccessToken(user: {
    id: number;
    email: string;
    role: string;
}): string {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            type: 'access',
        },
        config.jwt.secret as string,
        {
            expiresIn: config.jwt.access_expiry as any,
            issuer: config.jwt.issuer,
        }
    );
}

// Generate refresh token
export function generateRefreshToken(user: {
    id: number;
    email: string;
    role: string;
}): string {
    return jwt.sign(
        {
            userId: user.id,
            email: user.email,
            role: user.role,
            type: 'refresh',
        },
        config.jwt.secret as string,
        {
            expiresIn: config.jwt.refresh_expiry as any,
            issuer: config.jwt.issuer,
        }
    );
}

// Generate token pair
export function generateTokenPair(user: {
    id: number;
    email: string;
    role: string;
}): { accessToken: string; refreshToken: string } {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user),
    };
}

export default {
    authenticate,
    authorize,
    optionalAuth,
    verifyToken,
    generateAccessToken,
    generateRefreshToken,
    generateTokenPair,
};
