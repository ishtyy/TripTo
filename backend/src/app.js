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
import adminRoutes from './routes/adminRoutes.js'; // Enabled
import flightRoutes from './routes/flightRoutes.js';
import communityPostRoutes from './routes/communityPostRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import packageRoutes from './routes/packageRoutes.js'; // Enabled
import couponRoutes from './routes/couponRoutes.js';

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
app.use('/api/admin', adminRoutes); // Enabled
app.use('/api/flights', flightRoutes);
app.use('/api/community-posts', communityPostRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/packages', packageRoutes); // Enabled
app.use('/api/coupons', couponRoutes);

// --- Root Endpoint and Error Handlers ---
app.get('/', (_req, res) => {
  res.send('TripTo API is running');
});
app.use(notFound);
app.use(errorHandler);

export default app;