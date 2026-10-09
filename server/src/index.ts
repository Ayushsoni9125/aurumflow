import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { errorMiddleware } from './middleware/errorMiddleware';

// Load environment variables
dotenv.config();
dotenv.config({ path: '../.env' });

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/v1', apiRouter);

// Root status
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'AurumFlow API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/v1',
    healthCheck: '/health',
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Central error handler
app.use(errorMiddleware);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
