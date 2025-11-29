/**
 * Request Validation Middleware
 * 
 * TODO: Implement Zod-based validation
 * 
 * Note: Run `cd server && npm install` first
 * 
 * Related Flaw: Module 7 - No Input Sanitization (CRITICAL)
 * @see docs/FLAWS_AND_ISSUES.md
 */

// Uncomment after running: cd server && npm install
// import { Request, Response, NextFunction } from 'express';
// import { ZodSchema } from 'zod';

// Placeholder types
type Request = { body: unknown };
type Response = { status: (code: number) => { json: (data: unknown) => void } };
type NextFunction = () => void;
type ZodSchema = { parse: (data: unknown) => unknown };

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessage,
      });
    }
  };
};
