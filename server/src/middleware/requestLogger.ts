/**
 * Request Logger Middleware
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Log incoming requests
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  
  // Log request
  console.log(`→ ${req.method} ${req.path}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = status >= 500 ? '🔴' : status >= 400 ? '🟡' : '🟢';
    
    console.log(`← ${statusColor} ${req.method} ${req.path} ${status} (${duration}ms)`);
  });
  
  next();
}
