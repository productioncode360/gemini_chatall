// src/utils/logger.js
const log = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} | ${msg}`),
  success: (msg) => console.log(`[✅ SUCCESS] ${msg}`),
  warn: (msg) => console.warn(`[⚠️ WARNING] ${msg}`),
  error: (msg, err = null) => {
    console.error(`[❌ ERROR] ${msg}`);
    if (err) {
      console.error(`   → Message: ${err.message}`);
      if (err.stack) console.error(`   → Stack: ${err.stack.split('\n').slice(0, 4).join('\n')}`);
    }
  },
  api: (module, action, extra = "") => {
    console.log(`[API] ${module.toUpperCase()} | ${action} ${extra ? `→ ${extra}` : ''}`);
  }
};

export default log;