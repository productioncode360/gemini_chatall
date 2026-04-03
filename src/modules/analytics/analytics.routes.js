import express from "express";
import { AnalyticsController } from "./analytics.controller.js";

const router = express.Router();

router.get("/stats", AnalyticsController.getStats);
router.get("/users", AnalyticsController.getUsers);

export default router;