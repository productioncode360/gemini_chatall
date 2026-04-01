// app.js
import express from "express";
import allRoutes from "./src/routes/index.js";
import errorMiddleware from "./src/middleware/error.middleware.js";

const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// All Routes
app.use("/api", allRoutes);

// Basic Routes
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    message: "Gemini AI Backend is running perfectly",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Gemini AI Backend API",
    version: "1.0.0",
    documentation: "Use /api/chat/search for main chat"
  });
});

// Error Handlers
app.use(errorMiddleware);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `The requested route ${req.method} ${req.path} does not exist`
  });
});

export default app;