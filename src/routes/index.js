import express from "express";

import chatRoutes      from "../modules/chat/chat.routes.js";
import axRoutes        from "../modules/ax/ax.routes.js";
import mapRoutes       from "../modules/map/map.routes.js";
import modelRoutes     from "../modules/model/model.routes.js";
import analyticsRoutes from "../modules/analytics/analytics.routes.js";   // ← NAYA

const router = express.Router();

router.use("/chat",      chatRoutes);
router.use("/ax",        axRoutes);
router.use("/map",       mapRoutes);
router.use("/model",     modelRoutes);
router.use("/analytics", analyticsRoutes);   // ← NAYA  →  /api/analytics/stats

export default router;