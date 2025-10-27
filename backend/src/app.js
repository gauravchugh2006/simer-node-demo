import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import requestLogger from './middleware/requestLogger.js';
import swaggerSpec from './utils/swagger.js';
import { logError } from './utils/logger.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
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
