// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import log from "./src/utils/logger.js";
import { connectDB } from "./src/config/db.js";

import allRoutes from "./src/routes/index.js";

dotenv.config();

const app = express();

// CORS
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// All Routes
app.use("/api", allRoutes);

// Basic Routes
app.get("/", (req, res) => res.json({ success: true, message: "Backend Running" }));
app.get("/health", (req, res) => res.json({ success: true, status: "healthy" }));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: "Route not found",
    message: `Route ${req.method} ${req.path} does not exist`
  });
});

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
║  Environment   : development
║  Time (IST)    : ${new Date().toLocaleString("en-IN")}
║  Status        : ✅ Running Successfully
╚══════════════════════════════════════════════════════════════╝
      `);

      console.log("📋 REGISTERED ROUTES:");
      console.log("   POST → /api/map/search");
      console.log("   POST → /api/chat/search");
      console.log("   GET  → /api/model");
      console.log("====================================\n");
    });
  } catch (err) {
    log.error("Server start failed", err);
    process.exit(1);
  }
};

startServer();