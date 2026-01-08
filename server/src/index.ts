/**
 * Server Entry Point
 * 
 * Express server with Supabase database integration, authentication,
 * and API routes for the Cognitive Load Analysis Platform.
 * 
 * Phase 2: Database Integration Complete
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import sessionRoutes from './routes/sessions';
import assessmentRoutes from './routes/assessments';
import interactionRoutes from './routes/interactions';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { getRedisClient, initRedis } from './services/redisService';
import { checkDatabaseConnection } from './config/supabase';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const initializeServices = async () => {
  // Initialize Redis
  try {
    await initRedis();
    console.log('✅ Redis initialized');
  } catch (err: any) {
    console.warn('⚠️ Redis not available, caching disabled:', err.message);
  }
  
  // Check Supabase connection
  try {
    const isConnected = await checkDatabaseConnection();
    if (isConnected) {
      console.log('✅ Supabase database connected');
    } else {
      console.error('❌ Supabase database connection failed');
    }
  } catch (err: any) {
    console.error('❌ Database connection error:', err.message);
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://localhost:*", "https://*.googleapis.com", "https://*.openai.com", "https://*.supabase.co"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
  
  // Check database connection
  let databaseStatus = 'disconnected';
  try {
    const dbConnected = await checkDatabaseConnection();
    databaseStatus = dbConnected ? 'connected' : 'error';
  } catch {
    databaseStatus = 'error';
  }
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cognitive-load-api',
    version: '2.0.0', // Phase 2: Database Integration
    components: {
      database: databaseStatus,
      redis: redisStatus,
      behavioralService: process.env.BEHAVIORAL_SERVICE_URL ? 'configured' : 'not-configured',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/interactions', interactionRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`🧠 Behavioral Service: ${process.env.BEHAVIORAL_SERVICE_URL || 'http://localhost:8000'}`);
    console.log(`🗄️  Database: Supabase PostgreSQL`);
    console.log(`\n📍 API Endpoints:`);
    console.log(`   POST   /api/auth/signup`);
    console.log(`   POST   /api/auth/signin`);
    console.log(`   GET    /api/auth/me`);
    console.log(`   POST   /api/sessions`);
    console.log(`   GET    /api/sessions`);
    console.log(`   POST   /api/interactions/batch`);
    console.log(`   POST   /api/assessments/responses`);
    console.log(`   POST   /api/assessments/creativity`);
    console.log(`   POST   /api/assessments/cognitive-load`);
  });
};

startServer().catch(console.error);

export default app;
