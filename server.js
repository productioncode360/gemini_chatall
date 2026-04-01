// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import log from "./src/utils/logger.js";
import { connectDB } from "./src/config/db.js";

import allRoutes from "./src/routes/index.js";

dotenv.config();

const app = express();

// ====================== CORS (Improved for frontend) ======================
app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501",
    "http://localhost:5501",
    "https://gemini-chatall.onrender.com",
    "https://aimap-lovat.vercel.app/",

    "*"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ====================== MIDDLEWARE ======================
app.use(express.json({ limit: "50mb" }));        // Increased limit for images/PDF
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static("public"));

// ====================== ALL ROUTES ======================
app.use("/api", allRoutes);

// ====================== BASIC ROUTES ======================
app.get("/", (req, res) => {
  res.json({ success: true, message: "Gemini AI Backend is running successfully" });
});

app.get("/health", (req, res) => {
  res.json({ 
    success: true, 
    status: "healthy",
    uptime: process.uptime()
  });
});

// ====================== 404 HANDLER ======================
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: "Route not found",
    message: `Route ${req.method} ${req.path} does not exist`
  });
});

// ====================== START SERVER ======================
const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                🚀 GEMINI AI BACKEND STARTED                  ║
╟──────────────────────────────────────────────────────────────╢
║  Port          : http://localhost:${PORT}
║  Environment   : ${process.env.NODE_ENV || "development"}
║  Time (IST)    : ${new Date().toLocaleString("en-IN")}
║  Status        : ✅ Running Successfully
╚══════════════════════════════════════════════════════════════╝
      `);

      console.log("📋 REGISTERED ROUTES:");
      console.log("   POST → /api/chat/create");
      console.log("   POST → /api/chat/search");
      console.log("   GET  → /api/model");
      console.log("   POST → /api/map/search");
      console.log("====================================\n");
    });
  } catch (err) {
    log.error("Server start failed", err);
    process.exit(1);
  }
};

startServer();