// backend/src/config/db.js
require("dotenv").config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("FATAL: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  // If connecting to a cloud database like Supabase/Heroku, SSL might be required.
  // ssl: {
  //   rejectUnauthorized: false
  // }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Database connected successfully.");
  }
});

module.exports = {
  // A helper function for simple queries
  query: (text, params) => pool.query(text, params),
  // Export the pool itself for transactions
  pool: pool,
};