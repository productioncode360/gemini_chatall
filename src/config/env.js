// src/config/env.js
import dotenv from "dotenv";
dotenv.config();

// ====================== ENVIRONMENT CONFIG ======================
export const ENV = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gemini_chat",

  // API Keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,

  // Gemini Models
  GEMINI_MODEL: "gemini-3.1-flash-lite-preview",        // Default model (tumhara pasandida)

  // Groq Model
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

  // App Settings
  MAX_QUERY_LENGTH: 10000,
  DEFAULT_CHAT_TITLE: "New Chat",
  DEFAULT_TEMPERATURE: 0.7
};

// ====================== ENVIRONMENT CHECK ======================
export const checkEnvVariables = () => {
  console.log("\n🔍 Environment Variables Status:");

  const status = {
    GEMINI_API_KEY: ENV.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing",
    TAVILY_API_KEY: ENV.TAVILY_API_KEY ? "✅ Loaded" : "❌ Missing",
    GROQ_API_KEY: ENV.GROQ_API_KEY ? "✅ Loaded" : "❌ Missing (Optional)",
    MONGODB_URI: ENV.MONGODB_URI ? "✅ Loaded" : "❌ Missing"
  };

  console.log(`   GEMINI_API_KEY   : ${status.GEMINI_API_KEY}`);
  console.log(`   TAVILY_API_KEY   : ${status.TAVILY_API_KEY}`);
  console.log(`   GROQ_API_KEY     : ${status.GROQ_API_KEY}`);
  console.log(`   MONGODB_URI      : ${status.MONGODB_URI}`);
  console.log(`   GEMINI_MODEL     : ${ENV.GEMINI_MODEL}`);
  console.log("=".repeat(60) + "\n");
};

// Call the check function
checkEnvVariables();

export default ENV;