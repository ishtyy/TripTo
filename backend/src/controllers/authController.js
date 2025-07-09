// src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const register = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    res.status(400);
    throw new Error('Email, password, and username are required');
  }

  const trimmedEmail = email.trim().toLowerCase();
  const trimmedUsername = username.trim();

  const existingUser = await db.oneOrNone(
    'SELECT user_id FROM user_profiles WHERE email = $1 OR username = $2',
    [trimmedEmail, trimmedUsername]
  );

  if (existingUser) {
    res.status(409);
    throw new Error('User with this email or username already exists.');
  }

  const password_hash = await bcrypt.hash(password, 10);

  const insertQuery = `
    INSERT INTO user_profiles (username, password, email, created_at)
    VALUES ($1, $2, $3, $4)
    RETURNING user_id, username, email, profile_picture_url, created_at, bio
  `;
  const newUser = await db.one(insertQuery, [
    trimmedUsername,
    password_hash,
    trimmedEmail,
    new Date().toISOString(),
  ]);

  const token = jwt.sign(
    { userId: newUser.user_id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  res.status(201).json({ user: newUser, token });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const trimmedEmail = email.trim().toLowerCase();

  const userProfile = await db.oneOrNone(
    `SELECT user_id, username, email, password, profile_picture_url, created_at, bio 
     FROM user_profiles WHERE email = $1`,
    [trimmedEmail]
  );

  if (!userProfile) {
    res.status(401);
    throw new Error('Invalid credentials or user not found.');
  }

  const validPassword = await bcrypt.compare(password, userProfile.password);
  if (!validPassword) {
    res.status(401);
    throw new Error('Invalid credentials.');
  }

  const token = jwt.sign(
    { userId: userProfile.user_id, email: userProfile.email },
    JWT_SECRET,
    { expiresIn: '2h' }
  );

  const { password: _, ...safeUser } = userProfile;

  res.json({ user: safeUser, token });
});
