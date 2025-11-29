/**
 * Server Entry Point
 * 
 * Express server with middleware, routes, and Redis caching
 * for the Cognitive Load Analysis Platform.
 */

import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Placeholder routes (not yet implemented)
import { authRoutes } from './routes/auth';
import { sessionRoutes } from './routes/sessions';
import { assessmentRoutes } from './routes/assessments';
import { aiRoutes } from './routes/ai';
// Active routes
import biosignalRoutes from './routes/biosignal';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { getRedisClient, initRedis } from './services/redisService';

// Create stub routers for placeholder routes
const createStubRouter = (info: { path: string; status: string }) => {
  const router = Router();
  router.all('*', (req, res) => {
    res.status(501).json({
      error: 'Not Implemented',
      message: `${info.path} routes are not yet implemented`,
      status: info.status,
    });
  });
  return router;
};

const authRouter = createStubRouter(authRoutes);
const sessionRouter = createStubRouter(sessionRoutes);
const assessmentRouter = createStubRouter(assessmentRoutes);
const aiRouter = createStubRouter(aiRoutes);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Redis
initRedis().then(() => {
  console.log('✅ Redis initialized');
}).catch((err) => {
  console.warn('⚠️ Redis not available, caching disabled:', err.message);
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:*", "https://*.googleapis.com", "https://*.openai.com"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Participant-Id'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', async (req, res) => {
  const redis = getRedisClient();
  let redisStatus = 'disconnected';
  
  if (redis) {
    try {
      await redis.ping();
      redisStatus = 'connected';
    } catch {
      redisStatus = 'error';
    }
  }
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cognitive-load-api',
    version: '1.0.0',
    components: {
      redis: redisStatus,
      biosignalService: process.env.BIOSIGNAL_SERVICE_URL ? 'configured' : 'not-configured',
    },
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/assessments', assessmentRouter);
app.use('/api/ai', aiRouter);
app.use('/api/biosignal', biosignalRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🧠 Biosignal Service: ${process.env.BIOSIGNAL_SERVICE_URL || 'http://localhost:5000'}`);
});

export default app;
