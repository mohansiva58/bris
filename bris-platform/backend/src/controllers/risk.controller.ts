import { Response } from 'express';
import { AuthRequest } from '../types';
import { logger } from '../utils/logger';
import { query } from '../config/database';

export class RiskController {
    // GET /api/risk/:userId - Get risk scores for a user
    static async getUserRiskScores(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { limit = 50, session_id } = req.query;

            // Authorization check
            if (req.user?.role !== 'admin' && req.user?.id !== parseInt(userId)) {
                res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    timestamp: new Date(),
                });
                return;
            }

            let sql = 'SELECT * FROM risk_scores WHERE user_id = $1';
            const params: any[] = [userId];

            if (session_id) {
                sql += ' AND session_id = $2 ORDER BY timestamp DESC LIMIT $3';
                params.push(session_id, limit);
            } else {
                sql += ' ORDER BY timestamp DESC LIMIT $2';
                params.push(limit);
            }

            const result = await query(sql, params);

            res.json({
                success: true,
                data: result.rows,
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Error fetching risk scores', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }

    // GET /api/risk/recent - Get recent risk scores for all users
    static async getRecentRiskScores(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { limit = 50 } = req.query;

            const sql = 'SELECT * FROM risk_scores ORDER BY timestamp DESC LIMIT $1';
            const result = await query(sql, [limit]);

            res.json({
                success: true,
                data: result.rows,
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Error fetching recent risk scores', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }

    // GET /api/risk/alerts - Get recent alerts
    static async getAlerts(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { limit = 100, status, severity } = req.query;

            let sql = `
        SELECT a.*, u.email, u.full_name, r.risk_score, r.explanation
        FROM alerts a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN risk_scores r ON a.risk_score_id = r.id
        WHERE 1=1
      `;
            const params: any[] = [];
            let paramCount = 1;

            if (status) {
                sql += ` AND a.status = $${paramCount}`;
                params.push(status);
                paramCount++;
            }

            if (severity) {
                sql += ` AND a.severity = $${paramCount}`;
                params.push(severity);
                paramCount++;
            }

            sql += ` ORDER BY a.created_at DESC LIMIT $${paramCount}`;
            params.push(limit);

            const result = await query(sql, params);

            res.json({
                success: true,
                data: result.rows,
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Error fetching alerts', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }

    // GET /api/risk/dashboard - Get dashboard metrics
    static async getDashboardMetrics(_req: AuthRequest, res: Response): Promise<void> {
        try {
            logger.info('Calculating dashboard metrics...');

            // Debug: Check total counts first
            const totalEvents = await query('SELECT COUNT(*) FROM behavior_events');
            logger.info(`Total events in DB: ${totalEvents.rows[0].count}`);
            // Active users (sessions in last 30 minutes)
            const activeUsersResult = await query(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM behavior_events
        WHERE timestamp > NOW() - INTERVAL '30 minutes'
      `);

            // Events today
            const eventsTodayResult = await query(`
        SELECT COUNT(*) as count
        FROM behavior_events
        WHERE timestamp::date = CURRENT_DATE
      `);

            // Average risk score (last 24 hours)
            const avgRiskResult = await query(`
        SELECT AVG(risk_score) as avg_score
        FROM risk_scores
        WHERE timestamp > NOW() - INTERVAL '24 hours'
      `);

            // High risk alerts
            const highRiskAlertsResult = await query(`
        SELECT COUNT(*) as count
        FROM alerts
        WHERE severity IN ('high', 'critical')
        AND status = 'open'
      `);

            // Critical alerts
            const criticalAlertsResult = await query(`
        SELECT COUNT(*) as count
        FROM alerts
        WHERE severity = 'critical'
        AND status = 'open'
      `);

            const metrics = {
                active_users: parseInt(activeUsersResult.rows[0]?.count || '0'),
                total_events_today: parseInt(eventsTodayResult.rows[0]?.count || '0'),
                average_risk_score: parseFloat(avgRiskResult.rows[0]?.avg_score || '0'),
                high_risk_alerts: parseInt(highRiskAlertsResult.rows[0]?.count || '0'),
                critical_alerts: parseInt(criticalAlertsResult.rows[0]?.count || '0'),
                system_health: 'healthy',
            };

            logger.info('Dashboard metrics calculated', metrics);

            res.json({
                success: true,
                data: metrics,
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Error fetching dashboard metrics', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }

    //PATCH /api/risk/alerts/:id/status - Update alert status
    static async updateAlertStatus(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { status, resolution_notes } = req.body;

            const validStatuses = ['open', 'investigating', 'resolved', 'dismissed'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({
                    success: false,
                    error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                    timestamp: new Date(),
                });
                return;
            }

            const updateFields: string[] = ['status = $1', 'updated_at = NOW()'];
            const params: any[] = [status];
            let paramCount = 2;

            if (resolution_notes) {
                updateFields.push(`resolution_notes = $${paramCount}`);
                params.push(resolution_notes);
                paramCount++;
            }

            if (status === 'resolved') {
                updateFields.push(`resolved_at = NOW()`);
            }

            params.push(id);

            const result = await query(
                `UPDATE alerts SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
                params
            );

            if (result.rowCount === 0) {
                res.status(404).json({
                    success: false,
                    error: 'Alert not found',
                    timestamp: new Date(),
                });
                return;
            }

            logger.info('Alert status updated', { alertId: id, status });

            res.json({
                success: true,
                data: result.rows[0],
                message: 'Alert updated successfully',
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Error updating alert', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }
}

export default RiskController;
