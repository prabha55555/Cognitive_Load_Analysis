/**
 * Authentication Validators
 * 
 * Zod schemas for auth request validation
 * 
 * TODO: Uncomment when zod is installed
 */

// import { z } from 'zod';

// Placeholder until zod is installed
const z = {
  object: (_schema: any) => ({ optional: () => ({ default: (_v: any) => ({}) }) }),
  string: () => ({
    email: (_msg: string) => ({}),
    min: (_n: number, _msg?: string) => ({
      regex: (_r: RegExp, _m: string) => ({
        regex: (_r2: RegExp, _m2: string) => ({
          regex: (_r3: RegExp, _m3: string) => ({}),
        }),
      }),
    }),
  }),
  enum: (_values: string[]) => ({ optional: () => ({ default: (_v: string) => ({}) }) }),
};

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['participant', 'admin']).optional().default('participant'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
