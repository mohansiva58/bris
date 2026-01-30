import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { generateTokenPair } from '../middleware/auth.middleware';
import { AuthenticationError, ValidationError, ConflictError } from '../types';
import { logger } from '../utils/logger';

export class AuthController {
    // POST /api/auth/register
    static async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password, full_name } = req.body;

            // Validation
            if (!email || !password) {
                throw new ValidationError('Email and password are required');
            }

            if (password.length < 8) {
                throw new ValidationError('Password must be at least 8 characters');
            }

            // Check if user exists
            const existingUser = await UserModel.findByEmail(email);
            if (existingUser) {
                throw new ConflictError('User with this email already exists');
            }

            // Create user
            const user = await UserModel.create({
                email,
                password,
                full_name,
            });

            // Generate tokens
            const tokens = generateTokenPair({
                id: user.id!,
                email: user.email,
                role: user.role,
            });

            logger.info('User registered', { userId: user.id, email: user.email });

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        full_name: user.full_name,
                        role: user.role,
                    },
                    ...tokens,
                },
                message: 'Registration successful',
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Registration error', { error: error.message });
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }

    // POST /api/auth/login
    static async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;

            // Validation
            if (!email || !password) {
                throw new ValidationError('Email and password are required');
            }

            // Find user
            logger.info('Login attempt', { email });
            const user = await UserModel.findByEmail(email);
            if (!user) {
                logger.warn('Login failed: User not found', { email });
                throw new AuthenticationError('Invalid credentials');
            }

            // Check if account is locked
            if (user.status === 'locked') {
                throw new AuthenticationError('Account is locked. Please contact support.');
            }

            if (user.status === 'inactive') {
                throw new AuthenticationError('Account is inactive');
            }

            // Verify password
            const isValidPassword = await UserModel.verifyPassword(user, password);
            if (!isValidPassword) {
                logger.warn('Login failed: Invalid password', { email });
                throw new AuthenticationError('Invalid credentials');
            }

            logger.info('Login successful', { email });

            // Update last login
            await UserModel.updateLastLogin(user.id!);

            // Generate tokens
            const tokens = generateTokenPair({
                id: user.id!,
                email: user.email,
                role: user.role,
            });

            logger.info('User logged in', { userId: user.id, email: user.email });

            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        full_name: user.full_name,
                        role: user.role,
                    },
                    ...tokens,
                },
                message: 'Login successful',
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Login error', { error: error.message });
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }

    // POST /api/auth/logout
    static async logout(req: Request, res: Response): Promise<void> {
        // In production, invalidate refresh token in Redis
        res.json({
            success: true,
            message: 'Logout successful',
            timestamp: new Date(),
        });
    }

    // GET /api/auth/me
    static async getProfile(req: any, res: Response): Promise<void> {
        try {
            const user = await UserModel.findById(req.user.id);

            if (!user) {
                throw new AuthenticationError('User not found');
            }

            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role,
                    status: user.status,
                    last_login: user.last_login,
                },
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Get profile error', { error: error.message });
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }
}

export default AuthController;
