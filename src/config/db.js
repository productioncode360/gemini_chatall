// src/config/db.js
import { MongoClient } from "mongodb";
import log from "../utils/logger.js";
import { ENV } from "./env.js";

let dbInstance = null;

export const connectDB = async () => {
  if (dbInstance) {
    log.info("Using existing MongoDB connection");
    return dbInstance;
  }

  try {
    const client = new MongoClient(ENV.MONGODB_URI);
    await client.connect();
    
    dbInstance = client.db();
    log.success(`✅ MongoDB Connected successfully`);
    return dbInstance;
  } catch (err) {
    log.error("❌ MongoDB Connection Failed", err);
    throw new Error("Failed to connect to MongoDB. Check MONGODB_URI in .env file");
  }
};

export const getDB = () => {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call connectDB() first.");
  }
  return dbInstance;
};