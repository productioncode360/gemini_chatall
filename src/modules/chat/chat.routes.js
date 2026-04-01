import express from "express";
import { ChatController } from "./chat.controller.js";

const router = express.Router();

router.post("/create", ChatController.createChat);
router.post("/search", ChatController.search);

// 🔴 GET ALL HISTORY ROUTE
router.get("/history/all", ChatController.getAllChats);

router.get("/:chatId", ChatController.getChat);

export default router;