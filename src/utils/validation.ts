/**
 * Input Validation Utilities
 * 
 * TODO: Implement comprehensive input validation
 * - Sanitize user inputs
 * - Validate email formats
 * - Prevent XSS attacks
 * - Validate data schemas
 * 
 * Related Flaw: Module 7 - No Input Sanitization (CRITICAL)
 * @see docs/FLAWS_AND_ISSUES.md
 */

// Note: Install dompurify when ready: npm install dompurify @types/dompurify
// import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * TODO: Implement with DOMPurify when installed
 */
export const sanitizeHTML = (dirty: string): string => {
  // TODO: Use DOMPurify when installed
  // return DOMPurify.sanitize(dirty, {
  //   ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
  //   ALLOWED_ATTR: [],
  // });
  
  // Basic sanitization until DOMPurify is installed
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
};

/**
 * Sanitize plain text input
 */
export const sanitizeText = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate research topic
 */
export const validateResearchTopic = (topic: string): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} => {
  const sanitized = sanitizeText(topic);
  
  if (!sanitized || sanitized.length < 3) {
    return { isValid: false, sanitized, error: 'Topic must be at least 3 characters' };
  }
  
  if (sanitized.length > 200) {
    return { isValid: false, sanitized, error: 'Topic must be less than 200 characters' };
  }
  
  return { isValid: true, sanitized };
};

export default {
  sanitizeHTML,
  sanitizeText,
  isValidEmail,
  validatePassword,
  validateResearchTopic,
};
