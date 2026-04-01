// src/modules/model/model.controller.js
import { ModelService } from "./model.service.js";

export const ModelController = {
  async getModels(req, res) {
    try {
      const models = ModelService.getAvailableModels();
      res.json({ success: true, models });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to fetch models" });
    }
  }
};