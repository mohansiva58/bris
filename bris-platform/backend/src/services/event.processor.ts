import axios from 'axios';
import { query } from '../config/database';
import config from '../config';
import { logger } from '../utils/logger';
import {
    EventProcessingJob,
    BehaviorEvent,
    BehavioralFeatures,
    RiskScore,
    Alert,
} from '../types';
import { emitRiskUpdate, emitAlert, emitUserActivity } from './websocket.service';
import { addWebhookTriggerJob } from './queue.service';

// Process batch of events
export async function processEventBatch(job: EventProcessingJob): Promise<void> {
    try {
        const { events, batch_id } = job;

        if (!events || events.length === 0) {
            logger.warn('Empty event batch received', { batch_id });
            return;
        }

        logger.info(`Processing ${events.length} events`, { batch_id });

        // 1. Store events in database
        await storeEvents(events);

        // 2. Group events by user and session
        const sessionGroups = groupEventsBySession(events);

        // 3. Process each session
        for (const [sessionKey, sessionEvents] of Object.entries(sessionGroups)) {
            const [userId, sessionId] = sessionKey.split('::');

            // FETCH ALL EVENTS FOR THIS SESSION TO CALCULATE CUMULATIVE FEATURES
            // This ensures we remember past tab switches, copy-pastes, etc.
            const sessionHistoryRes = await query(
                'SELECT * FROM behavior_events WHERE session_id = $1 ORDER BY timestamp ASC LIMIT 1000',
                [sessionId]
            );

            const allSessionEvents = sessionHistoryRes.rows.map(row => ({
                ...row,
                event_data: typeof row.event_data === 'string' ? JSON.parse(row.event_data) : row.event_data
            }));

            // Extract features from ALL session events
            const features = extractFeatures(allSessionEvents as BehaviorEvent[]);

            // Call ML service for prediction
            const prediction = await callMLService({
                features,
                user_id: parseInt(userId),
                session_id: sessionId,
            });

            // Store risk score
            const riskScore = await storeRiskScore({
                user_id: parseInt(userId),
                session_id: sessionId,
                risk_score: prediction.risk_score,
                confidence: prediction.confidence,
                anomaly_type: prediction.anomaly_type,
                features,
                model_version: prediction.model_version,
                explanation: prediction.explanation,
                timestamp: new Date(),
            });

            // Emit real-time update
            emitRiskUpdate({
                user_id: parseInt(userId),
                session_id: sessionId,
                risk_score: prediction.risk_score,
                severity: getRiskSeverity(prediction.risk_score),
                explanation: prediction.explanation,
                features: features,
            });

            // Update dashboard metrics (broadcast to all admins)
            const [activeUsersRes, alertCountRes, totalEventsRes, avgRiskRes] = await Promise.all([
                query('SELECT COUNT(DISTINCT user_id) as count FROM behavior_events WHERE timestamp > NOW() - INTERVAL \'30 minutes\''),
                query('SELECT COUNT(*) as count FROM alerts WHERE status = \'open\''),
                query('SELECT COUNT(*) as count FROM behavior_events WHERE timestamp::date = CURRENT_DATE'),
                query('SELECT AVG(risk_score) as avg_score FROM risk_scores WHERE timestamp > NOW() - INTERVAL \'24 hours\'')
            ]);

            emitUserActivity({
                active_users: parseInt(activeUsersRes.rows[0].count),
                high_risk_users: 0,
                alerts_count: parseInt(alertCountRes.rows[0].count),
                total_events_today: parseInt(totalEventsRes.rows[0].count),
                average_risk_score: parseFloat(avgRiskRes.rows[0].avg_score || '0')
            } as any);

            // Check if risk exceeds threshold
            if (prediction.risk_score >= config.risk.high_threshold) {
                await handleHighRiskScore(riskScore);
            }
        }

        logger.info('Event batch processed successfully', { batch_id });
    } catch (error) {
        logger.error('Error processing event batch', { error });
        throw error;
    }
}

// Store events in database
async function storeEvents(events: BehaviorEvent[]): Promise<void> {
    const values: any[] = [];
    const placeholders: string[] = [];

    events.forEach((event, index) => {
        const offset = index * 8;
        placeholders.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`
        );
        values.push(
            event.user_id,
            event.session_id,
            event.event_type,
            JSON.stringify(event.event_data),
            event.timestamp,
            event.device_fingerprint || null,
            event.ip_address || null,
            event.user_agent || null
        );
    });

    const sql = `
    INSERT INTO behavior_events 
    (user_id, session_id, event_type, event_data, timestamp, device_fingerprint, ip_address, user_agent)
    VALUES ${placeholders.join(', ')}
  `;

    await query(sql, values);
    logger.debug(`Stored ${events.length} events in database`);
}

// Group events by session
function groupEventsBySession(events: BehaviorEvent[]): Record<string, BehaviorEvent[]> {
    return events.reduce((acc, event) => {
        const key = `${event.user_id}::${event.session_id}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
    }, {} as Record<string, BehaviorEvent[]>);
}

// Extract behavioral features from events
export function extractFeatures(events: BehaviorEvent[]): BehavioralFeatures {
    if (events.length === 0) {
        return getDefaultFeatures();
    }

    // Sort events by timestamp
    const sortedEvents = events.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const firstEvent = sortedEvents[0];
    const lastEvent = sortedEvents[sortedEvents.length - 1];
    const sessionDuration = (new Date(lastEvent.timestamp).getTime() -
        new Date(firstEvent.timestamp).getTime()) / 1000 / 60; // minutes

    // Count event types
    const eventCounts = events.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calculate metrics
    const clickCount = eventCounts['mouse_click'] || 0;
    const scrollCount = eventCounts['scroll'] || 0;
    const tabSwitchCount = eventCounts['tab_visible'] || 0;
    const copyCount = eventCounts['clipboard_copy'] || 0;
    const pasteCount = eventCounts['clipboard_paste'] || 0;
    const keypressCount = eventCounts['keyboard_down'] || 0;

    // Time-based calculations
    const durationMinutes = Math.max(sessionDuration, 0.1); // Avoid division by zero
    const clickFrequency = clickCount / durationMinutes;
    const typingSpeed = keypressCount / durationMinutes;

    // Get time of day (0-23)
    const timeOfDay = new Date(firstEvent.timestamp).getHours();
    const dayOfWeek = new Date(firstEvent.timestamp).getDay();

    // Check for device/location anomalies
    const uniqueDevices = new Set(events.map(e => e.device_fingerprint).filter(Boolean)).size;
    const deviceChange = uniqueDevices > 1;

    const uniqueIPs = new Set(events.map(e => e.ip_address).filter(Boolean)).size;
    const locationAnomaly = uniqueIPs > 1;

    return {
        click_frequency: clickFrequency,
        scroll_velocity: scrollCount / durationMinutes,
        typing_speed: typingSpeed,
        dwell_time: sessionDuration / Math.max(eventCounts['page_load'] || 1, 1),
        tab_switch_count: tabSwitchCount,
        copy_paste_events: copyCount + pasteCount,
        navigation_speed: (eventCounts['navigation'] || 0) / durationMinutes,
        mouse_trajectory_entropy: calculateEntropy(events.filter(e => e.event_type === 'mouse_move')),
        keystroke_dynamics: [typingSpeed], // Simplified, would analyze timing patterns
        session_duration: sessionDuration,
        time_of_day: timeOfDay,
        day_of_week: dayOfWeek,
        device_change: deviceChange,
        location_anomaly: locationAnomaly,
        event_count: events.length,
        unique_event_types: Object.keys(eventCounts).length,
        error_rate: 0, // Would calculate from error events
        click_count: clickCount,
        scroll_count: scrollCount,
        keypress_count: keypressCount,
        tab_switch_count_raw: tabSwitchCount,
        copy_count: copyCount,
        paste_count: pasteCount,
    };
}

// Calculate entropy (simplified)
function calculateEntropy(events: BehaviorEvent[]): number {
    if (events.length < 2) return 0;

    // Simplified entropy calculation
    // In production, would analyze mouse movement patterns
    return Math.min(1, events.length / 100);
}

// Get default features
function getDefaultFeatures(): BehavioralFeatures {
    return {
        click_frequency: 0,
        scroll_velocity: 0,
        typing_speed: 0,
        dwell_time: 0,
        tab_switch_count: 0,
        copy_paste_events: 0,
        navigation_speed: 0,
        mouse_trajectory_entropy: 0,
        keystroke_dynamics: [0],
        session_duration: 0,
        time_of_day: 0,
        day_of_week: 0,
        device_change: false,
        location_anomaly: false,
        event_count: 0,
        unique_event_types: 0,
        error_rate: 0,
        click_count: 0,
        scroll_count: 0,
        keypress_count: 0,
        tab_switch_count_raw: 0,
        copy_count: 0,
        paste_count: 0,
    };
}

// Call ML service for prediction
async function callMLService(data: {
    features: BehavioralFeatures;
    user_id: number;
    session_id: string;
}): Promise<{
    risk_score: number;
    confidence: number;
    anomaly_type: string;
    model_version: string;
    explanation?: string;
}> {
    try {
        const response = await axios.post(
            `${config.ml.service_url}/predict`,
            data,
            {
                timeout: config.ml.timeout,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        logger.error('ML service call failed', { error });

        // Fallback: Calculate basic risk score
        return {
            risk_score: calculateFallbackRiskScore(data.features),
            confidence: 0.5,
            anomaly_type: 'unknown',
            model_version: 'fallback-1.0',
            explanation: 'Risk calculated using fallback method',
        };
    }
}

// Fallback risk calculation
function calculateFallbackRiskScore(features: BehavioralFeatures): number {
    let score = 0;

    // Tab switching penalty (High priority)
    if (features.tab_switch_count > 0) {
        score += Math.min(features.tab_switch_count * 20, 60);
    }

    // Copy-paste penalty (High priority)
    if (features.copy_paste_events > 0) {
        score += Math.min(features.copy_paste_events * 15, 40);
    }

    // Typing speed anomaly
    if (features.typing_speed > 150) {
        score += 15;
    }

    // Unusual time penalty
    if (features.time_of_day < 6 || features.time_of_day > 22) {
        score += 10;
    }

    // Device/location change penalty
    if (features.device_change) score += 15;
    if (features.location_anomaly) score += 15;

    return Math.min(score, 100);
}

// Store risk score in database
async function storeRiskScore(riskScore: Omit<RiskScore, 'id' | 'created_at'>): Promise<RiskScore> {
    const result = await query<RiskScore>(
        `INSERT INTO risk_scores 
    (user_id, session_id, risk_score, confidence, anomaly_type, features, model_version, explanation, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
        [
            riskScore.user_id,
            riskScore.session_id,
            riskScore.risk_score,
            riskScore.confidence,
            riskScore.anomaly_type || null,
            JSON.stringify(riskScore.features),
            riskScore.model_version || null,
            riskScore.explanation || null,
            riskScore.timestamp,
        ]
    );

    return result.rows[0];
}

// Handle high risk score
async function handleHighRiskScore(riskScore: RiskScore): Promise<void> {
    const severity = getRiskSeverity(riskScore.risk_score);

    // Create alert
    const alert = await createAlert({
        user_id: riskScore.user_id,
        risk_score_id: riskScore.id!,
        severity,
        title: `High Risk Detected: Score ${riskScore.risk_score}`,
        description: riskScore.explanation || 'Suspicious behavior pattern detected',
    });

    // Emit alert via WebSocket
    emitAlert({
        id: alert.id!,
        user_id: alert.user_id,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        risk_score: riskScore.risk_score,
    });

    // Trigger n8n webhook for critical alerts
    if (severity === 'critical') {
        await addWebhookTriggerJob({
            alert_id: alert.id!,
            risk_score: riskScore.risk_score,
            user_id: riskScore.user_id,
            webhook_url: config.n8n.webhook_url,
        });
    }

    logger.info('High risk alert created', {
        alertId: alert.id,
        userId: riskScore.user_id,
        score: riskScore.risk_score,
    });
}

// Create alert
async function createAlert(alert: {
    user_id: number;
    risk_score_id: number;
    severity: string;
    title: string;
    description?: string;
}): Promise<Alert> {
    const result = await query<Alert>(
        `INSERT INTO alerts (user_id, risk_score_id, severity, title, description)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
        [alert.user_id, alert.risk_score_id, alert.severity, alert.title, alert.description || null]
    );

    return result.rows[0];
}

// Get risk severity level
function getRiskSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 90) return 'critical';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
}

export default {
    processEventBatch,
    extractFeatures,
};
