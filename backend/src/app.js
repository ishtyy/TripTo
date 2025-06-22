// backend/src/app.js
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");

const supabase = require("./config/supabaseClient");

const authRoutes      = require("./routes/authRoutes");
const communityRoutes = require("./routes/communityRoutes");
const postsRoutes     = require("./routes/postsRoutes");
const usersRoutes     = require("./routes/usersRoutes");
const locationRoutes  = require('./routes/locationRoutes');
const communityPostRoutes = require('./routes/communityPostRoutes');
//const flightRoutes = require('./routes/flightRoutes'); // 1. Import new flight routes

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
  })
);
app.use(express.json());

app.get("/api/ping", (_req, res) => res.json({ pong: true, timestamp: new Date().toISOString() }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/community-posts", communityPostRoutes);
app.use("/api/users", usersRoutes);
app.use('/api/locations', locationRoutes);
//app.use('/api/flights', flightRoutes); // 2. Mount the new routes

app.use((err, _req, res, _next) => {
  console.error("Global Error Handler Caught:", err);
  res.status(err.status || 500).json({ 
    error: err.message || "Internal server error" 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on port ${PORT}`);
});
