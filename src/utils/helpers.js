// src/utils/helpers.js
/**
 * Helper functions for Gemini AI Backend
 */

export function getCurrentIST() {
  try {
    return new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (err) {
    console.warn("Failed to get IST time, using UTC");
    return new Date().toISOString();
  }
}

export function estimateTokens(text) {
  if (!text || typeof text !== "string") return 0;
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

export function detectCodeRequest(query) {
  if (!query || typeof query !== "string") return false;

  const codeKeywords = [
    "code", "write", "banao", "likho", "create", "build", "make", 
    "develop", "program", "function", "script", "component", "app",
    "website", "html", "css", "javascript", "react", "python", 
    "java", "api", "backend", "frontend", "implement", "generate"
  ];

  const lowerQuery = query.toLowerCase();
  return codeKeywords.some(keyword => lowerQuery.includes(keyword));
}

export function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  // Basic sanitization - remove potentially dangerous characters
  return input.trim().replace(/[<>\"']/g, "");
}

export function validateQuery(query) {
  if (!query || typeof query !== "string") {
    throw new Error("Query is required and must be a string");
  }
  if (query.trim().length === 0) {
    throw new Error("Query cannot be empty");
  }
  if (query.length > 10000) {
    throw new Error("Query is too long. Maximum 10000 characters allowed");
  }
  return true;
}

/**
 * Format error response for consistent API responses
 */
export function formatError(error, defaultMessage = "An unexpected error occurred") {
  return {
    success: false,
    error: error?.message || defaultMessage,
    timestamp: new Date().toISOString()
  };
}

export default {
  getCurrentIST,
  estimateTokens,
  detectCodeRequest,
  sanitizeInput,
  validateQuery,
  formatError
};