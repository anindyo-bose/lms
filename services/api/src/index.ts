/**
 * API Service - Main Entry Point
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { createCourseRouter } from './routes/courses';
import { createLessonRouter } from './routes/lessons';
import quizRoutes from './routes/quizzes';
import progressRoutes from './routes/progress';
import { initQuizService } from './services/quizService';
import { initProgressService } from './services/progressService';

dotenv.config();

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Pool error:', err);
});

const app: Express = express();
const PORT = process.env.API_SERVICE_PORT || 3008;

/**
 * Middleware
 */
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3006',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: false }));
app.use(cookieParser());

/**
 * Request logging
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

/**
 * Health check
 */
app.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Routes
 */
// Initialize services with database pool
initQuizService(pool);
initProgressService(pool);

app.use('/api', createCourseRouter(pool));
app.use('/api', createLessonRouter(pool));
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

/**
 * Error handler
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`API Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

export default app;
