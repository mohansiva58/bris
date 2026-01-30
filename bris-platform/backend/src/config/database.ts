import { Pool, PoolClient, QueryResult } from 'pg';
import config from './index';
import { logger } from '../utils/logger';

// Create PostgreSQL connection pool
export const pool = new Pool({
    connectionString: config.database.url,
    max: config.database.max_connections,
    idleTimeoutMillis: config.database.idle_timeout,
    connectionTimeoutMillis: 5000,
});

// Pool error handling
pool.on('error', (err) => {
    logger.error('Unexpected database pool error', { error: err });
});

pool.on('connect', () => {
    logger.debug('New database connection established');
});

pool.on('remove', () => {
    logger.debug('Database connection removed from pool');
});

// Query wrapper with logging
export async function query<T = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<T>> {
    const start = Date.now();

    try {
        const result = await pool.query<T>(text, params);
        const duration = Date.now() - start;

        if (config.features.enableDebugLogs) {
            logger.debug('Executed query', {
                text,
                duration,
                rows: result.rowCount,
            });
        }

        return result;
    } catch (error) {
        logger.error('Database query error', {
            text,
            params,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}

// Transaction wrapper
export async function transaction<T>(
    callback: (client: PoolClient) => Promise<T>
): Promise<T> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Transaction rolled back', {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    } finally {
        client.release();
    }
}

// Health check
export async function healthCheck(): Promise<boolean> {
    try {
        const result = await pool.query('SELECT NOW()');
        return result.rowCount != null && result.rowCount > 0;
    } catch (error) {
        logger.error('Database health check failed', { error });
        return false;
    }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
    try {
        await pool.end();
        logger.info('Database pool closed successfully');
    } catch (error) {
        logger.error('Error closing database pool', { error });
        throw error;
    }
}

// Helper: Check if database connection is alive
export async function ping(): Promise<number> {
    const start = Date.now();
    await pool.query('SELECT 1');
    return Date.now() - start;
}

// Export pool for direct access when needed
export default pool;
