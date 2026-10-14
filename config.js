// ╔══════════════════════════════════════════════════════════════════╗
// ║  OmniDecoder — Abstracted Configuration                         ║
// ║  API keys and model settings live here only.                    ║
// ╚══════════════════════════════════════════════════════════════════╝

window.OmniConfig = {

  // Kept null deliberately: API credentials belong only on the local server.
  GEMINI_API_KEY: null,

  // Model
  GEMINI_MODEL: 'gemini-2.5-flash',
  GEMINI_MODEL_FALLBACK: 'gemini-2.5-flash-lite',

  // Endpoint
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',

  // Only relevant for trusted server-side use. Browser calls use the proxy below.
  GEMINI_USE_BEARER: false,

  // Optional proxy
  // `npm start` serves this app and its Gemini proxy at localhost:3000.
  GEMINI_PROXY_URL: window.location.protocol === 'http:' || window.location.protocol === 'https:'
    ? window.location.origin
    : 'http://localhost:3000',

  // Limits
  MAX_PAYLOAD_CHARS: 32000,
  MAX_OUTPUT_TOKENS: 4096,
  TEMPERATURE: 0.1,
};
