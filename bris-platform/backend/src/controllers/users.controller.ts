import { Response } from 'express';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import { UserModel } from '../models/user.model';

export class UsersController {
    // GET /api/users - Get all users (admin only)
    static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { limit = 100, offset = 0 } = req.query;

            const users = await UserModel.findAll(
                parseInt(limit as string),
                parseInt(offset as string)
            );
            const total = await UserModel.count();

            res.json({
                success: true,
                data: users.map(u => ({
                    id: u.id,
                    email: u.email,
                    full_name: u.full_name,
                    role: u.role,
                    status: u.status,
                    created_at: u.created_at,
                    last_login: u.last_login,
                })),
                pagination: {
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string),
                    total,
                    total_pages: Math.ceil(total / parseInt(limit as string)),
                },
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Error fetching users', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }

    // PATCH /api/users/:id/status - Update user status (admin only)
    static async updateUserStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const validStatuses = ['active', 'inactive', 'locked'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                    timestamp: new Date(),
                });
            }

            const user = await UserModel.setStatus(parseInt(id), status);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found',
                    timestamp: new Date(),
                });
            }

            logger.info('User status updated', { userId: id, status });

            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    status: user.status,
                },
                message: 'User status updated successfully',
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Error updating user status', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }
}

export default UsersController;
