// src/modules/map/map.routes.js
import express from "express";
import { MapController } from "./map.controller.js";

const router = express.Router();

router.post("/search", MapController.search);

export default router;