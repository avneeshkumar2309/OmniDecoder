'use strict';

// Dependency-free local web server and secure Gemini proxy. Start with
// `npm.cmd start` after setting GEMINI_API_KEY in the environment.
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;

// Load local development settings without adding a runtime dependency. Existing
// environment variables win, so deployments can supply secrets normally.
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    process.env[match[1]] = value;
  }
}

const port = Number(process.env.PORT || 3000);
const allowedOrigin = process.env.GEMINI_ALLOWED_ORIGIN || `http://localhost:${port}`;
const apiKey = process.env.GEMINI_API_KEY;
const defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const allowedModels = new Set(
  (process.env.GEMINI_ALLOWED_MODELS || 'gemini-2.5-flash,gemini-2.5-flash-lite')
    .split(',').map((model) => model.trim()).filter(Boolean)
);
const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (allowedOrigin === '*' || origin === allowedOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1024 * 1024) throw new Error('Request body exceeds 1 MB.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function proxyGemini(req, res, model) {
  if (!apiKey) return sendJson(res, 503, { error: 'Gemini proxy is not configured. Set GEMINI_API_KEY and restart npm start.' });
  if (!allowedModels.has(model)) return sendJson(res, 400, { error: `Model is not allowed: ${model}` });

  try {
    const body = await readJson(req);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    });
    const responseText = await response.text();
    res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'application/json' });
    res.end(responseText);
  } catch (error) {
    const status = error instanceof SyntaxError || /1 MB/.test(error.message) ? 400 : 502;
    if (status === 502) console.error('Gemini request failed:', error.message);
    sendJson(res, status, { error: status === 400 ? error.message : 'Could not contact the Gemini API.' });
  }
}

function serveStatic(res, pathname) {
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(`${root}${path.sep}`)) return sendJson(res, 403, { error: 'Forbidden' });
  fs.readFile(filePath, (error, data) => {
    if (error) return sendJson(res, error.code === 'ENOENT' ? 404 : 500, { error: 'Not found' });
    res.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      // Development tool: always serve the latest HTML/JS/CSS after a restart.
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
}

http.createServer((req, res) => {
  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (req.method === 'GET' && pathname === '/_health') return sendJson(res, apiKey ? 200 : 503, { ok: Boolean(apiKey), proxy: true, defaultModel });
  const match = pathname.match(/^\/(?:api\/gemini|generate)\/([a-zA-Z0-9._-]+)$/);
  if (req.method === 'POST' && match) return proxyGemini(req, res, match[1]);
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(res, pathname);
  return sendJson(res, 404, { error: 'Not found' });
}).listen(port, () => {
  if (!apiKey) console.warn('GEMINI_API_KEY is not set. Gemini requests will return 503.');
  console.log(`OmniDecoder is available at http://localhost:${port}`);
});
