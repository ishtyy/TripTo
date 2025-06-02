// backend/src/routes/authRoutes.js
// backend/src/routes/authRoutes.js

const express    = require("express");
const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const supabase   = require("../config/supabaseClient");

const router     = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * POST /api/auth/register
 * If email already exists → 409. Otherwise insert and return the new row.
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    // 1) Check if a user with that email already exists
    const { data: existing, error: fetchError } = await supabase
      .from("user_profile")
      .select("user_id")
      .eq("email", email)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // “PGRST116” = no rows found in single() → which is fine
      console.error("Fetch‐existing‐user error:", fetchError);
      return res.status(500).json({ error: fetchError.message });
    }
    if (existing) {
      // 409 Conflict if user already exists
      return res.status(409).json({ error: "User already exists." });
    }

    // 2) Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // 3) Build the new user object
    const newUser = {
      user_id: uuidv4(),
      username: email.split("@")[0],
      password: password_hash,
      email,
      created_at: new Date().toISOString(),
      profile_picture_url: null,
      bio: null
    };

    // 4) Insert & request returning row
    const { data, error: insertError } = await supabase
      .from("user_profile")
      .insert([newUser], { returning: "representation" })
      .single();

    console.log("Supabase insert result:", { data, insertError });

    if (insertError) {
      // Other constraint‐violations—e.g., username unique key → treat as conflict
      if (insertError.code === "23505") {
        return res.status(409).json({ error: "User already exists." });
      }
      return res.status(400).json({ error: insertError.message });
    }
    if (!data) {
      console.error("Insert returned no row even though no error");
      return res.status(400).json({ error: "Insert did not return a row." });
    }

    // 5) Sign a JWT
    const token = jwt.sign(
      { userId: data.user_id, email: data.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    const safeUser = {
      user_id: data.user_id,
      username: data.username,
      email: data.email,
      profile_picture_url: data.profile_picture_url,
      created_at: data.created_at,
      bio: data.bio
    };
    return res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error("Register Error (unexpected):", err);
    return res.status(500).json({ error: err.message });
  }
});



/**
 * POST /api/auth/login
 * Body: { email, password }
 * If credentials match, return user + token. Otherwise 401.
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    // 1) Fetch user row by email
    const { data: existingUser, error: fetchError } = await supabase
      .from("user_profile")
      .select("*")
      .eq("email", email)
      .single();

    if (fetchError || !existingUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 2) Compare password hash
    const valid = await bcrypt.compare(password, existingUser.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // 3) Sign new JWT
    const token = jwt.sign(
      { userId: existingUser.user_id, email: existingUser.email },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // 4) Return safe user + token
    const safeUser = {
      user_id: existingUser.user_id,
      username: existingUser.username,
      email: existingUser.email,
      profile_picture_url: existingUser.profile_picture_url,
      created_at: existingUser.created_at,
      bio: existingUser.bio
    };
    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error("Login Error (unexpected):", err);
    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;
