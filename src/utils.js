/**
 * Pure, dependency-free helpers used by the PouchTools UI.
 *
 * The module deliberately uses Web APIs (TextEncoder, Intl and Web Crypto)
 * when they are available, but has small fallbacks so it also works in the
 * Node test runner and in older webviews.
 */

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const HEX = '0123456789abcdef';

function utf8Encode(value) {
  const text = String(value);
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }

  // encodeURIComponent produces percent-encoded UTF-8 bytes and is available
  // in older webviews where TextEncoder is not present.
  const encoded = encodeURIComponent(text);
  const bytes = [];
  for (let index = 0; index < encoded.length;) {
    if (encoded[index] === '%') {
      bytes.push(Number.parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 3;
    } else {
      bytes.push(encoded.charCodeAt(index));
      index += 1;
    }
  }
  return Uint8Array.from(bytes);
}

function utf8Decode(bytes) {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  let encoded = '';
  for (const byte of bytes) {
    encoded += `%${byte.toString(16).padStart(2, '0')}`;
  }
  return decodeURIComponent(encoded);
}

function asBytes(value) {
  if (typeof value === 'string') return utf8Encode(value);
  if (value instanceof Uint8Array) return value;
  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  throw new TypeError('Expected a string, Uint8Array, ArrayBuffer, or typed array');
}

function bytesToBase64(bytes) {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const third = index + 2 < bytes.length ? bytes[index + 2] : 0;
    const remaining = bytes.length - index;

    output += BASE64_ALPHABET[first >> 2];
    output += BASE64_ALPHABET[((first & 0x03) << 4) | (second >> 4)];
    output += remaining > 1 ? BASE64_ALPHABET[((second & 0x0f) << 2) | (third >> 6)] : '=';
    output += remaining > 2 ? BASE64_ALPHABET[third & 0x3f] : '=';
  }
  return output;
}

function base64ToBytes(input) {
  if (typeof input !== 'string') {
    throw new TypeError('Base64 input must be a string');
  }

  const compact = input.replace(/\s+/g, '');
  if (compact.length === 0) return new Uint8Array(0);
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(compact)) {
    throw new SyntaxError('Invalid Base64 characters');
  }

  const paddingStart = compact.indexOf('=');
  const unpadded = paddingStart === -1 ? compact : compact.slice(0, paddingStart);
  const suppliedPadding = paddingStart === -1 ? 0 : compact.length - paddingStart;
  const expectedPadding = (4 - (unpadded.length % 4)) % 4;

  if (unpadded.length % 4 === 1 || (suppliedPadding > 0 && suppliedPadding !== expectedPadding)) {
    throw new SyntaxError('Invalid Base64 padding');
  }

  const normalized = unpadded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(expectedPadding);
  const bytes = new Uint8Array((normalized.length / 4) * 3 - expectedPadding);
  let outputIndex = 0;

  for (let index = 0; index < normalized.length; index += 4) {
    const a = BASE64_ALPHABET.indexOf(normalized[index]);
    const b = BASE64_ALPHABET.indexOf(normalized[index + 1]);
    const c = normalized[index + 2] === '=' ? 0 : BASE64_ALPHABET.indexOf(normalized[index + 2]);
    const d = normalized[index + 3] === '=' ? 0 : BASE64_ALPHABET.indexOf(normalized[index + 3]);
    if (a < 0 || b < 0 || c < 0 || d < 0) throw new SyntaxError('Invalid Base64 characters');

    const first = (a << 2) | (b >> 4);
    const second = ((b & 0x0f) << 4) | (c >> 2);
    const third = ((c & 0x03) << 6) | d;
    if (outputIndex < bytes.length) bytes[outputIndex++] = first;
    if (outputIndex < bytes.length) bytes[outputIndex++] = second;
    if (outputIndex < bytes.length) bytes[outputIndex++] = third;
  }
  return bytes;
}

/** Encode UTF-8 text (or raw bytes) as Base64. */
export function encodeBase64(value, { urlSafe = false, omitPadding = false } = {}) {
  let encoded = bytesToBase64(asBytes(value));
  if (urlSafe) encoded = encoded.replace(/\+/g, '-').replace(/\//g, '_');
  if (omitPadding || urlSafe) encoded = encoded.replace(/=+$/g, '');
  return encoded;
}

/** Decode standard or URL-safe Base64 into UTF-8 text. */
export function decodeBase64(value, { asBytes: returnBytes = false } = {}) {
  const bytes = base64ToBytes(value);
  return returnBytes ? bytes : utf8Decode(bytes);
}

/** Encode UTF-8 text into raw bytes for callers that need binary data. */
export { utf8Encode };

function add32(first, second) {
  return (first + second) >>> 0;
}

function rotateLeft(value, amount) {
  return (value << amount) | (value >>> (32 - amount));
}

const MD5_SHIFT = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];
const MD5_K = Array.from({ length: 64 }, (_, index) => (
  Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) >>> 0
));

function wordToHex(word) {
  return [0, 8, 16, 24].map((shift) => HEX[(word >>> (shift + 4)) & 0x0f] + HEX[(word >>> shift) & 0x0f]).join('');
}

/** Return the lowercase MD5 digest of UTF-8 text or bytes. */
export function md5(value) {
  const bytes = asBytes(value);
  const bitLength = bytes.length * 8;
  const blockLength = ((bytes.length + 9 + 63) >> 6) << 6;
  const padded = new Uint8Array(blockLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const lengthView = new DataView(padded.buffer);
  lengthView.setUint32(blockLength - 8, bitLength >>> 0, true);
  lengthView.setUint32(blockLength - 4, Math.floor(bitLength / 0x100000000) >>> 0, true);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;
  const words = new Uint32Array(16);

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = lengthView.getUint32(offset + index * 4, true);
    }

    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let index = 0; index < 64; index += 1) {
      let functionValue;
      let wordIndex;
      if (index < 16) {
        functionValue = (b & c) | (~b & d);
        wordIndex = index;
      } else if (index < 32) {
        functionValue = (d & b) | (~d & c);
        wordIndex = (5 * index + 1) % 16;
      } else if (index < 48) {
        functionValue = b ^ c ^ d;
        wordIndex = (3 * index + 5) % 16;
      } else {
        functionValue = c ^ (b | ~d);
        wordIndex = (7 * index) % 16;
      }

      const sum = add32(add32(add32(a, functionValue >>> 0), MD5_K[index]), words[wordIndex]);
      const rotated = rotateLeft(sum, MD5_SHIFT[index]);
      const nextB = add32(b, rotated >>> 0);
      a = d;
      d = c;
      c = b;
      b = nextB;
    }

    a0 = add32(a0, a);
    b0 = add32(b0, b);
    c0 = add32(c0, c);
    d0 = add32(d0, d);
  }

  return wordToHex(a0) + wordToHex(b0) + wordToHex(c0) + wordToHex(d0);
}

function normalizeTimeUnit(unit) {
  const normalized = String(unit ?? 'seconds').toLowerCase();
  if (['ms', 'millisecond', 'milliseconds'].includes(normalized)) return 'milliseconds';
  if (['s', 'sec', 'second', 'seconds'].includes(normalized)) return 'seconds';
  throw new RangeError(`Unsupported timestamp unit: ${unit}`);
}

function numericTimestamp(value) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof number !== 'number' || !Number.isFinite(number)) {
    throw new TypeError('Timestamp must be a finite number');
  }
  return number;
}

/** Convert a Unix timestamp into a Date. Unit defaults to seconds. */
export function timestampToDate(timestamp, { unit = 'seconds' } = {}) {
  const multiplier = normalizeTimeUnit(unit) === 'seconds' ? 1000 : 1;
  const date = new Date(numericTimestamp(timestamp) * multiplier);
  if (Number.isNaN(date.getTime())) throw new RangeError('Timestamp is outside the supported Date range');
  return date;
}

function toDate(value) {
  if (value instanceof Date) return new Date(value.getTime());
  if (typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError('Date must be a Date, a timestamp in milliseconds, or a non-empty date string');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid date value');
  return date;
}

/** Convert a Date or parseable date string into a Unix timestamp. */
export function dateToTimestamp(value, { unit = 'seconds' } = {}) {
  const date = toDate(value);
  return normalizeTimeUnit(unit) === 'seconds' ? Math.floor(date.getTime() / 1000) : date.getTime();
}

/** Format a date as stable YYYY-MM-DD HH:mm:ss text in the requested timezone. */
export function formatDateTime(value, { timeZone = 'UTC', includeSeconds = true } = {}) {
  const date = toDate(value);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map(({ type, value: part }) => [type, part]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}${includeSeconds ? `:${parts.second}` : ''}`;
}

/** Convert a Unix timestamp directly into formatted date text. */
export function timestampToDateString(timestamp, options = {}) {
  const { unit = 'seconds', ...formatOptions } = options;
  return formatDateTime(timestampToDate(timestamp, { unit }), formatOptions);
}

export function currentTimestamp({ unit = 'seconds' } = {}) {
  return dateToTimestamp(new Date(), { unit });
}

function sortJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortJsonValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortJsonValue(value[key])]));
  }
  return value;
}

function parseJsonInput(input) {
  if (typeof input === 'string') return JSON.parse(input);
  if (input === null) return null;
  if (input && typeof input === 'object') return input;
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  throw new TypeError('JSON input must be a string or JSON value');
}

/** Parse and pretty-print JSON. Throws SyntaxError for malformed input. */
export function formatJson(input, { indent = 2, sortKeys = false } = {}) {
  const validNumericIndent = Number.isInteger(indent) && indent >= 0 && indent <= 10;
  const validStringIndent = typeof indent === 'string' && indent.length <= 10;
  if (!validNumericIndent && !validStringIndent) {
    throw new RangeError('JSON indentation must be an integer from 0 to 10 or a string up to 10 characters');
  }
  const value = parseJsonInput(input);
  return JSON.stringify(sortKeys ? sortJsonValue(value) : value, null, indent);
}

export function minifyJson(input, { sortKeys = false } = {}) {
  const value = parseJsonInput(input);
  return JSON.stringify(sortKeys ? sortJsonValue(value) : value);
}

/** URL-encode a component (or a complete URI when component is false). */
export function encodeUrl(value, { component = true } = {}) {
  return (component ? encodeURIComponent : encodeURI)(String(value));
}

export function decodeUrl(value, { component = true } = {}) {
  return (component ? decodeURIComponent : decodeURI)(String(value));
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
    webCrypto.getRandomValues(bytes);
    return bytes;
  }

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

/** Generate an RFC 4122 version 4 UUID. */
export function generateUuid() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  const bytes = randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Friendly aliases for callers that prefer the tool names used in the UI.
export const base64Encode = encodeBase64;
export const base64Decode = decodeBase64;
export const md5Hex = md5;
export const formatTimestamp = timestampToDateString;
export const parseTimestamp = dateToTimestamp;
export const jsonFormat = formatJson;
export const urlEncode = encodeUrl;
export const urlDecode = decodeUrl;
export const generateUUID = generateUuid;
