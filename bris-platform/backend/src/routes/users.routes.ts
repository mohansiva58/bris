import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All user routes require admin role
router.use(authenticate);
router.use(authorize('admin'));

// Get all users
router.get('/', UsersController.getAllUsers);

// Update user status
router.patch('/:id/status', UsersController.updateUserStatus);

export default router;
