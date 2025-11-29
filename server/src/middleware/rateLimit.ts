/**
 * Rate Limiting Middleware
 * 
 * Implements request throttling to prevent abuse
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RequestRecord>();

/**
 * Create rate limiting middleware with configurable options
 */
export const rateLimit = (options: RateLimitOptions) => {
  const { windowMs, maxRequests } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP + user ID as key
    const key = `${req.ip}-${(req as any).user?.id || 'anonymous'}`;
    const now = Date.now();
    
    let record = requestCounts.get(key);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requestCounts.set(key, record);
      return next();
    }
    
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter,
      });
    }
    
    record.count++;
    next();
  };
};

/**
 * Convenience wrapper for creating rate limit middleware
 * @param maxRequests Maximum requests allowed in window
 * @param windowSeconds Window duration in seconds
 */
export const rateLimitMiddleware = (maxRequests: number, windowSeconds: number) => {
  return rateLimit({
    windowMs: windowSeconds * 1000,
    maxRequests,
  });
};

// Cleanup old records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute
