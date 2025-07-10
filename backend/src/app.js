// src/app.js
import dotenv from 'dotenv-safe';
dotenv.config();

import express from 'express';
import morgan from 'morgan';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import cors from 'cors';
import db from './config/db.js';
import asyncHandler from './middleware/asyncHandler.js';   // if not using express-async-errors
import { supabasePublic, supabaseAdmin } from './config/supabaseClient.js';
import bookingRoutes from './routes/bookingRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import postRoutes from './routes/postRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import communityPostRoutes from './routes/communityPostRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import flightRoutes from './routes/flightRoutes.js';

const app = express();

// 1) Global middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',  // or '*' for all origins in dev
  credentials: true
}));

app.use(apiLimiter); // applies to all routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/community-posts', communityPostRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/flights', flightRoutes);
console.log('✅ Flight routes registered successfully on /api/flights'); // <-- ADD THIS LINE


// 2) Your application routes
// e.g. import postsRouter from './routes/posts.js';
//      app.use('/posts', postsRouter);
// and any other routers: /auth, /bookings, etc.

// 3) Optional root endpoint
app.get('/', (_req, res) => {
  res.send('TripTo API is running 🚀');
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
});


// app.get(
//   '/health',
//   asyncHandler(async (req, res) => {
//     // SELECT 1 as ok → returns { ok: 1 }
//     const { ok } = await db.one('SELECT 1 AS ok');
//     res.json({ status: 'ok', db: ok });
//   })
// );

// app.get('/test-supabase-public', async (req, res) => {
//   try {
//     // Try a simple "health check" call: list your own user session or something minimal
//     // Since no users yet, just test client creation by calling an endpoint that always works
//     // Supabase JS doesn't have a simple ping, so try fetching user count via admin client or list users if possible

//     // If you don't want admin: just return success as a proof client is created
//     res.json({ success: true, message: 'Public Supabase client connected' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/test-supabase-admin', async (req, res) => {
//   try {
//     // Use admin client to list users, requires service_role key, but minimal real query
//     console.log('test-supabase-admin route hit');
//     const { data, error } = await supabaseAdmin.auth.admin.listUsers();
//     if (error) return res.status(500).json({ error: error.message });
//     res.json({ success: true, usersCount: data.length });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

app.get(
  '/locations',
  asyncHandler(async (req, res) => {
    try {
      const data = await db.any('SELECT * FROM locations LIMIT 100');

      res.status(200).json({
        success: true,
        count: data.length,
        locations: data,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch locations',
        error: err.message,
      });
    }
  })
);


// 4) Not found (404)
app.use(notFound);

// 5) Error handler
app.use(errorHandler);


export default app;