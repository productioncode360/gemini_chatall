// src/routes/index.js
import express from "express";

import chatRoutes from "../modules/chat/chat.routes.js";
import axRoutes from "../modules/ax/ax.routes.js";
import mapRoutes from "../modules/map/map.routes.js";
import modelRoutes from "../modules/model/model.routes.js";

const router = express.Router();

// Sab routes yahan connect kar rahe hain
router.use("/chat", chatRoutes);
router.use("/ax", axRoutes);
router.use("/map", mapRoutes);      // ← Yeh line zaroori hai
router.use("/model", modelRoutes);

export default router;