// src/modules/chat/chat.routes.js
import express from "express";
import { ChatController } from "./chat.controller.js";

const router = express.Router();

router.post("/create",        ChatController.createChat);
router.post("/search",        ChatController.search);
router.post("/vector-search", ChatController.vectorSearch);
router.get("/history/all",    ChatController.getAllChats);   // ← /history/all UPAR rehna chahiye /:chatId se
router.get("/:chatId",        ChatController.getChat);

export default router;