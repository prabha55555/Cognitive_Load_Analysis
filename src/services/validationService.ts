/**
 * Response Validation Service
 * 
 * TODO: Implement schema validation for API responses
 * - Validate JSON structure
 * - Type checking
 * - Schema validation with Zod (install: npm install zod)
 * 
 * Related Flaw: Module 2 - JSON Parsing Vulnerabilities (MEDIUM)
 * @see docs/FLAWS_AND_ISSUES.md
 */

// Note: Install zod when ready: npm install zod
// import { z, ZodSchema } from 'zod';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errorHandler';

// Placeholder types until Zod is installed
type ZodSchema<T> = {
  safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { errors: Array<{ path: string[]; message: string }> } };
};

// TODO: Define typed schemas for API responses when Zod is installed
// These will be used for:
// - Question schema (id, text, options, correctAnswer, explanation, difficulty)
// - CreativityEvaluation schema (fluency, flexibility, originality, elaboration, feedback)
// - ChatResponse schema (message, sources, confidence)

/**
 * Safely parse JSON with error handling
 */
export const safeJsonParse = <T>(text: string, fallback?: T): T | null => {
  try {
    // Clean common JSON issues from AI responses
    let cleanText = text.trim();
    
    // Remove markdown code blocks
    cleanText = cleanText.replace(/```json\s*/gi, '');
    cleanText = cleanText.replace(/```\s*/g, '');
    
    // Try to extract JSON from text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    return JSON.parse(cleanText) as T;
  } catch (error) {
    logger.warn('JSON parse failed:', error);
    return fallback ?? null;
  }
};

/**
 * Validate data against schema
 * TODO: Implement with Zod when installed
 */
export const validateSchema = <T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(
    (err: { path: string[]; message: string }) => `${err.path.join('.')}: ${err.message}`
  );
  
  return { success: false, errors };
};

/**
 * Parse and validate API response
 * TODO: Implement with Zod when installed
 */
export const parseAndValidate = <T>(
  text: string,
  schema: ZodSchema<T>
): T => {
  const parsed = safeJsonParse<T>(text);
  
  if (parsed === null) {
    throw new ValidationError('Failed to parse response as JSON');
  }
  
  const validation = validateSchema<T>(schema, parsed);
  
  if (!validation.success) {
    throw new ValidationError(
      'Response validation failed',
      { validation: validation.errors.join('; ') }
    );
  }
  
  return validation.data;
};

// TODO: Define schemas when Zod is installed
// - QuestionSchema
// - QuestionsArraySchema
// - CreativityEvaluationSchema
// - ChatResponseSchema

export default {
  safeJsonParse,
  validateSchema,
  parseAndValidate,
};
