/**
 * Gemini AI smoke test.
 * Usage:  node src/scripts/testAi.js
 * Reports whether the key is loaded and makes one real Gemini call.
 */
import config from '../config/env.js';
import { generateText } from '../services/ai.service.js';

async function run() {
  console.log('── AI config ───────────────────────────');
  console.log(`GEMINI_API_KEY set : ${config.GEMINI_API_KEY ? `yes (len ${config.GEMINI_API_KEY.length})` : 'NO'}`);
  console.log(`GEMINI_MODEL       : ${config.GEMINI_MODEL}`);
  console.log('────────────────────────────────────────');

  if (!config.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is empty. Ensure the .env line is exactly:  GEMINI_API_KEY=your_key');
    process.exit(1);
  }

  console.log('Calling Gemini…');
  const text = await generateText({
    system: 'You are a helpful assistant.',
    prompt: 'Reply with one short sentence confirming the AI integration works.',
    maxOutputTokens: 60,
  });

  if (text) {
    console.log('✅ Gemini replied:\n' + text);
    process.exit(0);
  } else {
    console.error('❌ Gemini returned no text. Check the server logs above for the exact error (bad key, model name, or network).');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('❌ AI test failed:', err.message);
  process.exit(1);
});
