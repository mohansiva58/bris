import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { AuthRequest } from '../types';

let ioInstance: Server | null = null;

export function initializeWebSocket(io: Server): void {
    ioInstance = io;

    io.on('connection', (socket: Socket) => {
        logger.info('WebSocket client connected', { socketId: socket.id });

        // Join user-specific room
        socket.on('join-user-room', (userId: string) => {
            socket.join(`user-${userId}`);
            logger.debug('User joined room', { userId, socketId: socket.id });
        });

        // Join admin dashboard room
        socket.on('join-dashboard', () => {
            socket.join('dashboard');
            logger.debug('Client joined dashboard room', { socketId: socket.id });
        });

        // Leave room
        socket.on('leave-room', (room: string) => {
            socket.leave(room);
            logger.debug('Client left room', { room, socketId: socket.id });
        });

        // Handle ping
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: new Date() });
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            logger.info('WebSocket client disconnected', {
                socketId: socket.id,
                reason,
            });
        });

        // Error handling
        socket.on('error', (error) => {
            logger.error('WebSocket error', { socketId: socket.id, error });
        });
    });

    logger.info('WebSocket server initialized');
}

// Emit risk update to dashboard
export function emitRiskUpdate(data: {
    user_id: number;
    session_id: string;
    risk_score: number;
    severity: string;
    explanation?: string;
}): void {
    if (!ioInstance) {
        logger.warn('WebSocket not initialized, cannot emit risk update');
        return;
    }

    ioInstance.to('dashboard').emit('risk_update', {
        type: 'risk_update',
        data,
        timestamp: new Date(),
    });

    // Also emit to specific user room
    ioInstance.to(`user-${data.user_id}`).emit('risk_alert', {
        type: 'risk_alert',
        data,
        timestamp: new Date(),
    });

    logger.debug('Risk update emitted', { userId: data.user_id });
}

// Emit new alert
export function emitAlert(data: {
    id: number;
    user_id: number;
    severity: string;
    title: string;
    description?: string;
    risk_score: number;
}): void {
    if (!ioInstance) return;

    ioInstance.to('dashboard').emit('new_alert', {
        type: 'alert',
        data,
        timestamp: new Date(),
    });

    logger.debug('Alert emitted', { alertId: data.id });
}

// Emit user activity update
export function emitUserActivity(data: {
    active_users: number;
    high_risk_users: number;
    alerts_count: number;
}): void {
    if (!ioInstance) return;

    ioInstance.to('dashboard').emit('user_activity', {
        type: 'user_activity',
        data,
        timestamp: new Date(),
    });
}

// Emit system status
export function emitSystemStatus(data: {
    status: 'healthy' | 'degraded' | 'down';
    message?: string;
}): void {
    if (!ioInstance) return;

    ioInstance.emit('system_status', {
        type: 'system_status',
        data,
        timestamp: new Date(),
    });

    logger.info('System status emitted', { status: data.status });
}

// Get connected clients count
export function getConnectedClientsCount(): number {
    if (!ioInstance) return 0;
    return ioInstance.engine.clientsCount;
}

// Get rooms
export function getRooms(): Set<string> {
    if (!ioInstance) return new Set();
    return ioInstance.sockets.adapter.rooms;
}

export default {
    initializeWebSocket,
    emitRiskUpdate,
    emitAlert,
    emitUserActivity,
    emitSystemStatus,
    getConnectedClientsCount,
    getRooms,
};
