/**
 * AI Proxy Routes
 * 
 * TODO: Implement AI proxy endpoints
 * - POST /chat - Proxy chat requests to Gemini
 * - POST /questions - Generate assessment questions
 * - POST /evaluate - Evaluate creativity responses
 * 
 * Note: Run `cd server && npm install` first
 * 
 * Related Flaw: Module 2 - API Keys Exposed in Frontend (CRITICAL)
 * @see docs/FLAWS_AND_ISSUES.md
 */

// Uncomment after running: cd server && npm install
/*
import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Apply rate limiting to AI endpoints
router.use(rateLimit({
  windowMs: 60000, // 1 minute
  maxRequests: 20,
}));

// POST /api/ai/chat - Send chat message
router.post('/chat', aiController.chat);

// POST /api/ai/questions - Generate assessment questions
router.post('/questions', aiController.generateQuestions);

// POST /api/ai/evaluate - Evaluate creativity response
router.post('/evaluate', aiController.evaluateCreativity);

// POST /api/ai/validate-topic - Validate research topic
router.post('/validate-topic', aiController.validateTopic);

export default router;
*/

// Placeholder export
export const aiRoutes = { path: '/api/ai', status: 'not-installed' };
