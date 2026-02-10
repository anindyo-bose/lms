/**
 * Payment Service Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { Pool } from 'pg';
import { PaymentService } from './services/PaymentService';
import { createPaymentRoutes } from './routes/payments';

const app = express();
const PORT = process.env.PORT || 3009;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'composey_lms',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Test database connection
pool.connect()
  .then(() => console.log('Payment service connected to database'))
  .catch((err) => console.error('Database connection error:', err));

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3006',
    process.env.SHELL_URL || '',
    process.env.CHECKOUT_WIDGET_URL || '',
  ].filter(Boolean),
  credentials: true,
}));

// Body parsing - raw for webhooks, JSON for API
app.use('/api/payments/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cookieParser());

// Initialize payment service
const paymentService = new PaymentService(pool);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'payment',
    timestamp: new Date().toISOString(),
  });
});

// Payment routes
app.use('/api/payments', createPaymentRoutes(paymentService));

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Payment service error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
  console.log(`Default payment provider: ${process.env.DEFAULT_PAYMENT_PROVIDER || 'mock'}`);
});

export default app;
