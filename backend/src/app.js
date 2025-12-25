import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import requestLogger from './middleware/requestLogger.js';
import swaggerSpec from './utils/swagger.js';
import { logError } from './utils/logger.js';

// IMPORTANT: load env BEFORE reading process.env
dotenv.config();

// 1. Build allowed origins from env instead of hardcoding IPs
// Include backend origin so Swagger UI at :4000 can call the APIs locally.
const defaultOrigins = ['http://localhost:5173', 'http://localhost:4000'];

const envOrigins = [];

// Single main origin – for your EC2 frontend
if (process.env.FRONTEND_ORIGIN) {
  envOrigins.push(process.env.FRONTEND_ORIGIN);
}

// Optional comma-separated list: "http://foo:5173,http://bar:5173"
if (process.env.EXTRA_ALLOWED_ORIGINS) {
  envOrigins.push(
    ...process.env.EXTRA_ALLOWED_ORIGINS
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
  );
}

const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

console.log('[CORS] Allowed origins:', allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // allow non-browser tools (no Origin header) + whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('[CORS] Blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// keep this around only if you ever want to temporarily allow everything
// const corsOptionsOld = {
//   origin: '*',
//   allowedHeaders: ['Content-Type', 'Authorization'],
// };

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.json({ message: 'Cafe Coffee Day API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  logError('Unhandled error', err, { path: req.originalUrl });
  res.status(500).json({ message: 'Unexpected error occurred.' });
});

export default app;
