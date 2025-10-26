import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Cafe Coffee Day API is running.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ message: 'Unexpected error occurred.' });
});

export default app;
