OmniDecoder — Advanced Forensic Encoding & Cryptanalysis Platform

Forensic Web Platform for Steganography Detection, Covert Channel Extraction, Recursive Decoding, and Classical Cryptanalysis.

OmniDecoder UI
Zero Dependencies
Forensic Engine
Security & Privacy

📖 Overview

OmniDecoder is an advanced, client-side digital forensics and cryptanalysis workbench designed to detect and decode what standard decoders miss. It specializes in detecting hidden steganographic channels, multi-layered recursive encodings, covert padding bit channels, and classical cryptographic algorithms—all running locally in your browser with zero dependencies.

⚡ Core Analysis Modules

OmniDecoder features 11 specialized forensic modules accessible via a unified dark-mode dashboard:

1. 👁️ Zero-Width Steganography Inspector
Detects Hidden Unicode Characters: Scans for Zero-Width Space (U+200B), Zero-Width Non-Joiner (U+200C), Zero-Width Joiner (U+200D), Byte Order Mark (U+FEFF), Left-to-Right / Right-to-Left Marks (U+200E/U+200F), Word Joiners (U+2060), and Soft Hyphens (U+00AD).
Bitstream Reconstruction: Automatically decodes binary bitstreams hidden via invisible characters into ASCII strings.
Text Sanitization: Generates clean, stego-free text and visual annotation maps of where hidden characters were positioned.
2. 🔐 Base64 Padding Bits Analyzer
Covert Channel Extraction: In Base64 encoding, = padding leaves 2 or 4 unused bits in the final byte. OmniDecoder extracts these unused bits to recover covert messages embedded within the padding.
Standards Support: Supports both standard RFC 4648 (+/) and URL-safe (-_) Base64 alphabets.
Anomaly Detection: Flags anomalous non-zero padding bits and calculates character frequency distributions.
3. 🔤 Custom Alphabet & Base-X Auto-Tuner
Multi-Alphabet Detection: Automatically matches unknown payloads against known Base encodings:
Base64 (Standard & URL-safe)
Base62, Base58 (Bitcoin), Base36
Base32 (Standard & Base32Hex)
Base85 (ASCII85) & Hexadecimal
Automated Candidate Decoding: Scores decoded byte streams by printable ASCII ratio and Shannon entropy to identify the correct alphabet.
4. 📊 Shannon Entropy & Binary Inspector
Mathematical Entropy Calculation: Computes exact Shannon entropy 
𝐻
(
𝑋
)
=
−
∑
𝑃
(
𝑥
𝑖
)
log
⁡
2
𝑃
(
𝑥
𝑖
)
H(X)=−∑P(x
i
	​

)log
2
	​

P(x
i
	​

) (scale 0.0 to 8.0) to assess randomness and compression/encryption levels.
Byte Histogram: Displays byte distribution and top-byte frequency tables.
File Signature (Magic Bytes) Detection: Automatically identifies file headers including ZIP, Gzip, PNG, JPEG, GIF, BMP, PDF, ELF, PE Executables, SQLite, and 7-Zip.
5. 🔁 Recursive Multi-Layer Pipeline
Automated Deep Unwrap: Loops through multiple decoding layers in sequence (Base64, Hex, URL, Base32, ROT13, Zero-Width Stripping, XOR-0xFF).
Cycle & Loop Detection: Detects infinite decoding loops and maintains state history.
Step-by-Step Trajectory: Logs each decoding phase along with intermediate outputs and entropy changes.
6. ⚡ XOR Single-Byte Brute Force
Full Key-Space Sweep: Tests keys 0x00 through 0xFF (0–255).
Heuristic English Scoring: Uses frequency analysis, common English trigrams/words (the, flag, ctf, password), and printable ratios to rank results.
7. 🔄 Caesar / ROT Cipher Solver
Rotational Shifts: Evaluates all 26 alphabet rotation shifts (including ROT13).
Statistical Language Modeling: Ranks candidate solutions using standard English character frequency distributions (ETAOIN...).
8. 🧹 Interleaved Noise Pattern Stripper
Periodic Decoy Removal: Detects repeating decoy strings (e.g. CvVv:vVv\... with noise separator vVv) inserted between characters.
Auto-Period Detection: Tests candidate periods and strips periodic noise without requiring manual separator inputs.
9. 🤖 AI Auto-Analyzer & Fingerprinting
Instant Fingerprint Heuristics: Detects JWT tokens, hashes, binary strings, HTML entities, and encoding formats.
Optional LLM Integration: Connects with Google Gemini (e.g., Gemini 2.5 Flash / 1.5 Flash) via secure backend proxy or direct configuration for deep contextual analysis and CTF writeups.
10. #️⃣ Hash Analyzer & Wordlist Cracker
Signature Recognition: Identifies 30+ hash formats (MD5, SHA-1, SHA-256, SHA-512, NTLM, CRC32, bcrypt, Argon2, PBKDF2, MySQL, etc.) by character length and regex patterns.
Client-Side Dictionary Attack: Uses the browser's native SubtleCrypto API to test input hashes against common credential dictionaries at high speeds.
11. 🔓 Classical Encryption Breaker
Vigenère Cipher: Automatically calculates Index of Coincidence (IC) to recover key lengths and uses Kasiski/frequency analysis to deduce keys.
Rail Fence Cipher: Brute-forces rail depths (2 to 10 rails) and scores reconstructions.
Affine Cipher: Tests modular multiplicative inverses and additive shifts.
Atbash & Columnar Transposition: Complete decryption and structural transposition solvers.
📁 Project Architecture
text
OmniDecoder/
├── index.html        # Forensic terminal dashboard & UI layout
├── decoder.js        # Core decoding engine, cryptanalysis routines & stego parsers
├── style.css         # Dark forensic cyber-terminal styling & responsive grid
└── README.md         # Project documentation & technical specifications
🚀 Getting Started
1. Run Locally (No Installation Needed)

OmniDecoder is built with zero external npm/Node dependencies for its core features:

Double-click index.html or open it in any modern browser (Chrome, Firefox, Edge, Safari).
Paste your payload into the Input Payload text box.
Select an analysis module from the left sidebar and click ▶ Analyze.
2. Quick Testing with Built-in Samples

Click the 🎲 Sample button in the input panel to automatically populate valid test data for whichever module is currently selected.

🛠️ Technology Stack
Component	Technology	Rationale
Engine	Vanilla JavaScript (ES2022)	High-speed bitwise math, regex, zero bundle overhead
Cryptography	Web Crypto API (crypto.subtle)	Hardware-accelerated hashing in modern browsers
Interface	HTML5 Semantic & Modern CSS Grid	Low-latency UI with cyberpunk forensic styling
Privacy	100% In-Browser Execution	Sensitive CTF flags, tokens, and keys never leave your machine
🎯 Use Cases
CTF (Capture The Flag) Competitions: Rapidly inspect mystery ciphers, multi-wrapped payloads, and hidden steganographic flags.
Malware & Phishing Forensics: De-obfuscate PowerShell commands, URL-encoded exploit payloads, and hidden zero-width homoglyphs.
Security Audits & Pen-testing: Uncover covert data exfiltration channels hiding in Base64 padding or Unicode streams.
Cryptography Education: Visually understand Shannon entropy, Index of Coincidence, and classical substitution/transposition ciphers.
📄 License

Open-source under the MIT License. Free for personal, educational, and security research use.

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
