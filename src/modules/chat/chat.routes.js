import express from "express";
import { ChatController } from "./chat.controller.js";

const router = express.Router();

router.post("/create", ChatController.createChat);
router.post("/search", ChatController.search);
router.get("/history/all", ChatController.getAllChats); // This is strictly placed above :chatId
router.get("/:chatId", ChatController.getChat);

export default router;