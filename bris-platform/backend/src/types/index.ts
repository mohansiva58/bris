// ============================================
// TYPE DEFINITIONS FOR BRIS BACKEND
// ============================================

import { Request } from 'express';

// ============================================
// USER TYPES
// ============================================

export interface User {
    id: number;
    email: string;
    password_hash: string;
    full_name?: string;
    role: 'admin' | 'user' | 'analyst';
    status: 'active' | 'inactive' | 'locked';
    created_at: Date;
    updated_at: Date;
    last_login?: Date;
    metadata: Record<string, any>;
}

export interface UserPayload {
    id: number;
    email: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: UserPayload;
}

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    full_name?: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface JWTPayload {
    userId: number;
    email: string;
    role: string;
    type: 'access' | 'refresh';
}

// ============================================
// BEHAVIOR EVENT TYPES
// ============================================

export type EventType =
    | 'click'
    | 'scroll'
    | 'keypress'
    | 'navigation'
    | 'tab_switch'
    | 'copy'
    | 'paste'
    | 'focus_change'
    | 'mouse_move'
    | 'page_load'
    | 'page_unload'
    | 'form_submit'
    | 'download'
    | 'upload';

export interface BehaviorEvent {
    id?: number;
    user_id: number;
    session_id: string;
    event_type: EventType;
    event_data: Record<string, any>;
    timestamp: Date;
    device_fingerprint?: string;
    ip_address?: string;
    user_agent?: string;
    location?: GeoLocation;
}

export interface EventBatch {
    events: BehaviorEvent[];
    batch_id: string;
    received_at: Date;
}

export interface GeoLocation {
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
}

// ============================================
// FEATURE EXTRACTION TYPES
// ============================================

export interface BehavioralFeatures {
    // Interaction metrics
    click_frequency: number; // clicks per minute
    scroll_velocity: number; // pixels per second
    typing_speed: number; // characters per minute
    dwell_time: number; // seconds per page section

    // Anomaly indicators
    tab_switch_count: number;
    copy_paste_events: number;
    navigation_speed: number; // pages per minute

    // Pattern metrics
    mouse_trajectory_entropy: number;
    keystroke_dynamics: number[];
    session_duration: number; // minutes

    // Temporal features
    time_of_day: number; // 0-23
    day_of_week: number; // 0-6

    // Device features
    device_change: boolean;
    location_anomaly: boolean;

    // Session context
    event_count: number;
    unique_event_types: number;
    error_rate: number;
}

// ============================================
// RISK SCORE TYPES
// ============================================

export interface RiskScore {
    id?: number;
    user_id: number;
    session_id: string;
    risk_score: number; // 0-100
    confidence: number; // 0-1
    anomaly_type?: string;
    features: BehavioralFeatures;
    model_version?: string;
    explanation?: string;
    timestamp: Date;
    created_at?: Date;
}

export interface RiskPrediction {
    score: number;
    confidence: number;
    anomaly_type: string;
    contributing_factors: string[];
    recommendations: string[];
}

export interface MLPredictionRequest {
    features: BehavioralFeatures;
    user_id: number;
    session_id: string;
}

export interface MLPredictionResponse {
    risk_score: number;
    confidence: number;
    anomaly_type: string;
    model_version: string;
    processing_time_ms: number;
}

export interface ExplanationRequest {
    user_id: number;
    risk_score: number;
    features: BehavioralFeatures;
    anomaly_type: string;
}

export interface ExplanationResponse {
    explanation: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    generated_at: Date;
}

// ============================================
// ALERT TYPES
// ============================================

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export interface Alert {
    id?: number;
    user_id: number;
    risk_score_id: number;
    severity: AlertSeverity;
    status: AlertStatus;
    title: string;
    description?: string;
    assigned_to?: number;
    resolved_at?: Date;
    resolution_notes?: string;
    created_at: Date;
    updated_at?: Date;
}

export interface AlertCreate {
    user_id: number;
    risk_score_id: number;
    severity: AlertSeverity;
    title: string;
    description?: string;
}

// ============================================
// SESSION TYPES
// ============================================

export interface Session {
    id?: number;
    user_id: number;
    session_id: string;
    device_fingerprint?: string;
    ip_address?: string;
    user_agent?: string;
    location?: GeoLocation;
    started_at: Date;
    ended_at?: Date;
    last_activity: Date;
    event_count: number;
    is_active: boolean;
}

// ============================================
// WEBSOCKET TYPES
// ============================================

export interface WebSocketMessage {
    type: 'alert' | 'risk_update' | 'user_activity' | 'system_status';
    data: any;
    timestamp: Date;
}

export interface RiskUpdateMessage {
    user_id: number;
    session_id: string;
    risk_score: number;
    change: number; // delta from previous score
    severity: AlertSeverity;
}

export interface UserActivityMessage {
    active_users: number;
    high_risk_users: number;
    alerts_count: number;
    updated_at: Date;
}

// ============================================
// QUEUE JOB TYPES
// ============================================

export interface EventProcessingJob {
    events: BehaviorEvent[];
    batch_id: string;
    priority: number;
}

export interface RiskAssessmentJob {
    user_id: number;
    session_id: string;
    features: BehavioralFeatures;
    triggered_at: Date;
}

export interface WebhookTriggerJob {
    alert_id: number;
    risk_score: number;
    user_id: number;
    webhook_url: string;
    retry_count?: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: Date;
}

export interface PaginatedResponse<T = any> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
    timestamp: Date;
}

// ============================================
// CONFIGURATION TYPES
// ============================================

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    max_connections: number;
    idle_timeout: number;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    db: number;
    retry_strategy?: (times: number) => number;
}

export interface JWTConfig {
    secret: string;
    access_expiry: string;
    refresh_expiry: string;
    issuer: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface DashboardMetrics {
    active_users: number;
    total_events_today: number;
    average_risk_score: number;
    high_risk_alerts: number;
    critical_alerts: number;
    system_health: 'healthy' | 'degraded' | 'down';
}

export interface RiskTrend {
    timestamp: Date;
    avg_risk_score: number;
    max_risk_score: number;
    user_count: number;
}

export interface UserRiskHistory {
    user_id: number;
    email: string;
    risk_scores: Array<{
        timestamp: Date;
        score: number;
        session_id: string;
    }>;
    average_score: number;
    peak_score: number;
    alert_count: number;
}

// ============================================
// N8N WEBHOOK PAYLOAD
// ============================================

export interface N8NWebhookPayload {
    event_type: 'high_risk_alert' | 'critical_alert' | 'suspicious_activity';
    alert: Alert;
    risk_score: RiskScore;
    user: {
        id: number;
        email: string;
        full_name?: string;
    };
    explanation: string;
    recommended_actions: string[];
    triggered_at: Date;
}

// ============================================
// ERROR TYPES
// ============================================

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(400, message);
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication failed') {
        super(401, message);
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(403, message);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(404, message);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists') {
        super(409, message);
    }
}

export class InternalError extends AppError {
    constructor(message: string = 'Internal server error') {
        super(500, message);
    }
}
