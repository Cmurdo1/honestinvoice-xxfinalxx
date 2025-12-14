import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { config } from './config';

// Load environment variables
dotenv.config();

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: config.corsOrigin }));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes placeholder
app.get(`${config.apiPrefix}/`, (req: Request, res: Response) => {
  res.json({
    message: 'HonestInvoice API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested endpoint ${req.method} ${req.path} does not exist`,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An error occurred',
    timestamp: new Date().toISOString(),
  });
});

const PORT = config.port;
const HOST = config.host;

app.listen(PORT, HOST, () => {
  console.log(`\n🚀 Server running at http://${HOST}:${PORT}`);
  console.log(`📚 API prefix: ${config.apiPrefix}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`✅ Ready to accept requests\n`);
});

export default app;
