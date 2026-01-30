import { Router } from 'express';
import { RiskController } from '../controllers/risk.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Get recent risk scores (all users) - Public or Optional Auth for Dashboards
router.get('/recent', optionalAuth, RiskController.getRecentRiskScores);

// All other risk routes require authentication
router.use(authenticate);

// Get user risk scores
router.get('/:userId', RiskController.getUserRiskScores);

// Get alerts (admin or analyst)
router.get('/alerts/list', authorize('admin', 'analyst'), RiskController.getAlerts);

// Get dashboard metrics (admin or analyst)
router.get('/dashboard/metrics', authorize('admin', 'analyst'), RiskController.getDashboardMetrics);

// Update alert status (admin or analyst)
router.patch('/alerts/:id/status', authorize('admin', 'analyst'), RiskController.updateAlertStatus);

export default router;
