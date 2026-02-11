// server/lib/redis.ts
// Redis client singleton — for caching, sessions, and real-time data

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
        const delay = Math.min(times * 200, 2000);
        return delay;
    },
    lazyConnect: true,
});

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}

/**
 * Check Redis connection health
 */
export async function checkRedisHealth(): Promise<boolean> {
    try {
        const pong = await redis.ping();
        return pong === 'PONG';
    } catch {
        return false;
    }
}
