# 🔍 OmniDecoder
### Advanced Forensic Encoding, Steganography Detection & Classical Cryptanalysis Platform

<p align="center">
  <strong>Decode the hidden. Detect the invisible. Investigate the unknown.</strong>
</p>

<p align="center">
  A browser-based digital forensics workbench for detecting covert Unicode channels, analyzing encoded payloads, recursively decoding obfuscated data, and solving classical ciphers — with a privacy-first, client-side architecture.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Web%20Browser-00D9FF?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Web Platform"/>
  <img src="https://img.shields.io/badge/Language-Vanilla%20JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"/>
  <img src="https://img.shields.io/badge/Dependencies-Zero%20Core-00C853?style=for-the-badge" alt="Zero Core Dependencies"/>
  <img src="https://img.shields.io/badge/Execution-Client--Side-4CAF50?style=for-the-badge" alt="Client Side"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Domain-Digital%20Forensics-7C4DFF?style=flat-square" alt="Digital Forensics"/>
  <img src="https://img.shields.io/badge/Focus-Steganography-FF5252?style=flat-square" alt="Steganography"/>
  <img src="https://img.shields.io/badge/Focus-Cryptanalysis-448AFF?style=flat-square" alt="Cryptanalysis"/>
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License"/>
</p>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Key Highlights](#-key-highlights)
- [Core Forensic Modules](#-core-forensic-modules)
- [Architecture](#-project-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Usage Workflow](#-usage-workflow)
- [Use Cases](#-use-cases)
- [Security and Privacy](#-security-and-privacy)
- [Limitations](#-limitations)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 Overview

**OmniDecoder** is a browser-based digital forensics and cryptanalysis platform designed to investigate suspicious text, encoded data, hidden Unicode sequences, and obfuscated payloads that conventional decoding tools may overlook.

Instead of relying on a single decoder, OmniDecoder combines multiple forensic techniques in one interface. Its analysis engine can inspect suspicious payloads, reconstruct hidden bitstreams, evaluate encoding candidates, recursively unwrap supported transformations, analyze binary characteristics, and rank possible cipher solutions.

The platform is designed around three principles:

- **Deterministic Analysis:** Use reproducible decoding rules, bitwise operations, and statistical heuristics.
- **Layered Investigation:** Combine multiple analysis techniques to investigate complex or nested payloads.
- **Privacy by Design:** Perform core analysis locally in the browser without requiring a remote processing service.

Whether you are investigating a CTF challenge, studying covert communication, or examining a suspicious encoded string, OmniDecoder provides a unified workspace for the analysis process.

> **Project goal:** Build a lightweight, extensible forensic workbench that helps analysts discover what is hidden inside data before drawing conclusions about its meaning.

---

## ⚡ Key Highlights

- 🔎 **Invisible Character Detection** — Identify zero-width Unicode characters and other suspicious formatting markers.
- 🧬 **Covert Channel Inspection** — Examine non-canonical Base64 padding bits for potential hidden information.
- 🔁 **Recursive Decoding** — Apply supported decoding transformations across multiple layers.
- 📊 **Entropy Analysis** — Measure byte-level Shannon entropy and inspect frequency distributions.
- 🧪 **Encoding Fingerprinting** — Evaluate candidate Base encodings using structural checks and statistical heuristics.
- 🔐 **Cryptanalysis Toolkit** — Investigate XOR, Caesar, Vigenère, Affine, Rail Fence, and other classical ciphers.
- 🧾 **Hash Identification** — Suggest possible hash formats and test authorized wordlists against supported digest algorithms.
- 🗂️ **Binary Inspection** — Examine byte histograms and recognize common file signatures.
- 🧠 **Automated Analysis** — Combine deterministic fingerprints with optional AI-assisted interpretation.
- 🛡️ **Local-First Processing** — Keep core forensic operations in the browser.

---

## 🧰 Core Forensic Modules

OmniDecoder organizes its functionality into 11 specialized analysis modules.

### 1. 👁️ Zero-Width Steganography Inspector

Investigates invisible Unicode characters that may carry hidden information within otherwise ordinary text.

**Capabilities**
- Detect zero-width spaces (`U+200B`), zero-width non-joiners (`U+200C`), and zero-width joiners (`U+200D`).
- Identify byte-order marks, directional marks, word joiners, and soft hyphens.
- Extract candidate binary streams from supported character-to-bit mappings.
- Reconstruct potential ASCII messages from recovered bitstreams.
- Generate sanitized text and character-position annotations.

**Forensic value:** Helps identify suspicious text transformations and covert data embedded in Unicode sequences.

### 2. 🔐 Base64 Padding-Bit Analyzer

Examines unused bits in the final Base64 quantum for non-canonical encodings and potential covert-channel artifacts.

**Capabilities**
- Support standard and URL-safe Base64 alphabets.
- Inspect the unused bits associated with Base64 padding.
- Flag non-zero unused bits where applicable.
- Extract candidate bit sequences for further investigation.
- Calculate character-frequency distributions.

**Forensic value:** Identifies non-canonical Base64 representations that may warrant closer inspection.

**Important:** Non-zero padding bits alone do not prove steganography. Extraction depends on the encoding variant and the suspected embedding scheme.

### 3. 🔤 Custom Alphabet & Base-X Auto-Tuner

Evaluates candidate encodings when the representation of an input payload is unknown.

**Supported candidate formats**
- Base64 and Base64URL
- Base62
- Base58 using the Bitcoin alphabet
- Base36
- Base32 and Base32Hex
- Base85 / ASCII85
- Hexadecimal

**Capabilities**
- Validate candidate alphabets and structural constraints.
- Decode compatible inputs into byte sequences.
- Rank candidate outputs using printable-character ratios and entropy heuristics.
- Present candidate interpretations for analyst verification.

**Forensic value:** Helps narrow down possible encodings without relying entirely on manual identification.

### 4. 📊 Shannon Entropy & Binary Inspector

Analyzes byte-level statistical characteristics to help distinguish structured data from apparently random or compressed content.

**Capabilities**
- Calculate Shannon entropy on a scale of 0–8 bits per byte.
- Generate byte-frequency histograms.
- Identify frequently occurring byte values.
- Detect common file signatures, including:
  - ZIP and GZIP
  - PNG, JPEG, GIF, and BMP
  - PDF
  - ELF and PE executables
  - SQLite databases
  - 7-Zip archives

The Shannon entropy of a byte distribution is defined as:

\[
H(X)=-\sum_{i=1}^{n}P(x_i)\log_2P(x_i)
\]

**Forensic value:** Provides statistical evidence that can help guide further investigation.

*Entropy is a heuristic, not a definitive encryption or malware detector. Compressed data, encrypted data, and some legitimate binary formats may all exhibit high entropy.*

### 5. 🔁 Recursive Multi-Layer Decoding Pipeline

Automates the investigation of payloads that may contain several layers of encoding or obfuscation.

**Supported transformations may include**
- Base64 decoding
- Hexadecimal decoding
- URL decoding
- Base32 decoding
- ROT13 transformation
- Zero-width character removal
- Single-byte XOR with `0xFF`

**Capabilities**
- Apply compatible transformations iteratively.
- Maintain an analysis history.
- Detect repeated states and decoding cycles.
- Record intermediate outputs and entropy changes.
- Present a step-by-step decoding trajectory.

**Forensic value:** Reduces the manual effort required to inspect nested encodings.

*The pipeline should only apply transformations that satisfy their respective validation rules; arbitrary decoding sequences can produce misleading output.*

### 6. ⚡ Single-Byte XOR Analyzer

Tests all 256 possible single-byte XOR keys against an input payload.

**Capabilities**
- Sweep the key space from `0x00` to `0xFF`.
- Evaluate printable-character ratios.
- Score candidate outputs using English character frequencies.
- Detect common words and patterns, including `the`, `flag`, `ctf`, and `password`.
- Rank candidate plaintexts for analyst review.

**Forensic value:** Useful for educational cryptanalysis and CTF challenges involving single-byte XOR obfuscation.

### 7. 🔄 Caesar & ROT Cipher Solver

Evaluates rotational substitution ciphers using exhaustive search and basic language statistics.

**Capabilities**
- Test all 26 Caesar shifts.
- Include ROT13 and other alphabetic rotations.
- Rank candidate plaintexts using English character-frequency distributions.
- Display alternative interpretations for comparison.

**Forensic value:** Provides a quick way to investigate simple substitution-based obfuscation.

### 8. 🧹 Interleaved Noise Pattern Stripper

Investigates strings containing repeated separators or decoy sequences inserted between meaningful characters.

**Capabilities**
- Detect candidate periodic noise patterns.
- Evaluate potential repetition intervals.
- Remove suspected separators under configurable rules.
- Compare candidate reconstructions.

**Forensic value:** Helps analyze deliberately obscured strings used in puzzle challenges and simple data-hiding schemes.

*Automatic noise removal is heuristic and should preserve the original input for comparison.*

### 9. 🤖 AI-Assisted Auto-Analyzer & Fingerprinting

Combines format recognition with optional language-model assistance to provide contextual analysis.

**Fingerprinting targets**
- JWT-like tokens
- Hash-like strings
- Binary representations
- HTML entities
- Common encoded formats
- Structured payload patterns

**Optional AI integration**
- Explain candidate decoding paths.
- Interpret recovered text in context.
- Help document CTF investigation steps.
- Generate preliminary forensic notes.

The optional AI integration can use a compatible Google Gemini model through a configured integration.

**Forensic value:** Adds contextual interpretation to deterministic analysis.

*AI-generated conclusions are suggestions, not forensic proof. Validate findings using reproducible decoding steps and independent evidence.*

### 10. #️⃣ Hash Analyzer & Wordlist Tester

Recognizes candidate digest formats and supports controlled dictionary testing against compatible hashes.

**Capabilities**
- Identify possible formats using length and character-pattern heuristics.
- Support candidate formats such as MD5, SHA-1, SHA-256, SHA-512, NTLM, CRC32, bcrypt, Argon2, PBKDF2, and selected MySQL hash formats where implemented.
- Use the browser's Web Crypto API for supported digest algorithms.
- Compare candidate passwords against a supplied or built-in wordlist.
- Report matches when a tested candidate produces the expected digest.

**Forensic value:** Useful for authorized password-recovery exercises, CTFs, and security education.

**Technical note:** Hash identification by appearance is inherently ambiguous. Algorithms such as bcrypt, Argon2, and PBKDF2 require algorithm-specific verification and parameters; they cannot all be treated as simple fixed-length digests.

### 11. 🔓 Classical Cryptanalysis Workbench

Provides candidate solvers for classical encryption and transposition techniques.

**Supported cipher families**
- **Vigenère Cipher:** Index of Coincidence, key-length estimation, and frequency-based key recovery.
- **Rail Fence Cipher:** Brute-force rail depths from 2 to 10.
- **Affine Cipher:** Modular inverse calculation and exhaustive key evaluation.
- **Atbash Cipher:** Alphabet-reversal transformation.
- **Columnar Transposition:** Candidate reconstruction using transposition structure and scoring heuristics.

**Forensic value:** Supports classical cryptanalysis exercises and the investigation of educational cipher challenges.

---

## 🏗️ Project Architecture

The core application uses a lightweight, modular browser architecture.

```text
OmniDecoder/
│
├── index.html        # Forensic dashboard and interface
├── style.css         # Responsive dark-mode styling
├── decoder.js        # Decoding, steganography and analysis engine
└── README.md         # Documentation
```

### Processing Flow

```text
             ┌──────────────────────┐
             │   Input Payload      │
             │ Text / Encoded Data  │
             └──────────┬───────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │ Input Normalization  │
             │ Format Fingerprinting│
             └──────────┬───────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │ Forensic Analysis    │
             │                      │
             │ • Unicode Stego      │
             │ • Base Encoding       │
             │ • Binary & Entropy    │
             │ • Hash Inspection     │
             │ • Cipher Analysis     │
             └──────────┬───────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │ Recursive Pipeline   │
             │ Candidate Ranking    │
             └──────────┬───────────┘
                        │
                        ▼
             ┌──────────────────────┐
             │ Results & Evidence   │
             │ Intermediate Outputs │
             │ Analysis Summary     │
             └──────────────────────┘
```

The optional AI integration is separate from the core local-analysis pipeline and should only receive data when the user explicitly enables that functionality.

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|---|---|---|
| Core Engine | Vanilla JavaScript (ES2022) | Decoding, parsing, bitwise operations, and statistical analysis |
| User Interface | HTML5 | Semantic structure and input controls |
| Styling | Vanilla CSS3 | Responsive layout and forensic dashboard styling |
| Cryptographic APIs | Web Crypto API | Supported digest operations |
| Visualization | Canvas / Chart.js, if configured | Entropy and byte-frequency visualization |
| Optional AI | Google Gemini API | Contextual analysis and explanation |
| Runtime | Modern web browser | Local execution of core modules |

**Core dependency policy:** The primary analysis engine is designed to run without external npm packages. Any optional visualization or AI integration may introduce additional dependencies or external network communication.

---

## 🚀 Getting Started

### Prerequisites

- A modern browser such as Chrome, Firefox, Edge, or Safari.
- A local copy of the repository.
- No Node.js installation is required for the core application if it uses only browser-compatible APIs.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/OmniDecoder.git
cd OmniDecoder
```

Replace `YOUR_USERNAME` with your GitHub username and adjust the repository name if necessary.

### 2. Launch the Application

Open `index.html` in your browser.

Alternatively, serve the project locally using Python:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

A local HTTP server can improve compatibility with browser APIs and development workflows.

### 3. Start Analyzing

1. Open the OmniDecoder dashboard.
2. Select the appropriate forensic module.
3. Paste the suspicious text or encoded payload into the input panel.
4. Click **Analyze**.
5. Review the decoded output, candidate results, and intermediate analysis steps.
6. Preserve the original payload when documenting findings.

If sample payloads are implemented in the interface, use the **Sample** control to test individual modules.

---

## 🔬 Usage Workflow

A typical investigation follows this sequence:

1. **Preserve:** Keep an unchanged copy of the original input.
2. **Fingerprint:** Inspect its structure and identify likely formats.
3. **Analyze:** Run the relevant Unicode, binary, encoding, or cryptanalysis module.
4. **Decode:** Apply supported transformations and inspect intermediate outputs.
5. **Validate:** Compare candidate results against independent evidence.
6. **Document:** Record the input, transformation sequence, output, and limitations.

For incident-response work, this workflow should be supplemented with appropriate evidence acquisition, integrity verification, timestamps, and chain-of-custody procedures.

---

## 🎯 Use Cases

### 🏁 Capture the Flag (CTF)
- Investigate layered Base encodings and XOR-obfuscated payloads.
- Detect hidden Unicode sequences.
- Analyze classical ciphers and candidate flags.
- Automate common decoding workflows.

### 🛡️ Malware & Phishing Analysis
- Inspect suspicious encoded text and command fragments.
- Identify potential obfuscation patterns.
- Analyze embedded binary representations.
- Examine hidden Unicode characters in copied messages or URLs.

### 🔍 Security Auditing
- Investigate potential covert channels in text-based data.
- Detect non-canonical encoding representations.
- Examine suspicious payloads during authorized security assessments.

### 🎓 Cryptography & Digital Forensics Education
- Explore Shannon entropy and byte distributions.
- Understand classical cipher-solving techniques.
- Compare recursive decoding strategies.
- Study the limitations of heuristic detection.

---

## 🔐 Security & Privacy

OmniDecoder is designed around local-first forensic analysis.

- **Local processing:** Core decoding and analysis can run directly in the browser.
- **No mandatory backend:** The basic workflow does not require a remote processing server.
- **Optional network integrations:** AI-assisted analysis may transmit submitted data to an external provider.
- **Sensitive payloads:** Avoid sending credentials, private keys, personal data, or confidential evidence to external services.
- **Untrusted inputs:** Treat decoded output as untrusted text. Do not execute recovered scripts, commands, or files simply because they appear readable.
- **Evidence preservation:** Keep original inputs unchanged and record transformation steps when reproducibility matters.

> **Privacy qualification:** Client-side execution alone does not guarantee complete privacy. Verify the actual network behavior of the deployed application, especially when optional APIs, external scripts, analytics, or third-party libraries are enabled.

---

## ⚠️ Limitations

OmniDecoder is an analysis aid, not an automated source of definitive forensic conclusions.

- Statistical scoring may rank incorrect decoding candidates above the correct result.
- High entropy does not independently establish encryption or malicious intent.
- A recognizable string pattern does not uniquely identify a hash algorithm.
- Hidden Unicode characters may be legitimate components of multilingual text.
- Recursive transformations can produce accidental or misleading output.
- AI-assisted explanations may contain errors and must be independently validated.
- Hash cracking success depends on the algorithm, available candidates, computational cost, and correct parameters.
- A file signature identifies a possible format; it does not establish that a file is safe.

Actual capabilities depend on the algorithms implemented and tested in the repository.

---

## 🗺️ Roadmap

Potential future improvements include:

- [ ] Modular analysis engine with isolated forensic modules.
- [ ] Drag-and-drop file analysis.
- [ ] Exportable JSON and HTML analysis reports.
- [ ] Evidence hashes and reproducible transformation logs.
- [ ] Improved encoding confidence scoring.
- [ ] Additional language models for cipher analysis.
- [ ] Expanded file-signature database.
- [ ] Worker-based processing for large payloads.
- [ ] Unit tests and regression test fixtures.
- [ ] Content Security Policy and hardened optional AI integration.
- [ ] Improved accessibility and mobile responsiveness.

*Roadmap items represent planned or potential enhancements, not necessarily implemented features.*

---

## 🤝 Contributing

Contributions, bug reports, feature suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Submit a pull request with a clear description of the change.

When contributing forensic detection rules, include test cases for both valid inputs and edge cases. Prefer reproducible results over heuristic claims that cannot be independently verified.

---

## 📜 License

This project is intended to be distributed under the **MIT License**.

If the repository does not already contain a `LICENSE` file, add the complete MIT License text before claiming that the project is formally licensed under it.

---

<p align="center">
  <strong>OmniDecoder — Investigate Every Layer. Trust Verified Evidence.</strong>
</p>

<p align="center">
  Built for digital forensics, security research, and cryptanalysis education.
</p>


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
