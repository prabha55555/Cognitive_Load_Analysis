/**
 * Redis Service
 * 
 * Provides Redis caching functionality for the API.
 */

import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

/**
 * Initialize Redis connection
 */
export async function initRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  
  // Skip Redis if not configured
  if (!redisUrl) {
    console.log('⚠️ Redis URL not configured, caching disabled');
    redisClient = null;
    return;
  }
  
  try {
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err: Error) => {
      console.error('Redis error:', err.message);
    });
    
    redisClient.on('connect', () => {
      console.log('Redis connected');
    });
    
    await redisClient.connect();
  } catch (error) {
    console.warn('Failed to connect to Redis:', error);
    redisClient = null;
    throw error;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType | null {
  return redisClient;
}

/**
 * Set value in cache with expiration
 */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<boolean> {
  if (!redisClient) return false;
  
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

/**
 * Get value from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redisClient) return null;
  
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) as T : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!redisClient) return false;
  
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Clear all keys matching a pattern
 */
export async function clearCachePattern(pattern: string): Promise<number> {
  if (!redisClient) return 0;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    return keys.length;
  } catch (error) {
    console.error('Cache clear error:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  keyCount: number;
  memoryUsage: string;
}> {
  if (!redisClient) {
    return { connected: false, keyCount: 0, memoryUsage: '0' };
  }
  
  try {
    const info = await redisClient.info('memory');
    const keyCount = await redisClient.dbSize();
    
    // Parse memory usage from info string
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const memoryUsage = memoryMatch ? memoryMatch[1] : 'unknown';
    
    return {
      connected: true,
      keyCount,
      memoryUsage,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return { connected: false, keyCount: 0, memoryUsage: '0' };
  }
}
