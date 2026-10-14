// Node runner for decoder.js (emulates minimal browser globals)
'use strict';

// Expose window as the global object so decoder.js can attach window.OmniDecoder
global.window = global;

// Minimal OmniConfig to satisfy checks. Prefer providing a real API key via environment variable for local tests.
window.OmniConfig = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'PASTE_YOUR_GEMINI_API_KEY_HERE',
  GEMINI_ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
  GEMINI_MODEL: 'gemini-2.5-flash',
  GEMINI_MODEL_FALLBACK: 'gemini-2.5-flash-lite',
  TEMPERATURE: 0.0,
  MAX_OUTPUT_TOKENS: 1024,
  MAX_PAYLOAD_CHARS: 10000,
  GEMINI_USE_BEARER: false,
  GEMINI_PROXY_URL: process.env.GEMINI_PROXY_URL || null,
};

// Provide atob / btoa for Node using Buffer
global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
global.btoa = (bin) => Buffer.from(bin, 'binary').toString('base64');

// Ensure fetch exists (Node 18+ has fetch; otherwise use node-fetch if installed)
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    // fallback stub that throws if used (we won't call external APIs in this runner)
    global.fetch = async () => { throw new Error('fetch is not available in this environment'); };
  }
}

// Load the decoder (it will attach window.OmniDecoder)
require('./decoder.js');

const Omni = window.OmniDecoder;
if (!Omni) {
  console.error('Failed to load OmniDecoder');
  process.exit(2);
}

const payload = process.argv[2] || 'SGVsbG8gV29ybGQ='; // default test
console.log('Payload:', payload);

try {
  // Run a few analyzer functions and print JSON for quick inspection
  const b64 = Omni.analyzeBase64Padding(payload);
  const zw  = Omni.inspectZeroWidth(payload);

  // runPipeline may expect browser options; call if available
  let pipeline = null;
  if (typeof Omni.runPipeline === 'function') {
    try { pipeline = Omni.runPipeline(payload, { verbose: false }); } catch(e) { pipeline = { error: String(e) }; }
  }

  const out = { payload, base64Analysis: b64, zeroWidth: zw, pipeline };
  console.log(JSON.stringify(out, null, 2));
} catch (err) {
  console.error('Error running analyzers:', err);
  process.exit(3);
}
