import { getDB } from "../config/db.js";
import crypto from "crypto";

const TOKEN_EXPIRY_DAYS = 30;

export async function fingerprintMiddleware(req, res, next) {
  try {
    const fp            = req.headers["x-fingerprint"];
    const existingToken = req.headers["x-user-token"];

    // ✅ Agar kuch bhi nahi — anon user, next karo
    if (!fp && !existingToken) return next();

    const db     = getDB().collection("users");
    const now    = new Date();
    const expiry = new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    // ── Token already hai — refresh karo ──
    if (existingToken) {
      const user = await db.findOne({ token: existingToken });
      if (user && new Date(user.tokenExpiry) > now) {
        await db.updateOne(
          { token: existingToken },
          { $set: { tokenExpiry: expiry, lastSeen: now } }
        );
        req.userId    = user._id.toString();
        req.userToken = existingToken;
        res.setHeader("X-User-Token", existingToken);
        res.setHeader("X-User-Id",    req.userId);
        return next();
      }
      // Token expire ho gaya — naya banao neeche
    }

    // ── Naya fingerprint — hash karo, upsert karo ──
    if (!fp) return next(); // token expire + no fp = skip

    const fpHash = crypto.createHash("sha256").update(fp).digest("hex");
    const token  = crypto.randomBytes(32).toString("hex");

    const result = await db.findOneAndUpdate(
      { fingerprintHash: fpHash },
      {
        $set: {
          fingerprintHash: fpHash,
          token,
          tokenExpiry: expiry,
          lastSeen:    now,
          ip:          req.ip || "",
          ua:          req.headers["user-agent"] || ""
        },
        $setOnInsert: { createdAt: now, chatIds: [] }
      },
      { upsert: true, returnDocument: "after" }
    );

    const user    = result.value || result;
    req.userId    = user?._id?.toString();
    req.userToken = token;

    res.setHeader("X-User-Token", token);
    res.setHeader("X-User-Id",    req.userId || "");
    next();
  } catch (err) {
    console.error("fingerprintMiddleware error:", err.message);
    next(); // kabhi bhi block mat karo
  }
}

export async function analyticsMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", async () => {
    try {
      const duration  = Date.now() - start;
      const bodyStr   = JSON.stringify(req.body || {});
      const inputTok  = Math.ceil(bodyStr.length / 4);
      const outputTok = Math.ceil((res.locals.responseLength || 500) / 4);

      await getDB().collection("analytics").insertOne({
        ts:         new Date(),
        userId:     req.userId || "anon",
        path:       req.path,
        method:     req.method,
        status:     res.statusCode,
        durationMs: duration,
        inputTok,
        outputTok,
        totalTok:   inputTok + outputTok,
        ua:         req.headers["user-agent"] || "",
        ip:         req.ip || ""
      });
    } catch (e) { /* silent */ }
  });
  next();
}