# OmniDecoder

OmniDecoder analyzes encoded and steganographic payloads locally and can ask Gemini for an assisted analysis.

## Start the app with Gemini

1. Install dependencies:

   ```powershell
   npm.cmd install
   ```

2. Create a fresh Gemini API key in [Google AI Studio](https://aistudio.google.com/app/apikey), then put it in the local `.env` file (this file is ignored by Git):

   ```text
   GEMINI_API_KEY=your_new_key
   ```

3. Start the server:

   ```powershell
   npm.cmd start
   ```

4. Open [http://localhost:3000](http://localhost:3000) and select **Gemini 2.5 Flash** in the AI Analyzer.

The server forwards requests to Gemini's `v1beta/models/{model}:generateContent` API using the `x-goog-api-key` header. The browser never receives the key.

## Configuration

- `GEMINI_API_KEY` (required): API key from Google AI Studio.
- `GEMINI_MODEL` (optional): defaults to `gemini-2.5-flash`.
- `GEMINI_ALLOWED_MODELS` (optional): comma-separated allowlist; defaults to `gemini-2.5-flash,gemini-2.5-flash-lite`.
- `PORT` (optional): defaults to `3000`.
- `GEMINI_ALLOWED_ORIGIN` (optional): defaults to the local server origin.

`config.js` deliberately contains no API key. Do not put a key there or commit a `.env` file.

## Checks

```powershell
npm.cmd test
node mock_gemini_test.js
```

If a key was ever stored in source code, replace it in AI Studio and disable the old key after the replacement has been verified.
