import { getDB } from "../../config/db.js";

export const AnalyticsController = {
  async getStats(req, res) {
    try {
      const db    = getDB();
      const col   = db.collection("analytics");
      const now   = new Date();
      const day24h = new Date(now - 24 * 60 * 60 * 1000);

      const [totalRequests, requests24h, uniqueUsers, tokenAgg, topPaths, requestsByHour, userCount] =
        await Promise.all([
          col.countDocuments(),
          col.countDocuments({ ts: { $gte: day24h } }),
          col.distinct("userId"),
          col.aggregate([{ $group: { _id: null,
            totalInput:  { $sum: "$inputTok"  },
            totalOutput: { $sum: "$outputTok" },
            totalAll:    { $sum: "$totalTok"  },
            avgDuration: { $avg: "$durationMs" }
          }}]).toArray(),
          col.aggregate([
            { $group: { _id: "$path", count: { $sum: 1 } } },
            { $sort:  { count: -1 } },
            { $limit: 8 }
          ]).toArray(),
          col.aggregate([
            { $match: { ts: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: { $hour: "$ts" }, count: { $sum: 1 } } },
            { $sort:  { "_id": 1 } }
          ]).toArray(),
          db.collection("users").countDocuments()
        ]);

      const tok = tokenAgg[0] || { totalInput: 0, totalOutput: 0, totalAll: 0, avgDuration: 0 };

      res.json({
        success: true,
        stats: {
          totalRequests,
          requests24h,
          uniqueUsers:     uniqueUsers.length,
          registeredUsers: userCount,
          tokens: {
            input:  tok.totalInput,
            output: tok.totalOutput,
            total:  tok.totalAll
          },
          avgResponseMs: Math.round(tok.avgDuration || 0),
          topPaths,
          requestsByHour
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getUsers(req, res) {
    try {
      const data = await getDB().collection("analytics").aggregate([
        { $group: {
            _id:      "$userId",
            requests: { $sum: 1 },
            tokens:   { $sum: "$totalTok" },
            lastSeen: { $max: "$ts" }
        }},
        { $sort:  { requests: -1 } },
        { $limit: 50 }
      ]).toArray();
      res.json({ success: true, users: data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};