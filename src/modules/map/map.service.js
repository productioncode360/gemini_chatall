// src/modules/map/map.service.js
import log from "../../utils/logger.js";
import { AIFactory } from "../../services/ai.factory.js";

export const MapService = {

  async searchRiver(query) {
    try {
      log.api("MAP", "search", query);

      const prompt = `
You are an expert geographer and cartographer.

User query: "${query}"

Analyze the query carefully:
- If the user asks for a RIVER (e.g. "Ganga", "Nile", "10 Pakistan rivers", "Amazon"), return type "rivers"
- If the user asks for a FOREST or NATIONAL PARK (e.g. "Amazon rainforest", "Jim Corbett"), return type "forests"
- If the user asks for a MOUNTAIN or RANGE (e.g. "Alps", "Himalayas"), return type "mountains"
- If the user asks for a DESERT (e.g. "Sahara", "Thar desert"), return type "deserts"

Return ONLY valid JSON. No markdown, no explanation, no backticks.

For RIVERS, return:
{
  "type": "rivers",
  "rivers": [
    {
      "name": "River Name",
      "length_km": 1234,
      "color": "#38bdf8",
      "path": [[lat1,lng1],[lat2,lng2],...],
      "source": { "name": "Source Name", "lat": 0.0, "lng": 0.0 },
      "mouth":  { "name": "Mouth Name",  "lat": 0.0, "lng": 0.0 },
      "region": "Country/Region",
      "description": "One line description"
    }
  ]
}

For FORESTS, return:
{
  "type": "forests",
  "items": [
    {
      "name": "Forest Name",
      "latlng": [lat, lng],
      "radius": 50000,
      "color": "#4ade80",
      "origin": "State/Country",
      "dest": "Type (e.g. Rainforest, National Park)",
      "length": "area in sq km",
      "region": "Region/Country"
    }
  ]
}

For MOUNTAINS, return:
{
  "type": "mountains",
  "items": [
    {
      "name": "Mountain Name",
      "color": "#a78bfa",
      "path": [[lat1,lng1],[lat2,lng2],...],
      "origin": "Start point",
      "dest": "End point",
      "length": "Length/height info",
      "region": "Country/Region"
    }
  ]
}

For DESERTS, return:
{
  "type": "deserts",
  "items": [
    {
      "name": "Desert Name",
      "latlng": [lat, lng],
      "radius": 200000,
      "color": "#fbbf24",
      "origin": "Location",
      "dest": "Type",
      "length": "Area in sq km",
      "region": "Country/Region"
    }
  ]
}

Rules:
- Use accurate, real-world coordinates.
- For rivers: minimum 6-8 coordinate points per river for smooth rendering.
- For mountains: minimum 5 coordinate points along the range.
- If user asks for multiple (e.g. "10 rivers", "top 5 forests"), return all of them in the array.
- If user asks for one item, return just 1 item in the array.
- Assign visually distinct colors for multiple items.
- Return ONLY raw JSON. Absolutely no extra text.
`;

      const aiResponse = await AIFactory.getResponse(prompt, "gemini-pro");

      let result;
      try {
        // Strip any accidental markdown fences
        const cleaned = aiResponse
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        result = JSON.parse(cleaned);
      } catch (e) {
        log.error("AI JSON parse failed", e);
        throw new Error("AI returned invalid JSON");
      }

      // Normalize into a unified response format
      return _normalizeResult(query, result);

    } catch (err) {
      log.error("MapService.searchRiver failed", err);

      // Fallback: if query is clearly about Ganga
      if (query.toLowerCase().includes("ganga") || query.toLowerCase().includes("ganges")) {
        return _gangaFallback();
      }

      return {
        success: false,
        message: `Could not find map data for "${query}". Please try again.`
      };
    }
  }
};

/* ─────────────────────────────────────────
   NORMALIZE AI RESPONSE
   ─────────────────────────────────────────*/
function _normalizeResult(query, result) {
  const type = result.type || "rivers";

  // RIVERS
  if (type === "rivers" && result.rivers?.length) {
    return {
      success: true,
      type: "rivers",
      message: `Showing ${result.rivers.length} river(s) for: ${query}`,
      data: { rivers: result.rivers }
    };
  }

  // FORESTS / MOUNTAINS / DESERTS (circle or path items)
  if (["forests", "mountains", "deserts"].includes(type) && result.items?.length) {
    return {
      success: true,
      type,
      message: `Showing ${result.items.length} ${type} for: ${query}`,
      data: { items: result.items }
    };
  }

  return {
    success: false,
    message: `No data found for "${query}". Try being more specific.`
  };
}

/* ─────────────────────────────────────────
   FALLBACK DATA
   ─────────────────────────────────────────*/
function _gangaFallback() {
  return {
    success: true,
    type: "rivers",
    message: "Showing Ganga (fallback data)",
    data: {
      rivers: [{
        name: "Ganga",
        length_km: 2525,
        color: "#38bdf8",
        path: [
          [30.98, 78.92], [29.95, 78.17], [27.47, 79.92],
          [26.85, 80.92], [25.45, 81.88], [25.32, 83.01],
          [25.57, 85.13], [24.87, 87.95], [22.57, 88.35], [21.90, 88.10]
        ],
        source: { name: "Gangotri, Uttarakhand", lat: 30.98, lng: 78.92 },
        mouth:  { name: "Bay of Bengal",         lat: 21.90, lng: 88.10 },
        region: "North India",
        description: "The holiest river of India, originating from Gangotri glacier."
      }]
    }
  };
}