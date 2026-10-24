import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { auditRouter } from './routes/auditRoutes.js';

// Securely load environment variables from backend/.env or root .env
const envLocations = [
  path.resolve(process.cwd(), 'backend/.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env')
];

for (const envPath of envLocations) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config(); // Fallback to default search path

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5001;

// CORS configuration: Allow localhost, vite dev port, and custom CORS_ORIGIN
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CORS_ORIGIN
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local hackathon integration
      }
    },
    credentials: true
  })
);

app.use(express.json({ limit: '5mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Register API Routes
app.use('/api', auditRouter);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  // Never expose raw stack traces or internal secrets in production or API responses
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred.'
  });
});

// Start listener only when not running in test mode
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  NiyamAI AI TEXT AUDIT ENGINE`);
    console.log(`  Server running on http://localhost:${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`  Rules Config: http://localhost:${PORT}/api/config/rules`);
    console.log(`  Engine Mode: ${process.env.GEMINI_API_KEY ? 'HYBRID (Gemini + Rules)' : 'DETERMINISTIC (Rules Only)'}`);
    console.log(`=======================================================`);
  });
}
