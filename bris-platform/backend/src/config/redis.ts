import { createClient, RedisClientType } from 'redis';
import config from './index';
import { logger } from '../utils/logger';

// Create Redis client
let redisClient: RedisClientType | null = null;

export async function createRedisClient(): Promise<RedisClientType | null> {
    if (redisClient) {
        return redisClient;
    }

    try {
        const client = createClient({
            url: config.redis.url,
            password: config.redis.password,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 5) {
                        return false; // Stop retrying
                    }
                    return Math.min(retries * 100, 1000);
                },
                connectTimeout: 5000,
            },
        });

        client.on('error', (err) => {
            // Log as warning since we're making it optional
            logger.warn('Redis connection issue (optional service)', { message: err.message });
        });

        await client.connect();
        redisClient = client as RedisClientType;
        return redisClient;
    } catch (error) {
        logger.warn('Redis not available, proceeding without it', { error: (error as Error).message });
        return null;
    }
}

// Get existing client (must call createRedisClient first)
export function getRedisClient(): RedisClientType {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call createRedisClient() first.');
    }
    return redisClient;
}

// Cache wrapper functions
export class RedisCache {
    private client: RedisClientType;

    constructor(client: RedisClientType) {
        this.client = client;
    }

    async get<T = any>(key: string): Promise<T | null> {
        try {
            const value = await this.client.get(key);
            if (!value) return null;
            return JSON.parse(value) as T;
        } catch (error) {
            logger.error('Redis get error', { key, error });
            return null;
        }
    }

    async set(
        key: string,
        value: any,
        ttlSeconds?: number
    ): Promise<boolean> {
        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, serialized);
            } else {
                await this.client.set(key, serialized);
            }
            return true;
        } catch (error) {
            logger.error('Redis set error', { key, error });
            return false;
        }
    }

    async del(key: string): Promise<boolean> {
        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Redis del error', { key, error });
            return false;
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            logger.error('Redis exists error', { key, error });
            return false;
        }
    }

    async incr(key: string): Promise<number> {
        try {
            return await this.client.incr(key);
        } catch (error) {
            logger.error('Redis incr error', { key, error });
            throw error;
        }
    }

    async expire(key: string, seconds: number): Promise<boolean> {
        try {
            return await this.client.expire(key, seconds);
        } catch (error) {
            logger.error('Redis expire error', { key, error });
            return false;
        }
    }

    async keys(pattern: string): Promise<string[]> {
        try {
            return await this.client.keys(pattern);
        } catch (error) {
            logger.error('Redis keys error', { pattern, error });
            return [];
        }
    }

    async flushPattern(pattern: string): Promise<number> {
        try {
            const keys = await this.keys(pattern);
            if (keys.length === 0) return 0;
            await this.client.del(keys);
            return keys.length;
        } catch (error) {
            logger.error('Redis flush pattern error', { pattern, error });
            return 0;
        }
    }

    // Pub/Sub methods
    async publish(channel: string, message: any): Promise<number> {
        try {
            const serialized = JSON.stringify(message);
            return await this.client.publish(channel, serialized);
        } catch (error) {
            logger.error('Redis publish error', { channel, error });
            return 0;
        }
    }

    async subscribe(
        channel: string,
        callback: (message: any) => void
    ): Promise<void> {
        try {
            const subscriber = this.client.duplicate();
            await subscriber.connect();

            await subscriber.subscribe(channel, (message) => {
                try {
                    const parsed = JSON.parse(message);
                    callback(parsed);
                } catch (error) {
                    logger.error('Error parsing Redis message', { channel, error });
                }
            });

            logger.info(`Subscribed to Redis channel: ${channel}`);
        } catch (error) {
            logger.error('Redis subscribe error', { channel, error });
            throw error;
        }
    }
}

// Health check
export async function healthCheck(): Promise<boolean> {
    try {
        if (!redisClient) return false;
        const pong = await redisClient.ping();
        return pong === 'PONG';
    } catch (error) {
        logger.error('Redis health check failed', { error });
        return false;
    }
}

// Close connection
export async function closeRedis(): Promise<void> {
    try {
        if (redisClient) {
            await redisClient.quit();
            redisClient = null;
            logger.info('Redis connection closed');
        }
    } catch (error) {
        logger.error('Error closing Redis connection', { error });
    }
}

export default {
    createRedisClient,
    getRedisClient,
    healthCheck,
    closeRedis,
    RedisCache,
};
