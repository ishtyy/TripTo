import dotenv from 'dotenv-safe';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// --- Import All Your Route Files ---
import bookingRoutes from './routes/bookingRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import flightRoutes from './routes/flightRoutes.js';
// ✅ 1. Import the new message routes
import messageRoutes from './routes/messageRoutes.js';

const app = express();

// --- Global Middleware ---
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// --- Mount All API Routes ---
app.use('/api/bookings', bookingRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/flights', flightRoutes);
// ✅ 2. Mount the new message routes
app.use('/api/messages', messageRoutes);

// --- Root Endpoint and Error Handlers ---
app.get('/', (_req, res) => {
  res.send('TripTo API is running 🚀');
});
app.use(notFound);
app.use(errorHandler);

export default app;
