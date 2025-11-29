/**
 * Authentication Middleware
 * 
 * TODO: Implement JWT verification
 * 
 * Related Flaw: Module 1 - No Real Authentication System (CRITICAL)
 * @see docs/FLAWS_AND_ISSUES.md
 */

// TODO: Uncomment when express and jsonwebtoken are installed
// import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';

type Request = any;
type Response = any;
type NextFunction = () => void;

const jwt = {
  verify: (_token: string, _secret: string): any => ({}),
};

interface AuthRequest extends Request {
  headers: { authorization?: string };
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  // TODO: Implement JWT verification
  // 1. Extract token from Authorization header
  // 2. Verify token
  // 3. Attach user to request
  // 4. Call next() or return 401
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      email: string;
      role: string;
    };
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
