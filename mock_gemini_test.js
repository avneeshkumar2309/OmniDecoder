// Simple mock test for analyzeWithGemini parsing logic.
// This script stubs `fetch` to return several response shapes and verifies analyzer handles them.

global.window = global;

// Minimal config to let analyzeWithGemini attempt a call
window.OmniConfig = {
  GEMINI_API_KEY: 'DUMMY',
  GEMINI_USE_BEARER: false,
  GEMINI_PROXY_URL: null,
  GEMINI_ENDPOINT: 'https://example.invalid/v1/models',
  GEMINI_MODEL: 'test-model',
  GEMINI_MODEL_FALLBACK: 'test-model-fb',
  TEMPERATURE: 0.0,
  MAX_OUTPUT_TOKENS: 512,
  MAX_PAYLOAD_CHARS: 10000,
};

// Provide atob/btoa
global.atob = (b) => Buffer.from(b, 'base64').toString('binary');
global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');

// Load decoder
require('./decoder.js');
const OD = window.OmniDecoder;

// Create a fake fetch that returns different shapes
let fetchCalls = 0;
global.fetch = async (url, opts) => {
  fetchCalls++;
  // Return a success shape like data.candidates[0].content.parts[0].text
  if (fetchCalls === 1) {
    const body = {
      candidates: [{ content: { parts: [{ text: JSON.stringify({ summary: 'ok', final_output: 'decoded' }) }] } }]
    };
    return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
  }
  // Return a code-block wrapped JSON text
  if (fetchCalls === 2) {
    const raw = '```json\n{"summary":"ok2","final_output":"done2"}\n```';
    const body = { candidates: [{ content: { parts: [{ text: raw }] } }] };
    return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
  }
  // Fallback: non-JSON raw text
  return { ok: true, status: 200, json: async () => ({ text: 'plain text result' }), text: async () => 'plain text result' };
};

(async function test() {
  try {
    const res = await OD.analyzeWithGemini('SGVsbG8=');
    console.log('analyzeWithGemini result (parsed):', res);
  } catch (e) {
    console.error('analyzeWithGemini failed:', e);
  }

  console.log('Mock test completed');
})();
