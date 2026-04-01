// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import log from "./src/utils/logger.js";
import { connectDB } from "./src/config/db.js";
import allRoutes from "./src/routes/index.js";

dotenv.config();

const app = express();

// ====================== CORS ======================
// ====================== CORS (Improved for frontend) ======================
app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5501",    // 🔴 Added for your VS Code Live Server
    "http://127.0.0.1:5501",    // 🔴 Added for your VS Code Live Server
    "https://gemini-chatall.onrender.com",
    "https://aimap-lovat.vercel.app" 
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ====================== MIDDLEWARE ======================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));

// ====================== ROUTES ======================
app.use("/api", allRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Gemini AI Backend is running successfully" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// ====================== START SERVER ======================
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 GEMINI AI BACKEND STARTED ON PORT ${PORT}`);
    });
  } catch (err) {
    log.error("Server start failed", err);
    process.exit(1);
  }
};

startServer();