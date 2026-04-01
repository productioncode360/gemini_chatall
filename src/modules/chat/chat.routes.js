// src/modules/chat/chat.routes.js
import express from "express";
import { ChatController } from "./chat.controller.js";

const router = express.Router();

// Create new chat
router.post("/create", ChatController.createChat);

// Main chat (with memory support)
router.post("/search", ChatController.search);

// Get specific chat history
router.get("/:chatId", ChatController.getChat);

export default router;