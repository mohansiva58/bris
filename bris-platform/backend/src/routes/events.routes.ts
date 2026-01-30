import { Router } from 'express';
import { EventsController } from '../controllers/events.controller';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { eventLimiter } from '../middleware/ratelimit.middleware';

const router = Router();

// Event ingestion (allow both authenticated and API key auth)
router.post('/', eventLimiter, EventsController.ingest);

// Get user events (protected)
router.get('/:userId', authenticate, EventsController.getUserEvents);

export default router;
