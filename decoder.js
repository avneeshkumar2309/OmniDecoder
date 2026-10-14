// ===== OmniDecoder - Core Logic Engine =====
// Zero-Width Inspector, Base64 Padding Analyzer, Custom Alphabet Tuner,
// Shannon Entropy Inspector, Recursive Deep Decoder

'use strict';

// ─── 1. ZERO-WIDTH CHARACTER INSPECTOR ────────────────────────────────────────

const ZW_MAP = {
  '\u200B': { name: 'ZWSP',  hex: 'U+200B', bit: '0' },
  '\u200C': { name: 'ZWNJ',  hex: 'U+200C', bit: '1' },
  '\u200D': { name: 'ZWJ',   hex: 'U+200D', bit: null },
  '\uFEFF': { name: 'BOM',   hex: 'U+FEFF', bit: null },
  '\u200E': { name: 'LRM',   hex: 'U+200E', bit: null },
  '\u200F': { name: 'RLM',   hex: 'U+200F', bit: null },
  '\u2060': { name: 'WJ',    hex: 'U+2060', bit: null },
  '\u2061': { name: 'FA',    hex: 'U+2061', bit: null },
  '\u2062': { name: 'IT',    hex: 'U+2062', bit: null },
  '\u2063': { name: 'IS',    hex: 'U+2063', bit: null },
  '\u2064': { name: 'ITSA',  hex: 'U+2064', bit: null },
  '\u00AD': { name: 'SHY',   hex: 'U+00AD', bit: null },
};

function inspectZeroWidth(text) {
  const found = [];
  const cleaned = [];
  const annotated = [];
  let bitStream = '';
  let hasBits = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const info = ZW_MAP[ch];
    if (info) {
      found.push({ index: i, char: ch, ...info });
      annotated.push(`[${info.name}]`);
      if (info.bit !== null) {
        bitStream += info.bit;
        hasBits = true;
      }
    } else {
      cleaned.push(ch);
      annotated.push(ch);
    }
  }

  let hiddenText = '';
  if (hasBits && bitStream.length >= 8) {
    const padded = bitStream.padEnd(Math.ceil(bitStream.length / 8) * 8, '0');
    for (let i = 0; i < padded.length; i += 8) {
      const byte = padded.slice(i, i + 8);
      const code = parseInt(byte, 2);
      if (code > 0) hiddenText += String.fromCharCode(code);
    }
  }

  return {
    found,
    cleanedText: cleaned.join(''),
    annotatedText: annotated.join(''),
    bitStream,
    hiddenText,
    totalHidden: found.length,
  };
}

// ─── 2. BASE64 PADDING BIT ANALYZER ──────────────────────────────────────────

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_URL   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function analyzeBase64Padding(b64Input) {
  const clean = b64Input.replace(/\s/g, '');
  const isUrl = /[-_]/.test(clean) && !/[+/]/.test(clean);
  const alphabet = isUrl ? B64_URL : B64_CHARS;

  // Validate
  const validRe = isUrl ? /^[A-Za-z0-9\-_=]+$/ : /^[A-Za-z0-9+/=]+$/;
  if (!validRe.test(clean)) {
    return { error: 'Input contains characters not in standard Base64 alphabet.' };
  }

  const padCount = (clean.match(/=/g) || []).length;
  const payload = clean.replace(/=/g, '');

  // Decode normally
  let decoded = '';
  let decodeError = null;
  try {
    const bin = isUrl ? clean.replace(/-/g, '+').replace(/_/g, '/') : clean;
    decoded = atob(bin.replace(/=/g, '') + '='.repeat(padCount));
  } catch (e) {
    decodeError = e.message;
  }

  // Extract covert bits from padding
  let covertBits = '';
  let covertText = '';
  const analysisSteps = [];

  if (padCount === 1) {
    // Last group has 3 b64 chars → 18 bits, only 16 needed → 2 covert bits
    const lastIdx = payload.length - 1;
    const lastVal = alphabet.indexOf(payload[lastIdx]);
    if (lastVal !== -1) {
      const covert = lastVal & 0x03; // bottom 2 bits
      covertBits = covert.toString(2).padStart(2, '0');
      analysisSteps.push({
        label: 'Last B64 char',
        char: payload[lastIdx],
        value: lastVal,
        binaryFull: lastVal.toString(2).padStart(6, '0'),
        usedBits: lastVal.toString(2).padStart(6, '0').slice(0, 4),
        covertBits: covertBits,
        covertValue: covert,
      });
    }
  } else if (padCount === 2) {
    // Last group has 2 b64 chars → 12 bits, only 8 needed → 4 covert bits
    const lastIdx = payload.length - 1;
    const lastVal = alphabet.indexOf(payload[lastIdx]);
    if (lastVal !== -1) {
      const covert = lastVal & 0x0F; // bottom 4 bits
      covertBits = covert.toString(2).padStart(4, '0');
      analysisSteps.push({
        label: 'Last B64 char',
        char: payload[lastIdx],
        value: lastVal,
        binaryFull: lastVal.toString(2).padStart(6, '0'),
        usedBits: lastVal.toString(2).padStart(6, '0').slice(0, 2),
        covertBits: covertBits,
        covertValue: covert,
      });
    }
  }

  // BUG-06 fix: only decode covert bits as text when the result is printable ASCII.
  // Without this, 2-bit padding (values 0–3) produces control chars and false positives.
  if (covertBits && covertBits !== '0'.repeat(covertBits.length)) {
    const padded = covertBits.padEnd(Math.ceil(covertBits.length / 8) * 8, '0');
    if (padded.length >= 8) {
      const charCode = parseInt(padded.slice(0, 8), 2);
      if (charCode >= 0x20 && charCode <= 0x7E) {
        covertText = String.fromCharCode(charCode);
      }
    }
  }

  // Statistical anomaly: check all chars for off-alphabet-range values
  const charFreq = {};
  for (const ch of payload) {
    const val = alphabet.indexOf(ch);
    if (val !== -1) charFreq[ch] = (charFreq[ch] || 0) + 1;
  }

  return {
    isUrlSafe: isUrl,
    padCount,
    payloadLength: payload.length,
    decoded,
    decodeError,
    covertBits,
    covertText,
    analysisSteps,
    charFreq,
    // BUG-06 fix: hasCovertData requires non-zero bits AND printable decoded text
    hasCovertData: covertBits !== '' && covertBits !== '0'.repeat(covertBits.length) && covertText.length > 0,
  };
}

// ─── 3. CUSTOM ALPHABET & BASE-X AUTO-TUNER ───────────────────────────────────

const KNOWN_ALPHABETS = {
  'Base64 Standard': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
  'Base64 URL-Safe': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_',
  'Base62':          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  'Base58 (Bitcoin)':'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  'Base36':          '0123456789abcdefghijklmnopqrstuvwxyz',
  'Base32 Standard': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
  'Base32 Hex':      '0123456789ABCDEFGHIJKLMNOPQRSTUV',
  'Base85 (ASCII)':  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~',
  'Hex (lowercase)': '0123456789abcdef',
  'Hex (uppercase)': '0123456789ABCDEF',
};

function decodeBase58(str, alphabet) {
  if (!str) return null; // BUG-12 fix: guard against empty input
  const base = BigInt(alphabet.length);
  let num = BigInt(0);
  for (const ch of str) {
    const idx = alphabet.indexOf(ch);
    if (idx === -1) return null;
    num = num * base + BigInt(idx);
  }
  const bytes = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num = num / 256n;
  }
  // Leading zeros from leading alphabet[0] chars
  for (const ch of str) {
    if (ch === alphabet[0]) bytes.unshift(0);
    else break;
  }
  return bytes;
}

function decodeBase32(str, alphabet) {
  str = str.replace(/=/g, '').toUpperCase();
  const alphaUpper = alphabet.toUpperCase(); // BUG-03 fix: pre-compute outside loop
  let bits = '';
  for (const ch of str) {
    const idx = alphaUpper.indexOf(ch);
    if (idx === -1) return null;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return bytes;
}

function analyzeCustomAlphabet(input) {
  const chars = new Set(input.replace(/\s/g, ''));
  const charArray = [...chars].sort();
  const uniqueCount = chars.size;
  const inputClean = input.replace(/\s/g, '');

  // Character frequency
  const freq = {};
  for (const ch of inputClean) {
    freq[ch] = (freq[ch] || 0) + 1;
  }
  const sortedFreq = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  // Match against known alphabets
  const matches = [];
  for (const [name, alpha] of Object.entries(KNOWN_ALPHABETS)) {
    const alphaSet = new Set(alpha);
    const inputSet = new Set(inputClean);
    const intersection = [...inputSet].filter(c => alphaSet.has(c));
    const coverage = intersection.length / inputSet.size;
    const contained = [...inputSet].every(c => alphaSet.has(c));
    if (contained || coverage > 0.8) {
      matches.push({ name, alphabet: alpha, base: alpha.length, coverage: Math.round(coverage * 100), contained });
    }
  }
  // Prefer an exact, smallest alphabet match. For example, a hex string is
  // also legal Base64 text but Hex is the more specific interpretation.
  matches.sort((a, b) => (b.contained - a.contained) || (b.coverage - a.coverage) || (a.base - b.base));

  // Attempt decodes
  const decodeResults = [];
  for (const match of matches.slice(0, 3)) {
    let result = null;
    let decoded = null;
    try {
      if (match.name.startsWith('Base64')) {
        const bin = inputClean.replace(/-/g, '+').replace(/_/g, '/');
        const padded = bin + '='.repeat((4 - bin.length % 4) % 4);
        decoded = atob(padded);
        result = { format: match.name, text: decoded, bytes: Array.from(decoded, c => c.charCodeAt(0)) };
      } else if (match.name.startsWith('Base58')) {
        const bytes = decodeBase58(inputClean, match.alphabet);
        if (bytes) {
          decoded = String.fromCharCode(...bytes); // BUG-02 fix: null bytes (0x00) are valid — don't filter them
          result = { format: match.name, text: decoded, bytes };
        }
      } else if (match.name.startsWith('Base32')) {
        const bytes = decodeBase32(inputClean, match.alphabet);
        if (bytes) {
          decoded = String.fromCharCode(...bytes);
          result = { format: match.name, text: decoded, bytes };
        }
      } else if (match.name.startsWith('Hex')) {
        decoded = inputClean.match(/.{1,2}/g)?.map(h => String.fromCharCode(parseInt(h, 16))).join('') ?? null;
        if (decoded) result = { format: match.name, text: decoded, bytes: inputClean.match(/.{1,2}/g).map(h => parseInt(h, 16)) };
      }
    } catch (e) { /* ignore */ }
    if (result) {
      const outputBytes = result.bytes || Array.from(result.text, c => c.charCodeAt(0));
      const printable = outputBytes.filter(b => b >= 0x20 && b <= 0x7e).length;
      const printableRatio = outputBytes.length ? printable / outputBytes.length : 0;
      const textLike = /[a-z]{2,}/i.test(result.text) || /\s/.test(result.text);
      result.printableRatio = Math.round(printableRatio * 100);
      result.byteLength = outputBytes.length;
      result.hexPreview = outputBytes.slice(0, 32).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
      result.entropy = calcEntropy(outputBytes).toFixed(2);
      result.verdict = printableRatio >= 0.9 && textLike ? 'Readable text — likely a useful decode'
        : printableRatio >= 0.6 ? 'Partially readable — inspect before trusting'
        : 'Mostly binary — may be a file, ciphertext, or a false match';
      decodeResults.push(result);
    }
  }

  const readableResults = decodeResults.filter(r => r.printableRatio >= 60);
  const binaryCandidates = decodeResults.filter(r => r.printableRatio < 60);
  const best = readableResults[0] || null;
  const recommendation = best
    ? `${best.format} is the best current interpretation: ${best.verdict.toLowerCase()}.`
    : binaryCandidates.length
      ? 'These alphabets can decode the characters, but their output is not readable text. It may be a file, encrypted data, or simply a coincidental alphabet match.'
      : matches.length
      ? 'The characters fit one or more alphabets, but none produced a reliable decoded result.'
      : 'No known Base-X alphabet fits this character set. It may use a custom alphabet, encryption, or plain text.';

  return {
    uniqueCount,
    charArray,
    sortedFreq,
    matches,
    decodeResults,
    readableResults,
    binaryCandidates,
    best,
    recommendation,
    inputLength: inputClean.length,
  };
}

// ─── 4. SHANNON ENTROPY & FORENSIC BINARY INSPECTOR ──────────────────────────

const MAGIC_SIGNATURES = [
  { name: 'ZIP Archive',   bytes: [0x50, 0x4B, 0x03, 0x04], offset: 0 },
  { name: 'ZIP Archive',   bytes: [0x50, 0x4B, 0x05, 0x06], offset: 0 },
  { name: 'Gzip',          bytes: [0x1F, 0x8B],              offset: 0 },
  { name: 'PNG Image',     bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], offset: 0 },
  { name: 'JPEG Image',    bytes: [0xFF, 0xD8, 0xFF],        offset: 0 },
  { name: 'GIF Image',     bytes: [0x47, 0x49, 0x46, 0x38], offset: 0 },
  { name: 'BMP Image',     bytes: [0x42, 0x4D],              offset: 0 },
  { name: 'PDF Document',  bytes: [0x25, 0x50, 0x44, 0x46], offset: 0 },
  { name: 'ELF Binary',    bytes: [0x7F, 0x45, 0x4C, 0x46], offset: 0 },
  { name: 'PE Windows Exe',bytes: [0x4D, 0x5A],              offset: 0 },
  { name: 'RAR Archive',   bytes: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07], offset: 0 },
  { name: '7z Archive',    bytes: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], offset: 0 },
  { name: 'SQLite DB',     bytes: [0x53, 0x51, 0x4C, 0x69, 0x74, 0x65], offset: 0 },
  { name: 'Class File (Java)', bytes: [0xCA, 0xFE, 0xBA, 0xBE], offset: 0 },
  { name: 'WebP Image',    bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 },
];

function calcEntropy(bytes) {
  if (!bytes || bytes.length === 0) return 0;
  const freq = new Array(256).fill(0);
  for (const b of bytes) freq[b]++;
  let entropy = 0;
  const n = bytes.length;
  for (const count of freq) {
    if (count > 0) {
      const p = count / n;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

function buildByteHistogram(bytes) {
  const hist = new Array(256).fill(0);
  for (const b of bytes) hist[b]++;
  return hist;
}

function detectMagic(bytes) {
  const hits = [];
  for (const sig of MAGIC_SIGNATURES) {
    const offset = sig.offset;
    if (bytes.length < offset + sig.bytes.length) continue;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (bytes[offset + i] !== sig.bytes[i]) { match = false; break; }
    }
    if (match) hits.push(sig.name);
  }
  return hits;
}

function textToBytes(text) {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(text));
}

function hexToBytes(hexStr) {
  const clean = hexStr.replace(/\s/g, '');
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0) return null;
  const bytes = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return bytes;
}

function base64ToBytes(b64) {
  try {
    const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
    return Array.from(bin).map(c => c.charCodeAt(0));
  } catch { return null; }
}

function inspectEntropy(input, inputType = 'auto') {
  let bytes = null;
  let detectedType = inputType;

  if (inputType === 'auto') {
    const trimmed = input.trim();
    // BUG-10 fix: detect odd-length hex before it silently falls through to text mode
    const hexStripped = trimmed.replace(/\s/g, '');
    const looksLikeHex = /^[0-9a-fA-F\s]+$/.test(trimmed) && hexStripped.length > 1;
    if (looksLikeHex && hexStripped.length % 2 !== 0) {
      return { error: `Input looks like hex but has odd length (${hexStripped.length} chars). Pad the first byte with a leading zero (e.g. '0a' not 'a').` };
    }
    const hexBytes = hexToBytes(trimmed);
    if (hexBytes) { bytes = hexBytes; detectedType = 'hex'; }
    else {
      const b64Bytes = base64ToBytes(trimmed);
      // Plain words (for example "Hello") can technically be parsed as Base64.
      // Only auto-select Base64 when there is a signal such as padding/symbols or
      // when the decoded bytes look like readable text.
      const b64HasSignal = /[=+/_-]/.test(trimmed);
      const b64Printable = b64Bytes
        ? b64Bytes.filter(b => b >= 0x20 && b <= 0x7e).length / Math.max(b64Bytes.length, 1)
        : 0;
      if (b64Bytes && (b64HasSignal || b64Printable >= 0.7)) { bytes = b64Bytes; detectedType = 'base64'; }
      else { bytes = textToBytes(input); detectedType = 'text'; }
    }
  } else if (inputType === 'hex') {
    bytes = hexToBytes(input.trim());
    if (!bytes) return { error: 'Invalid hex string.' };
  } else if (inputType === 'base64') {
    bytes = base64ToBytes(input.trim());
    if (!bytes) return { error: 'Invalid Base64 string.' };
  } else {
    bytes = textToBytes(input);
  }

  const entropy = calcEntropy(bytes);
  const histogram = buildByteHistogram(bytes);
  const magicHits = detectMagic(bytes);

  // Classify entropy
  let classification = '';
  let classColor = '';
  if (entropy < 1) { classification = 'Very Low — likely uniform/repetitive'; classColor = '#4ade80'; }
  else if (entropy < 3) { classification = 'Low — structured plain text or simple encoding'; classColor = '#a3e635'; }
  else if (entropy < 5) { classification = 'Medium — compressed or mixed content'; classColor = '#facc15'; }
  else if (entropy < 7) { classification = 'High — encrypted, compressed, or Base64 data'; classColor = '#fb923c'; }
  else { classification = 'Very High — likely AES ciphertext or random noise'; classColor = '#f87171'; }

  // Top 10 most frequent bytes
  const topBytes = histogram
    .map((count, byte) => ({ byte, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Printable ASCII stats
  const printable = bytes.filter(b => b >= 0x20 && b <= 0x7E).length;
  const printableRatio = bytes.length > 0 ? printable / bytes.length : 0;
  const uniqueBytes = histogram.filter(count => count > 0).length;
  const zeroBytes = histogram[0];
  const sampleNote = bytes.length < 32
    ? 'This is a small sample, so treat the result as a clue rather than proof.'
    : 'This sample is large enough for the result to be a useful clue, not a verdict.';
  let plainExplanation;
  let nextStep;
  if (magicHits.length) {
    plainExplanation = `This data starts with the signature of ${magicHits.join(' or ')}. That is the strongest finding.`;
    nextStep = 'Save or inspect it as that file type; entropy is secondary here.';
  } else if (printableRatio >= 85 && entropy < 6) {
    plainExplanation = 'Most bytes are readable characters and repeat in patterns. This looks like text or an encoding, not strong encryption.';
    nextStep = 'Try the recursive decoder or inspect whether the text is Base64, hex, URL-encoded, or compressed.';
  } else if (entropy >= 7) {
    plainExplanation = 'Byte values are spread very evenly. This is consistent with compressed data, encryption, or random bytes; entropy alone cannot distinguish them.';
    nextStep = 'Check the file signature and surrounding context before calling it encrypted.';
  } else {
    plainExplanation = 'The byte distribution has some structure but is not plainly readable. It may be mixed data, an encoding, or lightly compressed content.';
    nextStep = 'Compare this result with the hex preview and the recursive decoder.';
  }

  return {
    byteCount: bytes.length,
    detectedType,
    entropy: entropy.toFixed(4),
    entropyNum: entropy,
    classification,
    classColor,
    histogram,
    topBytes,
    magicHits,
    printableRatio: (printableRatio * 100).toFixed(1),
    uniqueBytes,
    zeroBytes,
    plainExplanation,
    nextStep,
    sampleNote,
    bytes: bytes.slice(0, 256), // first 256 for hex preview
  };
}

// ─── 5. RECURSIVE DEEP DECODING PIPELINE ─────────────────────────────────────

const DECODERS = {
  'Zero-Width Strip': (s) => {
    const result = inspectZeroWidth(s);
    if (result.totalHidden > 0) {
      return { output: result.cleanedText, note: `Stripped ${result.totalHidden} zero-width chars. Hidden bits: ${result.bitStream}` };
    }
    return null;
  },
  'Base64': (s) => {
    try {
      const raw = s.trim();
      const candidate = raw.replace(/\s/g, '');
      // Quick validation: must contain only Base64 or URL-safe Base64 chars and be at least 4 chars
      const looksStandard = /^[A-Za-z0-9+\/=]+$/.test(candidate);
      const looksUrlSafe  = /^[A-Za-z0-9\-_=]+$/.test(candidate);
      if (!looksStandard && !looksUrlSafe) return null;
      if (candidate.length < 4) return null;
      // Heuristic: avoid decoding plain alphabetic words (e.g., "HelloWorld") that happen
      // to match the base64 char class. Require either proper padding/length or presence
      // of Base64-specific symbols (+ / - _ =) before decoding.
      if (!(candidate.length % 4 === 0 || /[+/=\-_]/.test(candidate))) return null;
      // Normalize URL-safe -> standard before padding
      const std = candidate.replace(/-/g, '+').replace(/_/g, '/');
      const padded = std + '='.repeat((4 - std.length % 4) % 4);
      const decoded = atob(padded);
      if (decoded && decoded !== s && decoded.length > 0) return { output: decoded, note: 'Decoded Base64' };
    } catch { }
    return null;
  },
  'Hex': (s) => {
    const clean = s.trim().replace(/\s/g, '');
    if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length % 2 !== 0 || clean.length < 4) return null;
    const decoded = clean.match(/.{1,2}/g).map(h => String.fromCharCode(parseInt(h, 16))).join('');
    if (decoded && decoded !== s) return { output: decoded, note: 'Decoded Hex' };
    return null;
  },
  'URL Decode': (s) => {
    try {
      const decoded = decodeURIComponent(s);
      if (decoded !== s) return { output: decoded, note: 'URL decoded' };
    } catch { }
    return null;
  },
  'ROT13': (s) => {
    // BUG-07 fix: ROT13 fires on EVERY string with letters (always produces a different output).
    // Guard with an English frequency score — only apply if the rotated output is more likely English.
    if (!/[a-zA-Z]/.test(s)) return null;
    const decoded = s.replace(/[a-zA-Z]/g, c => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
    });
    const scoreOrig = scoreEnglish(s);
    const scoreRot  = scoreEnglish(decoded);
    // Only fire if rotated result is at least 20% more English-like than the original
    if (scoreRot > scoreOrig * 1.2 && decoded !== s) return { output: decoded, note: 'ROT13 applied' };
    return null;
  },
  'Base32': (s) => {
    const bytes = decodeBase32(s.trim(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567');
    if (bytes) {
      const decoded = String.fromCharCode(...bytes);
      if (decoded && decoded !== s) return { output: decoded, note: 'Decoded Base32' };
    }
    return null;
  },
  'XOR-0xFF': (s) => {
    const bytes = textToBytes(s);
    const xored = bytes.map(b => b ^ 0xFF);
    const decoded = String.fromCharCode(...xored);
    const printable = xored.filter(b => b >= 0x20 && b <= 0x7E).length / xored.length;
    if (printable > 0.7 && decoded !== s) return { output: decoded, note: 'XOR with 0xFF' };
    return null;
  },
};

function runPipeline(input, options = {}) {
  const maxDepth = options.maxDepth || 8;
  const steps = [];
  let current = input;
  const visited = new Set([input]);

  for (let depth = 0; depth < maxDepth; depth++) {
    let progressed = false;
    for (const [name, fn] of Object.entries(DECODERS)) {
      if (options.skipDecoders && options.skipDecoders.includes(name)) continue;
      const result = fn(current);
      if (result && !visited.has(result.output)) {
        steps.push({
          step: steps.length + 1,
          decoder: name,
          input: current,
          output: result.output,
          note: result.note,
          entropy: parseFloat(inspectEntropy(result.output).entropy ?? '0'), // BUG-04 fix: inspectEntropy can return {error} with no .entropy → NaN.toFixed(2) crash
        });
        visited.add(result.output);
        current = result.output;
        progressed = true;
        break;
      }
    }
    if (!progressed) break;
  }

  return { steps, finalOutput: current, totalSteps: steps.length };
}

// ─── XOR BRUTE FORCE ──────────────────────────────────────────────────────────

function _xorInputBytes(input) {
  const clean = input.trim().replace(/\s/g, '');
  const hex = hexToBytes(clean);
  if (hex) return { bytes: hex, inputType: 'hex' };
  const b64 = /^[A-Za-z0-9+/_-]+={0,2}$/.test(clean) && clean.length >= 8 && clean.length % 4 !== 1 ? base64ToBytes(clean) : null;
  if (b64) return { bytes: b64, inputType: 'base64' };
  return { bytes: textToBytes(input), inputType: 'text' };
}

function _xorScore(bytes, decoded, printableRatio) {
  const text = decoded.toLowerCase();
  const spaces = (text.match(/\s/g) || []).length / Math.max(bytes.length, 1);
  const letters = (text.match(/[a-z]/g) || []).length / Math.max(bytes.length, 1);
  const commonWords = (text.match(/\b(the|and|that|this|is|of|to|you|flag|ctf|http|password|key)\b/g) || []).length;
  const punctuation = (text.match(/[\x00-\x08\x0e-\x1f\x7f-\xff]/g) || []).length;
  return printableRatio * 70 + letters * 20 + Math.min(spaces, 0.25) * 20 + commonWords * 15 - punctuation * 2;
}

function xorBruteForce(input, keyMin = 0, keyMax = 255) {
  const parsed = _xorInputBytes(input);
  const bytes = parsed.bytes;
  const results = [];
  for (let key = keyMin; key <= keyMax; key++) {
    const xored = bytes.map(b => b ^ key);
    const decoded = String.fromCharCode(...xored);
    const printable = xored.filter(b => b >= 0x20 && b <= 0x7E).length / xored.length;
    results.push({
      key: `0x${key.toString(16).padStart(2, '0').toUpperCase()}`,
      keyDec: key,
      decoded,
      printableRatio: (printable * 100).toFixed(1),
      score: _xorScore(xored, decoded, printable),
    });
  }
  results.sort((a, b) => b.score - a.score || parseFloat(b.printableRatio) - parseFloat(a.printableRatio));
  results.inputType = parsed.inputType;
  results.best = results[0] || null;
  results.printableResults = results.filter(r => parseFloat(r.printableRatio) >= 75).length;
  return results;
}

// ─── CAESAR BRUTE FORCE ───────────────────────────────────────────────────────

const ENGLISH_FREQS = { e:12.7,t:9.1,a:8.2,o:7.5,i:7.0,n:6.7,s:6.3,h:6.1,r:6.0,d:4.3,l:4.0,c:2.8,u:2.8,m:2.4,w:2.4,f:2.2,g:2.0,y:2.0,p:1.9,b:1.5,v:1.0,k:0.8,x:0.2,j:0.2,q:0.1,z:0.1 };

function scoreEnglish(text) {
  const lower = text.toLowerCase();
  let score = 0;
  for (const ch of lower) {
    if (ENGLISH_FREQS[ch]) score += ENGLISH_FREQS[ch];
  }
  return score / text.length;
}

function caesarBruteForce(input) {
  const results = [];
  for (let shift = 0; shift < 26; shift++) {
    const decoded = input.replace(/[a-zA-Z]/g, c => {
      const base = c <= 'Z' ? 65 : 97;
      return String.fromCharCode(((c.charCodeAt(0) - base + shift) % 26) + base);
    });
    results.push({ shift, decoded, score: scoreEnglish(decoded) });
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ─── 6. INTERLEAVED NOISE PATTERN STRIPPER ────────────────────────────────────
//
// Detects a visible repeating string (e.g. "vVv", "00", "XxX") that has been
// inserted between EVERY real character in a payload. Automatically identifies
// the separator without any user input by testing all candidate separator lengths
// and picking the one that produces the most consistent repeating pattern.
//
// Example: "CvVv:vVv\vVvuvVv..." → separator "vVv" → "C:\u..."

function detectInterleavedNoise(input) {
  // Clamp to a reasonable length for analysis
  const text = input.replace(/\r?\n/g, '');
  const len = text.length;

  if (len < 3) {
    return { error: 'Input too short for interleaved noise detection (need ≥ 3 chars).' };
  }

  // ── Step 1: Score every candidate separator length from 1 up to ~12 chars ──
  // For separator length L, the string structure is:
  //   real[0] + sep(L) + real[1] + sep(L) + real[2] + ...
  // period = L + 1  (one real char + L sep chars)
  // The separator candidate is text.slice(1, 1+L).
  // We validate by checking that the same L-char pattern appears at every
  // position (k*(L+1)+1) for k = 0,1,2,...
  //
  // Score = fraction of expected positions that actually match.

  const MAX_SEP_LEN = Math.min(12, Math.floor((len - 1) / 2));
  const candidates = [];

  for (let L = 1; L <= MAX_SEP_LEN; L++) {
    const period  = L + 1;
    const sepCandidate = text.slice(1, 1 + L);
    if (!sepCandidate || sepCandidate.length < L) continue;

    let matches = 0;
    let total   = 0;

    for (let pos = 1; pos + L <= len; pos += period) {
      total++;
      if (text.slice(pos, pos + L) === sepCandidate) matches++;
    }

    if (total === 0) continue;
    const score = matches / total;

    candidates.push({
      separatorLen : L,
      separator    : sepCandidate,
      period,
      matches,
      total,
      score,
    });
  }

  if (candidates.length === 0) {
    return { error: 'Could not find any repeating interleaved pattern.' };
  }

  // ── Step 2: Pick the best candidate ──
  // Prefer high score, then longer separator (more specific / less likely to be noise).
  candidates.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.05) return b.score - a.score;
    return b.separatorLen - a.separatorLen;
  });

  const best = candidates[0];

  // Require a minimum confidence threshold
  if (best.score < 0.75) {
    return {
      error: `No reliable interleaved separator found (best confidence: ${(best.score*100).toFixed(1)}%). The input may not use a consistent noise pattern.`,
      candidates: candidates.slice(0, 5),
    };
  }

  // ── Step 3: Extract the real characters by taking every (L+1)-th char ──
  const { separator, period } = best;
  const realChars = [];
  for (let pos = 0; pos < len; pos += period) {
    realChars.push(text[pos]);
  }
  const cleaned = realChars.join('');

  // ── Step 4: Build annotated view showing where noise was stripped ──
  const segments = [];
  for (let pos = 0; pos < len; pos += period) {
    segments.push({ real: text[pos], noise: text.slice(pos + 1, pos + 1 + best.separatorLen) });
  }

  // ── Step 5: Compute confidence detail for all top candidates ──
  const topCandidates = candidates.slice(0, 8).map(c => ({
    separator    : c.separator,
    separatorLen : c.separatorLen,
    confidence   : Math.round(c.score * 100),
    matches      : c.matches,
    total        : c.total,
  }));

  return {
    separator,
    separatorLen  : best.separatorLen,
    period,
    confidence    : Math.round(best.score * 100),
    matches       : best.matches,
    total         : best.total,
    cleaned,
    originalLength: len,
    cleanedLength : cleaned.length,
    segments,
    topCandidates,
    noisePercent  : Math.round((1 - 1 / period) * 100),
  };
}

// ─── 7. AI AUTO-ANALYZER ENGINE ───────────────────────────────────────────────

// Expected decoded/original length ratios per encoding
const DECODE_RATIOS = {
  'Base64': 0.75, 'Base32': 0.625, 'Hex': 0.5,
  'URL': 0.85, 'Caesar': 1.0, 'ROT13': 1.0,
  'XOR': 1.0, 'Binary': 0.125, 'Noise': 0.25,
};

// Keyword patterns indicating meaningful decoded content
const KEYWORD_PATTERNS = [
  /https?:\/\//i,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,
  /\b(the|and|for|that|this|with|from|have|will|secret|flag|key)\b/i,
  /^\s*[\{\[]/,
  /<[a-z]+[\s>]/i,
  /CTF\{|flag\{/i,
  /[A-Z]:\\|\/usr\/|\/home\/|\/etc\//,
  /BEGIN (RSA|CERTIFICATE|PRIVATE)/,
  /password|secret|token|api_key/i,
  /SELECT|INSERT|UPDATE|DROP/i,
];

function _countKeywordHits(text) {
  return KEYWORD_PATTERNS.filter(p => p.test(text)).length;
}

function _calcPrintableRatio(text) {
  if (!text.length) return 0;
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0x20 && c <= 0x7E) n++;
  }
  return n / text.length;
}

function _calcEntropyNum(text) {
  const freq = {};
  for (const c of text) freq[c] = (freq[c] || 0) + 1;
  const len = text.length;
  let e = 0;
  for (const c in freq) { const p = freq[c] / len; e -= p * Math.log2(p); }
  return e;
}

function _scoreDecodeResult(original, decoded, method) {
  if (!decoded || decoded === original || !decoded.length) return 0;
  const printable = _calcPrintableRatio(decoded) * 35;
  const origH = _calcEntropyNum(original);
  const decH  = _calcEntropyNum(decoded);
  const entropyScore = Math.min(25, Math.max(0, (origH - decH) / Math.max(origH, 0.01)) * 25);
  const keywordScore = Math.min(20, _countKeywordHits(decoded) * 5);
  const expectedRatio = DECODE_RATIOS[method] || 0.75;
  const actualRatio   = decoded.length / original.length;
  const ratioScore    = Math.max(0, 10 - Math.abs(actualRatio - expectedRatio) * 12);
  const diffScore     = decoded !== original ? 10 : 0;
  return Math.round(Math.min(99, Math.max(0, printable + entropyScore + keywordScore + ratioScore + diffScore)));
}

function detectFingerprints(input) {
  const c = input.trim();
  const prints = [];
  if (/^[A-Za-z0-9+/]+=*$/.test(c) && c.length % 4 === 0)
    prints.push({ name: 'Base64 (Standard)', confidence: 90 });
  if (/^[A-Za-z0-9\-_]+=*$/.test(c) && c.length > 4)
    prints.push({ name: 'Base64 (URL-safe)', confidence: 80 });
  if (/^[0-9a-fA-F\s]+$/.test(c) && c.replace(/\s/g,'').length % 2 === 0)
    prints.push({ name: 'Hexadecimal', confidence: 88 });
  if (/%[0-9a-fA-F]{2}/.test(c))
    prints.push({ name: 'URL-encoded', confidence: 95 });
  if (/[\u200B\u200C\u200D\uFEFF\u200E\u200F]/.test(input))
    prints.push({ name: 'Zero-Width Steganography', confidence: 99 });
  if (/^[01\s]+$/.test(c) && c.replace(/\s/g,'').length % 8 === 0)
    prints.push({ name: 'Binary (8-bit ASCII)', confidence: 90 });
  if (/^[A-Z2-7]+=*$/.test(c) && c.length % 8 === 0)
    prints.push({ name: 'Base32', confidence: 82 });
  if (/&[a-z]+;|&#\d+;/.test(c))
    prints.push({ name: 'HTML Entities', confidence: 95 });
  if (/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(c))
    prints.push({ name: 'JWT (JSON Web Token)', confidence: 92 });
  if (/^[1-9A-HJ-NP-Za-km-z]{25,}$/.test(c))
    prints.push({ name: 'Base58', confidence: 72 });
  if (/^[A-Za-z]+$/.test(c) && c.length > 4)
    prints.push({ name: 'Possible Caesar/ROT cipher', confidence: 55 });
  try {
    const n = detectInterleavedNoise(input);
    if (!n.error && n.confidence >= 80)
      prints.push({ name: `Interleaved Noise ("${n.separator}")`, confidence: n.confidence });
  } catch(e) {}
  return prints.sort((a,b) => b.confidence - a.confidence);
}

function autoAnalyze(payload) {
  if (!payload || !payload.trim()) return { error: 'Empty input.' };
  const clean = payload.trim();
  const candidates = [];

  // ── Base64 ──────────────────────────────────────────────────────────────────
  try {
    const r = analyzeBase64Padding(clean);
    if (r.decoded && !r.error) {
      candidates.push({
        method: 'Base64', icon: '🔐',
        confidence: _scoreDecodeResult(clean, r.decoded, 'Base64'),
        decoded: r.decoded,
        explanation: `Length ${clean.length} (mod 4 = ${clean.length%4}), standard Base64 alphabet detected.${r.isUrlSafe?' URL-safe variant.':''}`,
      });
    }
  } catch(e) {}

  // ── Hex ─────────────────────────────────────────────────────────────────────
  try {
    const hexB = hexToBytes(clean.replace(/\s/g,''));
    if (hexB) {
      const decoded = hexB.map(b => String.fromCharCode(b)).join('');
      candidates.push({
        method: 'Hex', icon: '🔢',
        confidence: _scoreDecodeResult(clean, decoded, 'Hex'),
        decoded,
        explanation: `All chars in [0-9a-fA-F], even length → ${hexB.length} bytes decoded.`,
      });
    }
  } catch(e) {}

  // ── URL Decode ──────────────────────────────────────────────────────────────
  try {
    const decoded = decodeURIComponent(clean);
    if (decoded !== clean) {
      candidates.push({
        method: 'URL Decode', icon: '🌐',
        confidence: Math.max(60, _scoreDecodeResult(clean, decoded, 'URL')),
        decoded,
        explanation: 'Contains %XX percent-encoded sequences — successfully URL-decoded.',
      });
    }
  } catch(e) {}

  // ── Zero-Width ───────────────────────────────────────────────────────────────
  try {
    const zw = inspectZeroWidth(payload);
    if (zw.found.length > 0 && zw.decoded) {
      candidates.push({
        method: 'Zero-Width Steganography', icon: '👁️',
        confidence: 97,
        decoded: zw.decoded,
        explanation: `${zw.found.length} hidden zero-width Unicode chars (${[...new Set(zw.found.map(f=>f.name))].join(', ')}) encode a binary bit-stream.`,
      });
    }
  } catch(e) {}

  // ── Interleaved Noise ────────────────────────────────────────────────────────
  try {
    const noise = detectInterleavedNoise(payload);
    if (!noise.error) {
      candidates.push({
        method: `Interleaved Noise ("${noise.separator}")`, icon: '🧹',
        confidence: noise.confidence,
        decoded: noise.cleaned,
        explanation: `"${noise.separator}" (${noise.separatorLen} chars) injected between every real character — ${noise.noisePercent}% of input is noise.`,
      });
    }
  } catch(e) {}

  // ── Caesar / ROT ─────────────────────────────────────────────────────────────
  try {
    const rots = caesarBruteForce(clean);
    const best = rots[0];
    if (best && best.score > 0.04 && best.shift !== 0) {
      const conf = Math.min(88, Math.round(best.score * 350));
      candidates.push({
        method: `Caesar / ROT${best.shift}`, icon: '🔄',
        confidence: conf,
        decoded: best.decoded,
        explanation: `ROT${best.shift} yields highest English frequency score (${best.score.toFixed(4)}).`,
      });
    }
  } catch(e) {}

  // ── XOR Single-Byte ──────────────────────────────────────────────────────────
  try {
    const xors = xorBruteForce(payload);
    if (xors.length > 0) {
      const best = xors[0];
      const conf = Math.min(85, Math.round(parseFloat(best.printableRatio)));
      candidates.push({
        method: `XOR (key ${best.key})`, icon: '⚡',
        confidence: conf,
        decoded: best.decoded,
        explanation: `Single-byte XOR key ${best.key} → ${best.printableRatio}% printable ASCII output.`,
      });
    }
  } catch(e) {}

  // ── Binary (8-bit) ───────────────────────────────────────────────────────────
  try {
    const binStr = clean.replace(/\s/g,'');
    if (/^[01]+$/.test(binStr) && binStr.length % 8 === 0) {
      const decoded = binStr.match(/.{8}/g).map(b => String.fromCharCode(parseInt(b,2))).join('');
      candidates.push({
        method: 'Binary (8-bit ASCII)', icon: '💻',
        confidence: _scoreDecodeResult(clean, decoded, 'Binary'),
        decoded,
        explanation: `Only 0/1 chars, length ${binStr.length} divisible by 8 — each 8-bit group decoded to ASCII char.`,
      });
    }
  } catch(e) {}

  // ── HTML Entities ─────────────────────────────────────────────────────────────
  try {
    const htmlD = clean
      .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
      .replace(/&quot;/g,'"').replace(/&apos;/g,"'")
      .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(n))
      .replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));
    if (htmlD !== clean) {
      candidates.push({
        method: 'HTML Entities', icon: '📄',
        confidence: Math.max(70, _scoreDecodeResult(clean, htmlD, 'URL')),
        decoded: htmlD,
        explanation: 'HTML entity sequences (&amp;, &#xx;, &#xhh;) detected and decoded.',
      });
    }
  } catch(e) {}

  // ── Base32 ───────────────────────────────────────────────────────────────────
  try {
    const b32bytes = decodeBase32(clean.replace(/\s/g,'').toUpperCase(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567');
    if (b32bytes) {
      const decoded = String.fromCharCode(...b32bytes);
      const conf = _scoreDecodeResult(clean, decoded, 'Base32');
      if (conf > 20) {
        candidates.push({
          method: 'Base32', icon: '🔡',
          confidence: conf,
          decoded,
          explanation: 'Characters in [A-Z2-7] with optional padding — decoded as standard Base32 (RFC 4648).',
        });
      }
    }
  } catch(e) {}

  // ── Sort by confidence ────────────────────────────────────────────────────────
  candidates.sort((a,b) => b.confidence - a.confidence);

  // ── Multi-pass recursive unwrapping ─────────────────────────────────────────
  const decodeChain = [];
  let current = payload;
  const visited = new Set([payload]);
  for (let depth = 0; depth < 8; depth++) {
    const step = _autoAnalyzeStep(current);
    if (!step || visited.has(step.decoded) || step.confidence < 35) break;
    decodeChain.push({ step: depth+1, input: current, ...step });
    visited.add(step.decoded);
    current = step.decoded;
  }

  const finalOutput = decodeChain.length > 0
    ? decodeChain[decodeChain.length-1].decoded
    : (candidates[0]?.decoded || payload);

  return {
    candidates: candidates.slice(0,10),
    decodeChain,
    finalOutput,
    fingerprints: detectFingerprints(payload),
    inputLength: payload.length,
    topMethod: candidates[0]?.method || 'Unknown',
    topConfidence: candidates[0]?.confidence || 0,
  };
}

function _autoAnalyzeStep(input) {
  const clean = input.trim();
  const tries = [
    () => {
      const r = analyzeBase64Padding(clean);
      if (r.decoded && !r.error && r.decoded !== input)
        return { method:'Base64', decoded:r.decoded, confidence:_scoreDecodeResult(clean,r.decoded,'Base64'), icon:'🔐' };
    },
    () => {
      const b = hexToBytes(clean.replace(/\s/g,''));
      if (b) { const d = b.map(x=>String.fromCharCode(x)).join(''); if (d !== input) return { method:'Hex', decoded:d, confidence:_scoreDecodeResult(clean,d,'Hex'), icon:'🔢' }; }
    },
    () => {
      try { const d = decodeURIComponent(clean); if (d !== clean) return { method:'URL Decode', decoded:d, confidence:80, icon:'🌐' }; } catch(e){}
    },
    () => {
      const n = detectInterleavedNoise(input);
      if (!n.error && n.confidence >= 80) return { method:`Noise("${n.separator}")`, decoded:n.cleaned, confidence:n.confidence, icon:'🧹' };
    },
    () => {
      const zw = inspectZeroWidth(input);
      if (zw.found.length > 0 && zw.decoded) return { method:'Zero-Width', decoded:zw.decoded, confidence:97, icon:'👁️' };
    },
  ];
  const results = tries.map(t => { try { return t(); } catch(e){ return null; } }).filter(Boolean);
  results.sort((a,b) => b.confidence - a.confidence);
  return results[0] || null;
}

// ── Gemini API Integration ────────────────────────────────────────────────────

const GEMINI_SYSTEM_PROMPT = `You are an expert forensic analyst specializing in data encoding, cryptography, steganography, and CTF challenges. You have deep knowledge of: Base64 (standard and URL-safe), Base32, Base58, Hex, URL-encoding, Binary, ASCII85, all Caesar/ROT variants, XOR ciphers, zero-width Unicode steganography, interleaved character noise, JWT, HTML entities, Unicode escapes, and custom encoding schemes.

Your task: Analyze the payload and:
1. Identify EVERY encoding/obfuscation layer (there may be multiple stacked layers)
2. Decode each layer step-by-step with exact intermediate decoded values
3. Explain precisely WHY you identified each encoding (what specific features gave it away)
4. State confidence percentage for each layer
5. Give the final plaintext output

IMPORTANT: Respond ONLY with valid JSON in this exact schema:
{
  "summary": "One-line description of what was found",
  "layers": [
    {
      "step": 1,
      "method": "Base64",
      "input_preview": "first 80 chars of the input to this step",
      "output": "full decoded output of this step",
      "explanation": "Precise explanation of detection and decoding method",
      "confidence": 97
    }
  ],
  "final_output": "The final decoded plaintext result",
  "overall_confidence": 95,
  "notes": "Any extra observations, alternative interpretations, or warnings"
}`;

async function _callGemini(payload, model) {
  const cfg = window.OmniConfig;

  // The supported REST endpoint is `:generateContent`.  The proxy keeps credentials
  // out of the browser and is the normal application path.
  if (cfg.GEMINI_PROXY_URL && typeof cfg.GEMINI_PROXY_URL === 'string') {
    const proxyBase = cfg.GEMINI_PROXY_URL.replace(/\/+$/,'');
    const proxyUrl = `${proxyBase}/api/gemini/${encodeURIComponent(model)}`;
    var urls = [proxyUrl];
  } else {
    const base = cfg.GEMINI_ENDPOINT.replace(/\/+$/,''); // trim trailing slash
    var urls = [`${base}/${encodeURIComponent(model)}:generateContent`];
  }

  const bodyVariants = [{
      contents: [{ parts: [{ text: `${GEMINI_SYSTEM_PROMPT}\n\nPAYLOAD TO ANALYZE:\n\`\`\`\n${payload}\n\`\`\`` }] }],
      generationConfig: {
        temperature: cfg.TEMPERATURE,
        maxOutputTokens: cfg.MAX_OUTPUT_TOKENS,
        responseMimeType: 'application/json',
      },
    }];

  let lastErr = null;
  for (const url of urls) {
    for (const body of bodyVariants) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        // Direct calls are intended only for trusted server environments. Gemini
        // REST API keys are sent in this header, never embedded in the URL.
        if (!cfg.GEMINI_PROXY_URL && cfg.GEMINI_API_KEY) headers['x-goog-api-key'] = cfg.GEMINI_API_KEY;

        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        // If endpoint returns 404/405 it's likely not supported — try next
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          // Quota handling
          if (resp.status === 429 || /quota/i.test(txt)) {
            const retryMatch = txt.match(/retry in ([\d.]+)s/i);
            const retryIn = retryMatch ? `Retry in ${Math.ceil(parseFloat(retryMatch[1]))} seconds.` : '';
            const isLimitZero = /limit:?\s*0/.test(txt);
            if (isLimitZero) throw Object.assign(new Error('QUOTA_ZERO'), { isQuotaZero: true });
            throw Object.assign(new Error(`QUOTA_EXCEEDED:${retryIn}`), { isQuota: true, retryIn });
          }
          // Record and continue to try other endpoints
          lastErr = new Error(`HTTP ${resp.status} from ${url}: ${txt}`);
          continue;
        }

        const data = await resp.json().catch(() => null);
        if (!data) {
          lastErr = new Error(`Empty JSON response from ${url}`);
          continue;
        }

        // Try multiple common response shapes to extract text
        // 1) data.candidates[0].content.parts[0].text (existing behaviour)
        const candText = data.candidates?.[0]?.content?.parts?.[0]?.text
          || data.candidates?.[0]?.content?.text
          || data.candidates?.[0]?.text
          || data.output?.[0]?.content?.text
          || data.output?.[0]?.text
          || data.text;

        if (!candText) {
          // Some endpoints return a different structure — stringify partial data for diagnostics
          lastErr = new Error(`No candidate text found in Gemini response from ${url}. Response keys: ${Object.keys(data).join(',')}`);
          continue;
        }

        // candText may be JSON string or a code block containing JSON; attempt to parse
        const raw = candText;
        try {
          return JSON.parse(raw);
        } catch (e) {
          const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
          if (match) {
            try { return JSON.parse(match[1]); } catch(e2) { /* fall-through */ }
          }
          // If not JSON, return raw text as a fallback
          return raw;
        }

      } catch (err) {
        // Network or parse error — record and try next
        lastErr = err;
        continue;
      }
    }
  }

  // If we got here, nothing worked — provide helpful diagnostic message
  let msg = lastErr ? lastErr.message : 'Unknown error calling Gemini endpoints.';

  if (cfg.GEMINI_PROXY_URL && (/failed to fetch/i.test(msg) || /networkerror/i.test(msg) || msg === 'Failed to fetch')) {
    throw new Error(`Cannot reach the local Gemini proxy at ${cfg.GEMINI_PROXY_URL}. Start it with npm.cmd start, then open http://localhost:3000.`);
  }

  // Common browser failure: CORS or network blocking (fetch throws TypeError: Failed to fetch)
  if (/failed to fetch/i.test(msg) || /networkerror/i.test(msg) || msg === 'Failed to fetch') {
    msg += ' — likely a network/CORS restriction when calling Google APIs directly from the browser. Use a server-side proxy or run this from a trusted backend with the API key (recommended).';
  }

  throw new Error(`Gemini API error (${model}): ${msg}. Tried endpoints: ${urls.join(', ')}`);
}

async function analyzeWithGemini(payload) {
  const cfg = window.OmniConfig;

  // ── Key check ──────────────────────────────────────────────
  // If no key is present but a proxy URL is configured, allow proxy usage without a key on the client.
  const hasKey = cfg && cfg.GEMINI_API_KEY && cfg.GEMINI_API_KEY !== 'PASTE_YOUR_GEMINI_API_KEY_HERE';
  const hasProxy = cfg && cfg.GEMINI_PROXY_URL && cfg.GEMINI_PROXY_URL !== null;
  if (!hasKey && !hasProxy) {
    // Provide a clear actionable error for browser users (CORS likely) and server users
    throw new Error('NOKEY_OR_PROXY: No Gemini API key configured and no GEMINI_PROXY_URL set.\n' +
      'For secure operation, either:\n' +
      '  1) Run a local server-side proxy with your API key (recommended) and set GEMINI_PROXY_URL to its URL, or\n' +
      '  2) Configure GEMINI_API_KEY on a trusted backend and ensure GEMINI_USE_BEARER=true so the key is sent as a Bearer token from the server-side environment.\n' +
      'Do NOT embed your real API key in client-side source that can be committed or viewed by users.');
  }
  if (payload.length > cfg.MAX_PAYLOAD_CHARS) {
    throw new Error(`Payload too large (${payload.length} chars). Maximum is ${cfg.MAX_PAYLOAD_CHARS}.`);
  }

  // ── Primary model call ─────────────────────────────────────────────
  const primary  = cfg.GEMINI_MODEL          || 'gemini-1.5-flash';
  const fallback = cfg.GEMINI_MODEL_FALLBACK || 'gemini-1.5-flash-latest';

  try {
    return await _callGemini(payload, primary);
  } catch(err) {
    // Auto-retry with fallback model on quota/rate errors
    if (err.isQuota || err.isQuotaZero) {
      try {
        return await _callGemini(payload, fallback);
      } catch(err2) {
        // Both models failed — propagate original descriptive error
        throw err;
      }
    }
    throw err;
  }
}

// ─── 8. HASH ANALYZER & CRACKER ───────────────────────────────────────────────

const HASH_SIGNATURES = [
  // name, regex, length(chars), bits
  { name: 'MD5',          regex: /^[a-f0-9]{32}$/i,                        len: 32,   bits: 128  },
  { name: 'MD4',          regex: /^[a-f0-9]{32}$/i,                        len: 32,   bits: 128  },
  { name: 'NTLM',         regex: /^[a-f0-9]{32}$/i,                        len: 32,   bits: 128  },
  { name: 'LM',           regex: /^[a-f0-9]{32}$/i,                        len: 32,   bits: 128  },
  { name: 'SHA-1',        regex: /^[a-f0-9]{40}$/i,                        len: 40,   bits: 160  },
  { name: 'RIPEMD-160',   regex: /^[a-f0-9]{40}$/i,                        len: 40,   bits: 160  },
  { name: 'SHA-224',      regex: /^[a-f0-9]{56}$/i,                        len: 56,   bits: 224  },
  { name: 'SHA-256',      regex: /^[a-f0-9]{64}$/i,                        len: 64,   bits: 256  },
  { name: 'SHA3-256',     regex: /^[a-f0-9]{64}$/i,                        len: 64,   bits: 256  },
  { name: 'RIPEMD-256',   regex: /^[a-f0-9]{64}$/i,                        len: 64,   bits: 256  },
  { name: 'Blake2s-256',  regex: /^[a-f0-9]{64}$/i,                        len: 64,   bits: 256  },
  { name: 'SHA-384',      regex: /^[a-f0-9]{96}$/i,                        len: 96,   bits: 384  },
  { name: 'SHA3-384',     regex: /^[a-f0-9]{96}$/i,                        len: 96,   bits: 384  },
  { name: 'SHA-512',      regex: /^[a-f0-9]{128}$/i,                       len: 128,  bits: 512  },
  { name: 'SHA3-512',     regex: /^[a-f0-9]{128}$/i,                       len: 128,  bits: 512  },
  { name: 'Whirlpool',    regex: /^[a-f0-9]{128}$/i,                       len: 128,  bits: 512  },
  { name: 'Blake2b-512',  regex: /^[a-f0-9]{128}$/i,                       len: 128,  bits: 512  },
  { name: 'CRC32',        regex: /^[a-f0-9]{8}$/i,                         len: 8,    bits: 32   },
  { name: 'Adler-32',     regex: /^[a-f0-9]{8}$/i,                         len: 8,    bits: 32   },
  { name: 'bcrypt',       regex: /^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/,  len: null, bits: null },
  { name: 'scrypt',       regex: /^\$s0\$/,                                 len: null, bits: null },
  { name: 'Argon2',       regex: /^\$argon2/,                               len: null, bits: null },
  { name: 'PBKDF2',       regex: /^pbkdf2/i,                                len: null, bits: null },
  { name: 'SHA-512 crypt',regex: /^\$6\$/,                                  len: null, bits: null },
  { name: 'SHA-256 crypt',regex: /^\$5\$/,                                  len: null, bits: null },
  { name: 'MD5 crypt',    regex: /^\$1\$/,                                  len: null, bits: null },
  { name: 'Django (SHA1)',regex: /^sha1\$.{20}\$.{40}$/,                    len: null, bits: null },
  { name: 'Django (BCrypt)', regex: /^bcrypt\$.{60}$/,                      len: null, bits: null },
  { name: 'MySQL 4.x',    regex: /^[a-f0-9]{16}$/i,                        len: 16,   bits: 64   },
  { name: 'MySQL 5.x',    regex: /^\*[A-F0-9]{40}$/,                       len: null, bits: null },
  { name: 'TIGER-192',    regex: /^[a-f0-9]{48}$/i,                        len: 48,   bits: 192  },
  { name: 'Haval-256',    regex: /^[a-f0-9]{64}$/i,                        len: 64,   bits: 256  },
];

// Common password wordlist for dictionary attack
const DICT_WORDLIST = [
  'password','123456','password123','admin','letmein','welcome','monkey','dragon',
  'master','abc123','111111','qwerty','baseball','iloveyou','trustno1','sunshine',
  'princess','welcome1','shadow','superman','michael','football','batman','starwars',
  'login','pass','1234','12345','123456789','1234567','12345678','secret','hello',
  'world','test','user','root','toor','guest','changeme','administrator','god',
  'love','sex','fuck','shit','pass123','password1','p@ssword','p@ss123','Pa$$w0rd',
  'qwerty123','abc','aaa','bbb','ccc','1111','2222','0000','9999','1234abcd',
  'letmein1','welcome123','admin123','root123','test123','hello123','pass1234',
  'summer','winter','spring','autumn','monkey1','dragon1','magic','flower',
  'mustang','access','shadow1','master1','jessica','michael1','daniel','thomas',
  'george','jordan','hunter','ranger','buster','tiger','soccer','hockey','killer',
];

function identifyHash(input) {
  const h = input.trim();
  const matches = [];

  for (const sig of HASH_SIGNATURES) {
    if (sig.regex.test(h)) {
      // Avoid duplicate names
      if (!matches.find(m => m.name === sig.name)) {
        matches.push({
          name: sig.name,
          length: h.length,
          bits: sig.bits,
          crackable: sig.bits !== null && sig.bits <= 256,
          format: sig.len ? 'hex' : 'special',
        });
      }
    }
  }

  // Determine most likely by length priority
  const byLen = {
    8:   ['CRC32', 'Adler-32'],
    16:  ['MySQL 4.x'],
    32:  ['MD5', 'NTLM', 'MD4', 'LM'],
    40:  ['SHA-1', 'RIPEMD-160'],
    48:  ['TIGER-192'],
    56:  ['SHA-224'],
    64:  ['SHA-256', 'SHA3-256', 'Blake2s-256'],
    96:  ['SHA-384', 'SHA3-384'],
    128: ['SHA-512', 'SHA3-512', 'Whirlpool', 'Blake2b-512'],
  };
  const likelyNames = byLen[h.length] || [];

  return {
    hash: h,
    hashLength: h.length,
    matches,
    mostLikely: likelyNames[0] || (matches[0]?.name) || 'Unknown',
    possibleAlgos: likelyNames.length ? likelyNames : matches.map(m => m.name),
    isHex: /^[a-f0-9]+$/i.test(h),
    hasSpecialPrefix: h.startsWith('$') || h.startsWith('*'),
  };
}

// Dictionary attack using Web Crypto API (SHA-1, SHA-256, SHA-384, SHA-512)
async function dictionaryAttack(hashInput, algoHint) {
  const h = hashInput.trim().toLowerCase();
  const algos = [];

  if (h.length === 40)  algos.push({ name: 'SHA-1',   algo: 'SHA-1'   });
  if (h.length === 64)  algos.push({ name: 'SHA-256',  algo: 'SHA-256' });
  if (h.length === 96)  algos.push({ name: 'SHA-384',  algo: 'SHA-384' });
  if (h.length === 128) algos.push({ name: 'SHA-512',  algo: 'SHA-512' });

  const enc = new TextEncoder();
  const results = [];

  for (const word of DICT_WORDLIST) {
    for (const { name, algo } of algos) {
      try {
        const buf  = await crypto.subtle.digest(algo, enc.encode(word));
        const hex  = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
        if (hex === h) {
          results.push({ found: true, plaintext: word, algo: name, hash: hex });
          return results; // Stop on first find
        }
      } catch(e) {}
    }

    // Also check salted variants common in CTFs
    for (const prefix of ['', 'salt', 'user', 'admin']) {
      const variants = prefix ? [`${prefix}${word}`, `${word}${prefix}`] : [];
      for (const variant of variants) {
        for (const { name, algo } of algos) {
          try {
            const buf = await crypto.subtle.digest(algo, enc.encode(variant));
            const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
            if (hex === h) {
              results.push({ found: true, plaintext: variant, algo: name, hash: hex });
              return results;
            }
          } catch(e) {}
        }
      }
    }
  }

  return [{ found: false, triedWords: DICT_WORDLIST.length, algos: algos.map(a => a.name) }];
}

// Online hash lookup via hashes.com API (CORS-friendly)
async function onlineLookup(hash) {
  const h = hash.trim();
  // Only attempt MD5/SHA1/SHA256 online
  if (![32, 40, 64].includes(h.length)) {
    return { online: false, reason: 'Algorithm not supported for online lookup' };
  }

  try {
    // Use hashes.com free API
    const resp = await fetch(`https://hashes.com/en/api/identifier?hash=${encodeURIComponent(h)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.success && data.algorithms) {
      return { online: true, identified: data.algorithms };
    }
    return { online: false, reason: 'No result from hashes.com' };
  } catch(e) {
    // Fallback: try md5decrypt.net for MD5
    if (h.length === 32) {
      try {
        const r2 = await fetch(`https://md5decrypt.net/Api/api.php?hash=${h}&hash_type=md5&email=api@test.com&code=code1`, { method: 'GET' });
        const txt = await r2.text();
        if (txt && txt !== 'ERROR' && txt.length < 100) {
          return { online: true, plaintext: txt, source: 'md5decrypt.net' };
        }
      } catch(e2) {}
    }
    return { online: false, reason: e.message };
  }
}

async function analyzeHash(input) {
  const identified = identifyHash(input);
  const dictResult = await dictionaryAttack(input, identified.mostLikely);
  const cracked = dictResult.find(r => r.found);
  return {
    identified,
    cracked: cracked || null,
    dictStats: dictResult[0],
    wordlistSize: DICT_WORDLIST.length,
  };
}

// ─── 9. ENCRYPTION BREAKER ────────────────────────────────────────────────────

// ── Vigenere cipher ────────────────────────────────────────────────────────────
function vigenereDecrypt(text, key) {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!k.length) return text;
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    const shift = k.charCodeAt(ki % k.length) - 65;
    ki++;
    return String.fromCharCode(((ch.charCodeAt(0) - base - shift + 26) % 26) + base);
  });
}

// Index of Coincidence analysis to find Vigenere key length
function findVigenereKeyLength(ciphertext) {
  const letters = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  const maxLen = Math.min(20, Math.floor(letters.length / 4));
  const results = [];

  for (let keyLen = 1; keyLen <= maxLen; keyLen++) {
    let totalIC = 0;
    for (let offset = 0; offset < keyLen; offset++) {
      const col = [];
      for (let i = offset; i < letters.length; i += keyLen) col.push(letters[i]);
      const freq = {};
      for (const c of col) freq[c] = (freq[c] || 0) + 1;
      const n = col.length;
      if (n < 2) continue;
      let ic = 0;
      for (const f of Object.values(freq)) ic += f * (f - 1);
      totalIC += ic / (n * (n - 1));
    }
    results.push({ keyLen, ic: totalIC / keyLen });
  }
  results.sort((a, b) => b.ic - a.ic);
  return results.slice(0, 5);
}

// Kasiski / frequency-based key recovery for Vigenere
function recoverVigenereKey(ciphertext, keyLen) {
  const letters = ciphertext.toUpperCase().replace(/[^A-Z]/g, '');
  const ENGLISH_FREQ = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';
  let key = '';
  for (let offset = 0; offset < keyLen; offset++) {
    const col = [];
    for (let i = offset; i < letters.length; i += keyLen) col.push(letters.charCodeAt(i) - 65);
    const freq = new Array(26).fill(0);
    for (const c of col) freq[c]++;
    // Find shift that makes most frequent letter align with 'E'
    let bestShift = 0, bestScore = -1;
    for (let shift = 0; shift < 26; shift++) {
      let score = 0;
      for (let i = 0; i < 26; i++) {
        score += freq[(i + shift) % 26] * (ENGLISH_FREQ.indexOf(String.fromCharCode(65 + i)) < 0 ? 0 : 26 - ENGLISH_FREQ.indexOf(String.fromCharCode(65 + i)));
      }
      if (score > bestScore) { bestScore = score; bestShift = shift; }
    }
    key += String.fromCharCode(65 + bestShift);
  }
  return key;
}

function breakVigenere(ciphertext) {
  if (!ciphertext.replace(/[^a-zA-Z]/g, '').length) {
    return { error: 'Input contains no alphabetic characters for Vigenere analysis.' };
  }
  const keyLengths = findVigenereKeyLength(ciphertext);
  const attempts = [];

  for (const { keyLen, ic } of keyLengths.slice(0, 3)) {
    const key = recoverVigenereKey(ciphertext, keyLen);
    const decrypted = vigenereDecrypt(ciphertext, key);
    const score = scoreEnglish(decrypted);
    attempts.push({ keyLen, key, decrypted, ic: ic.toFixed(4), englishScore: score.toFixed(4) });
  }
  attempts.sort((a, b) => parseFloat(b.englishScore) - parseFloat(a.englishScore));
  return { attempts, best: attempts[0] };
}

// ── Rail Fence Cipher ──────────────────────────────────────────────────────────
function railFenceDecrypt(text, rails) {
  const n = text.length;
  const pattern = [];
  for (let i = 0; i < n; i++) {
    const rail = rails - 1 - Math.abs((i % (2 * (rails - 1))) - (rails - 1));
    pattern.push(rail);
  }
  const counts = new Array(rails).fill(0);
  for (const r of pattern) counts[r]++;
  const rows = [];
  let idx = 0;
  for (let r = 0; r < rails; r++) {
    rows.push(text.slice(idx, idx + counts[r]).split(''));
    idx += counts[r];
  }
  const rowIdx = new Array(rails).fill(0);
  let result = '';
  for (const r of pattern) {
    result += rows[r][rowIdx[r]++];
  }
  return result;
}

function breakRailFence(ciphertext) {
  const results = [];
  for (let rails = 2; rails <= Math.min(10, ciphertext.length); rails++) {
    const decrypted = railFenceDecrypt(ciphertext, rails);
    results.push({ rails, decrypted, score: parseFloat(scoreEnglish(decrypted).toFixed(4)) });
  }
  results.sort((a, b) => b.score - a.score);
  return { results: results.slice(0, 5), best: results[0] };
}

// ── Atbash Cipher ─────────────────────────────────────────────────────────────
function atbashDecrypt(text) {
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    return String.fromCharCode(base + (25 - (ch.charCodeAt(0) - base)));
  });
}

// ── Affine Cipher ─────────────────────────────────────────────────────────────
function affineDecrypt(text, a, b) {
  const modInverse = (a, m) => {
    for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
    return -1;
  };
  const aInv = modInverse(a, 26);
  if (aInv === -1) return null;
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    const y = ch.charCodeAt(0) - base;
    return String.fromCharCode(((aInv * (y - b + 26)) % 26) + base);
  });
}

function breakAffine(ciphertext) {
  const validA = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
  const results = [];
  for (const a of validA) {
    for (let b = 0; b < 26; b++) {
      if (a === 1 && b === 0) continue;
      const dec = affineDecrypt(ciphertext, a, b);
      if (dec) {
        const score = parseFloat(scoreEnglish(dec).toFixed(4));
        results.push({ a, b, decrypted: dec, score });
      }
    }
  }
  results.sort((a, b) => b.score - a.score);
  return { results: results.slice(0, 5), best: results[0] };
}

// ── Columnar Transposition ─────────────────────────────────────────────────────
function columnarDecrypt(ciphertext, key) {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!k.length) return ciphertext;
  const cols = k.length;
  const rows = Math.ceil(ciphertext.length / cols);
  const extra = rows * cols - ciphertext.length;

  // Sort key to get column order
  const order = [...k].map((c, i) => ({ c, i })).sort((a, b) => a.c.localeCompare(b.c)).map(x => x.i);
  const colLengths = new Array(cols).fill(rows);
  for (let i = cols - extra; i < cols; i++) colLengths[order.indexOf(i)] = rows - 1;

  const matrix = [];
  let pos = 0;
  for (const col of order) {
    matrix[col] = ciphertext.slice(pos, pos + colLengths[order.indexOf(col)]).split('');
    pos += colLengths[order.indexOf(col)];
  }

  let result = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[c][r]) result += matrix[c][r];
    }
  }
  return result;
}

// ── Beaufort Cipher ───────────────────────────────────────────────────────────
function beaufortDecrypt(text, key) {
  const k = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!k.length) return text;
  let ki = 0;
  return text.replace(/[a-zA-Z]/g, ch => {
    const base = ch <= 'Z' ? 65 : 97;
    const shift = k.charCodeAt(ki % k.length) - 65;
    const y = ch.charCodeAt(0) - base;
    ki++;
    return String.fromCharCode(((shift - y + 26) % 26) + base);
  });
}

// ── ROT-N family (1-25) ───────────────────────────────────────────────────────
function rotNFamily(text) {
  const results = [];
  for (let n = 1; n <= 25; n++) {
    const dec = text.replace(/[a-zA-Z]/g, ch => {
      const base = ch <= 'Z' ? 65 : 97;
      return String.fromCharCode(((ch.charCodeAt(0) - base + n) % 26) + base);
    });
    results.push({ rot: n, decrypted: dec, score: parseFloat(scoreEnglish(dec).toFixed(4)) });
  }
  results.sort((a, b) => b.score - a.score);
  return results;
}

// ── Main encryption breaker dispatcher ────────────────────────────────────────
function breakEncryption(input, method) {
  switch (method) {
    case 'vigenere':    return breakVigenere(input);
    case 'railfence':  return breakRailFence(input);
    case 'atbash':     return { decrypted: atbashDecrypt(input), method: 'Atbash' };
    case 'affine':     return breakAffine(input);
    case 'rot':        return { results: rotNFamily(input), best: rotNFamily(input)[0] };
    case 'columnar':   return { note: 'Provide key word for columnar transposition.' };
    case 'beaufort':   return { note: 'Provide key word for Beaufort cipher.' };
    default:           return { error: 'Unknown method' };
  }
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

window.OmniDecoder = {
  inspectZeroWidth,
  analyzeBase64Padding,
  analyzeCustomAlphabet,
  inspectEntropy,
  runPipeline,
  xorBruteForce,
  caesarBruteForce,
  detectInterleavedNoise,
  detectFingerprints,
  autoAnalyze,
  analyzeWithGemini,
  // Hash
  identifyHash,
  analyzeHash,
  dictionaryAttack,
  onlineLookup,
  // Encryption
  breakEncryption,
  breakVigenere,
  breakRailFence,
  breakAffine,
  atbashDecrypt,
  vigenereDecrypt,
  beaufortDecrypt,
  columnarDecrypt,
  rotNFamily,
  // Utilities
  textToBytes,
  hexToBytes,
  base64ToBytes,
  KNOWN_ALPHABETS,
  ZW_MAP,
  DICT_WORDLIST,
  HASH_SIGNATURES,
};
