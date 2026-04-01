// src/modules/chat/chat.routes.js
import express from "express";
import { ChatController } from "./chat.controller.js";

const router = express.Router();

router.post("/create", ChatController.createChat);
router.post("/search", ChatController.search);
// router.get("/", ChatController.getAllChats);   // uncomment when needed

export default router;