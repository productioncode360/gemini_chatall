// src/modules/map/map.controller.js
import log from "../../utils/logger.js";
import { MapService } from "./map.service.js";

export const MapController = {
  async search(req, res) {
    try {
      const { river } = req.body;
      
      if (!river) {
        return res.status(400).json({ 
          success: false, 
          error: "River name is required" 
        });
      }

      const result = await MapService.searchRiver(river);
      res.json(result);

    } catch (err) {
      log.error("MapController.search failed", err);
      res.status(500).json({ 
        success: false, 
        error: err.message || "Internal server error" 
      });
    }
  }
};