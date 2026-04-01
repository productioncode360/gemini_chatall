// src/modules/model/model.routes.js
import express from "express";
import { ModelController } from "./model.controller.js";

const router = express.Router();

router.get("/", ModelController.getModels);

export default router;