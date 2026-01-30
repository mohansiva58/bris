import { Response } from 'express';
import { AuthRequest, BehaviorEvent, ValidationError } from '../types';
import { logger } from '../utils/logger';
import { addEventProcessingJob } from '../services/queue.service';
import { v4 as uuidv4 } from 'uuid';

export class EventsController {
    // POST /api/events - Receive behavior events
    static async ingest(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { events, user_id, session_id } = req.body;

            // Validation
            if (!events || !Array.isArray(events) || events.length === 0) {
                throw new ValidationError('Events array is required and must not be empty');
            }

            if (!user_id) {
                throw new ValidationError('user_id is required');
            }

            if (!session_id) {
                throw new ValidationError('session_id is required');
            }

            // Validate event structure
            const validatedEvents: BehaviorEvent[] = events.map((event: any) => {
                if (!event.event_type) {
                    throw new ValidationError('event_type is required for all events');
                }

                return {
                    user_id: parseInt(user_id),
                    session_id,
                    event_type: event.event_type,
                    event_data: event.event_data || {},
                    timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
                    device_fingerprint: event.device_fingerprint,
                    ip_address: req.ip || req.headers['x-forwarded-for'] as string,
                    user_agent: req.headers['user-agent'],
                    location: event.location,
                };
            });

            // Add to processing queue
            const batchId = uuidv4();
            await addEventProcessingJob({
                events: validatedEvents,
                batch_id: batchId,
                priority: 1,
            });

            logger.info('Events queued for processing', {
                batchId,
                eventCount: validatedEvents.length,
                userId: user_id,
                sessionId: session_id,
            });

            res.status(202).json({
                success: true,
                data: {
                    batch_id: batchId,
                    queued_events: validatedEvents.length,
                },
                message: 'Events accepted for processing',
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Event ingestion error', { error: error.message });
            res.status(error.statusCode || 500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }

    // GET /api/events/:userId - Get events for a user
    static async getUserEvents(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { userId } = req.params;
            const { limit = 100, offset = 0, session_id, event_type } = req.query;

            // Authorization check
            if (req.user?.role !== 'admin' && req.user?.id !== parseInt(userId)) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions',
                    timestamp: new Date(),
                });
            }

            // Build query
            let sql = 'SELECT * FROM behavior_events WHERE user_id = $1';
            const params: any[] = [userId];
            let paramCount = 2;

            if (session_id) {
                sql += ` AND session_id = $${paramCount}`;
                params.push(session_id);
                paramCount++;
            }

            if (event_type) {
                sql += ` AND event_type = $${paramCount}`;
                params.push(event_type);
                paramCount++;
            }

            sql += ` ORDER BY timestamp DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const { query: dbQuery } = await import('../config/database');
            const result = await dbQuery(sql, params);

            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string),
                    total: result.rowCount || 0,
                },
                timestamp: new Date(),
            });
        } catch (error: any) {
            logger.error('Error fetching user events', { error: error.message });
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }
}

export default EventsController;
