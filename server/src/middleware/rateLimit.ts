/**
 * Rate Limiting Middleware
 * 
 * TODO: Implement request throttling
 * 
 * Related Flaw: Module 7 - No Rate Limiting (HIGH)
 * @see docs/FLAWS_AND_ISSUES.md
 */

// TODO: Uncomment when express is installed
// import { Request, Response, NextFunction } from 'express';

type Request = any;
type Response = any;
type NextFunction = () => void;

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

const requestCounts = new Map<string, RequestRecord>();

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
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter,
      });
    }
    
    record.count++;
    next();
  };
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
