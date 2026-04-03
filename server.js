import express from "express";
import dotenv  from "dotenv";
import cors    from "cors";
import log     from "./src/utils/logger.js";
import { connectDB }              from "./src/config/db.js";
import allRoutes                  from "./src/routes/index.js";
import { fingerprintMiddleware,
         analyticsMiddleware }    from "./src/middleware/fingerprint.middleware.js";  // ← NAYA

dotenv.config();
const app = express();

// ====================== CORS ======================
app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5501",
    "http://127.0.0.1:5501",
    "https://gemini-chatall.onrender.com",
    "https://aimap-lovat.vercel.app"
  ],
  methods:      ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Fingerprint", "X-User-Token"],  // ← NAYA headers allow
  exposedHeaders: ["X-User-Token", "X-User-Id"],   // ← frontend ko headers milenge
  credentials:  true
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));

// ====================== FINGERPRINT + ANALYTICS ======================
app.use(fingerprintMiddleware);   // ← NAYA — user ID assign karta hai
app.use(analyticsMiddleware);     // ← NAYA — har request log karta hai

// ====================== ROUTES ======================
app.use("/api", allRoutes);

app.get("/", (req, res) => res.json({ success: true, message: "Backend is running" }));
app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }));

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 BACKEND STARTED ON PORT ${PORT}`));
  } catch (err) {
    log.error("Server start failed", err);
    process.exit(1);
  }
};
startServer();