// backend/src/app.js
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");

// ← Correct path: "./config/supabaseClient"
const supabase = require("./config/supabaseClient");

const authRoutes      = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const postsRoutes     = require("./routes/postsRoutes");
const usersRoutes     = require("./routes/usersRoutes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
  })
);
app.use(express.json());

app.get("/api/ping", (_req, res) => res.json({ pong: true }));

app.get("/api/debug/user_profiles", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Debug SELECT Error:", error);
      return res.status(500).json({ error: error.message });
    }
    return res.json({ someRow: data });
  } catch (err) {
    console.error("Debug route unexpected error:", err);
    return res.status(500).json({ error: err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/users", usersRoutes);

app.use((err, _req, res, _next) => {
  console.error("Global Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
});
