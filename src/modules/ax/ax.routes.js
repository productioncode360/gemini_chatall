// src/modules/ax/ax.routes.js
import express from "express";
import { AXController } from "./ax.controller.js";

const router = express.Router();

router.post("/mcq", AXController.generateMCQ);
router.post("/mindmap", AXController.generateMindMap);

export default router;