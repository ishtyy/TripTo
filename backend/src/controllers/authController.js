import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import asyncHandler from '../middleware/asyncHandler.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '3h';

export const register = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
        res.status(400);
        throw new Error('Email, password, and username are required');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const insertQuery = `
        INSERT INTO user_profiles (username, email, password, role, created_at)
        VALUES ($1, $2, $3, 'user', $4)
        RETURNING user_id, username, email, role, profile_picture_url, created_at, bio
    `;
    const newUser = await db.one(insertQuery, [
        username.trim(),
        email.trim().toLowerCase(),
        password_hash,
        new Date().toISOString(),
    ]);

    const token = jwt.sign(
        { userId: newUser.user_id, role: newUser.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, token });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error('Email and password are required');
    }

    const userProfile = await db.oneOrNone('SELECT * FROM user_profiles WHERE email = $1', [email.trim().toLowerCase()]);

    if (!userProfile || !(await bcrypt.compare(password, userProfile.password))) {
        res.status(401);
        throw new Error('Invalid credentials.');
    }

    const token = jwt.sign(
        { userId: userProfile.user_id, role: userProfile.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...safeUser } = userProfile;
    res.json({ user: safeUser, token });
});

export const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error('Email and password are required');
    }

    const adminProfile = await db.oneOrNone('SELECT * FROM user_profiles WHERE email = $1', [email.trim().toLowerCase()]);

    if (!adminProfile || adminProfile.role !== 'admin') {
        res.status(401);
        throw new Error('Access Denied. Not an authorized admin account.');
    }

    const validPassword = await bcrypt.compare(password, adminProfile.password);
    if (!validPassword) {
        res.status(401);
        throw new Error('Invalid credentials.');
    }

    const token = jwt.sign(
        { userId: adminProfile.user_id, role: adminProfile.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );

    const { password: _, ...safeAdmin } = adminProfile;
    res.json({ user: safeAdmin, token });
});