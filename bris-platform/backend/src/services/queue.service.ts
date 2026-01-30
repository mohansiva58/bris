import Bull, { Queue, Job } from 'bull';
import config from '../config';
import { logger } from '../utils/logger';
import { EventProcessingJob, RiskAssessmentJob, WebhookTriggerJob } from '../types';
import { processEventBatch } from './event.processor';
import { healthCheck as checkRedisHealth } from '../config/redis';

// Create queues
let eventQueue: Queue<EventProcessingJob> | null = null;
let riskQueue: Queue<RiskAssessmentJob> | null = null;
let webhookQueue: Queue<WebhookTriggerJob> | null = null;

export async function initializeQueue(): Promise<void> {
    try {
        // Check if Redis is available
        const isRedisAvailable = await checkRedisHealth();
        if (!isRedisAvailable) {
            logger.warn('⚠️  Redis not available - Skipping Queue initialization. Events will be processed synchronously.');
            return;
        }

        // Event processing queue
        eventQueue = new Bull<EventProcessingJob>('event-processing', config.redis.url, {
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        });

        // Risk assessment queue
        riskQueue = new Bull<RiskAssessmentJob>('risk-assessment', config.redis.url, {
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: 100,
                removeOnFail: 500,
            },
        });

        // Webhook trigger queue
        webhookQueue = new Bull<WebhookTriggerJob>('webhook-trigger', config.redis.url, {
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 3000,
                },
                removeOnComplete: 50,
                removeOnFail: 200,
            },
        });

        // Process event queue
        eventQueue.process(config.events.queue_concurrency, async (job: Job<EventProcessingJob>) => {
            logger.debug('Processing event batch', { batchId: job.data.batch_id });
            await processEventBatch(job.data);
            logger.debug('Event batch processed', { batchId: job.data.batch_id });
        });

        // Process risk assessment queue
        riskQueue.process(config.events.queue_concurrency, async (job: Job<RiskAssessmentJob>) => {
            logger.debug('Processing risk assessment', { userId: job.data.user_id });
        });

        // Process webhook queue
        webhookQueue.process(async (job: Job<WebhookTriggerJob>) => {
            logger.debug('Triggering webhook', { alertId: job.data.alert_id });
        });

        // Event listeners
        setupQueueEventListeners(eventQueue!, 'event-processing');
        setupQueueEventListeners(riskQueue!, 'risk-assessment');
        setupQueueEventListeners(webhookQueue!, 'webhook-trigger');

        logger.info('✅ Queue service initialized successfully');
    } catch (error) {
        logger.error('❌ Failed to initialize queue service', { error });
        // Don't throw, allow server to run without queues
    }
}

function setupQueueEventListeners(queue: Queue, name: string): void {
    queue.on('error', (error) => {
        logger.error(`Queue error (${name})`, { error });
    });

    queue.on('failed', (job, error) => {
        logger.error(`Job failed (${name})`, {
            jobId: job?.id,
            error: error.message,
        });
    });
}

export function getEventQueue(): Queue<EventProcessingJob> | null {
    return eventQueue;
}

export function getRiskQueue(): Queue<RiskAssessmentJob> | null {
    return riskQueue;
}

export function getWebhookQueue(): Queue<WebhookTriggerJob> | null {
    return webhookQueue;
}

export async function addEventProcessingJob(job: EventProcessingJob): Promise<void> {
    if (!eventQueue) {
        // Fallback to synchronous processing
        await processEventBatch(job);
        return;
    }
    await eventQueue.add(job, {
        priority: job.priority || 1,
    });
}

export async function addRiskAssessmentJob(job: RiskAssessmentJob): Promise<void> {
    if (!riskQueue) return;
    await riskQueue.add(job);
}

export async function addWebhookTriggerJob(job: WebhookTriggerJob): Promise<void> {
    if (!webhookQueue) return;
    await webhookQueue.add(job);
}

export async function getQueueStats() {
    if (!eventQueue || !riskQueue || !webhookQueue) {
        return { message: 'Queues not initialized' };
    }

    const [
        eventCounts,
        riskCounts,
        webhookCounts,
    ] = await Promise.all([
        eventQueue.getJobCounts(),
        riskQueue.getJobCounts(),
        webhookQueue.getJobCounts(),
    ]);

    return {
        eventProcessing: eventCounts,
        riskAssessment: riskCounts,
        webhookTrigger: webhookCounts,
    };
}

export default {
    initializeQueue,
    getEventQueue,
    getRiskQueue,
    getWebhookQueue,
    addEventProcessingJob,
    addRiskAssessmentJob,
    addWebhookTriggerJob,
    getQueueStats,
};
