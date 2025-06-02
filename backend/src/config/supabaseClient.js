// backend/src/config/supabaseClient.js
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");
const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("→ Using Supabase URL:", SUPABASE_URL);
console.log("→ Using Service Role Key defined? ", !!SUPABASE_SERVICE_ROLE_KEY);

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
