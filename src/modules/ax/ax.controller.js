// src/modules/ax/ax.controller.js
import log from "../../utils/logger.js";
import { AXService } from "./ax.service.js";

export const AXController = {
  async generateMCQ(req, res) {
    try {
      const { topic, count } = req.body;
      if (!topic) return res.status(400).json({ success: false, error: "Topic is required" });

      const result = await AXService.generateMCQ(topic, count);
      res.json(result);
    } catch (err) {
      log.error("AXController.generateMCQ failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async generateMindMap(req, res) {
    try {
      const { topic } = req.body;
      if (!topic) return res.status(400).json({ success: false, error: "Topic is required" });

      const result = await AXService.generateMindMap(topic);
      res.json(result);
    } catch (err) {
      log.error("AXController.generateMindMap failed", err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};