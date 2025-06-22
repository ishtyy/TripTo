// backend/src/routes/authRoutes.js
const express    = require("express");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const db         = require("../config/db"); // Use the new raw SQL module

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) {
      return res.status(400).json({ error: "Email, password, and username are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    // Check if user with this email or username already exists
    const existingUserRes = await db.query(
      'SELECT user_id FROM user_profile WHERE email = $1 OR username = $2',
      [trimmedEmail, trimmedUsername]
    );

    if (existingUserRes.rows.length > 0) {
      return res.status(409).json({ error: "User with this email or username already exists." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Insert user and return the newly created profile
    const insertQuery = `
      INSERT INTO user_profile (username, password, email, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING user_id, username, email, profile_picture_url, created_at, bio
    `;
    const newUserValues = [trimmedUsername, password_hash, trimmedEmail, new Date().toISOString()];

    const insertedUserRes = await db.query(insertQuery, newUserValues);
    const insertedUser = insertedUserRes.rows[0];

    if (!insertedUser || !insertedUser.user_id) {
      return res.status(500).json({ error: "Failed to register user (no user_id returned after insert)." });
    }

    const token = jwt.sign(
      { userId: insertedUser.user_id, email: insertedUser.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.status(201).json({ user: insertedUser, token });

  } catch (err) {
    console.error("Register Endpoint Error (unexpected):", err);
    // Handle unique constraint violation specifically
    if (err.code === '23505') {
        return res.status(409).json({ error: "A user with these details already exists."});
    }
    return res.status(500).json({ error: "An unexpected error occurred during registration." });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const { rows } = await db.query(
        'SELECT user_id, username, email, password, profile_picture_url, created_at, bio FROM user_profile WHERE email = $1',
        [trimmedEmail]
    );
    const userProfile = rows[0];

    if (!userProfile) {
      return res.status(401).json({ error: "Invalid credentials or user not found." });
    }

    const validPassword = await bcrypt.compare(password, userProfile.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: userProfile.user_id, email: userProfile.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    const { password: _, ...safeUser } = userProfile;

    return res.json({ user: safeUser, token });

  } catch (err) {
    console.error("Login Endpoint Error (unexpected):", err);
    return res.status(500).json({ error: "An unexpected error occurred during login." });
  }
});

module.exports = router;