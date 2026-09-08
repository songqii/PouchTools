import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import {
  decodeBase64,
  dateToTimestamp,
  encodeBase64,
  encodeUrl,
  decodeUrl,
  formatDateTime,
  formatJson,
  generateUuid,
  md5,
  minifyJson,
  timestampToDate,
  timestampToDateString,
} from '../src/utils.js';

test('Base64 round-trips UTF-8 text and supports URL-safe output', () => {
  const value = '你好, PouchTools! / ✓';
  const encoded = encodeBase64(value);
  assert.equal(encoded, '5L2g5aW9LCBQb3VjaFRvb2xzISAvIOKckw==');
  assert.equal(decodeBase64(encoded), value);

  const urlSafe = encodeBase64(Uint8Array.from([0xff]), { urlSafe: true });
  assert.equal(urlSafe, '_w');
  assert.deepEqual(Array.from(decodeBase64(urlSafe, { asBytes: true })), [0xff]);
  assert.throws(() => decodeBase64('a==='), /characters|padding/);
  assert.throws(() => decodeBase64('not base64!'), /characters/);
});

test('MD5 matches standard vectors and Node crypto for Unicode', () => {
  const vectors = [
    ['', 'd41d8cd98f00b204e9800998ecf8427e'],
    ['a', '0cc175b9c0f1b6a831c399e269772661'],
    ['abc', '900150983cd24fb0d6963f7d28e17f72'],
    ['message digest', 'f96b697d7cb7938d525a2f31aaf161d0'],
    ['你好，世界', createHash('md5').update('你好，世界').digest('hex')],
  ];
  for (const [input, expected] of vectors) assert.equal(md5(input), expected, input);
});

test('timestamp helpers convert seconds, milliseconds, and timezones', () => {
  const date = timestampToDate(0);
  assert.equal(date.toISOString(), '1970-01-01T00:00:00.000Z');
  assert.equal(timestampToDate('1788834600000', { unit: 'ms' }).getTime(), 1788834600000);
  assert.equal(dateToTimestamp('2026-09-08T02:30:00.000Z'), 1788834600);
  assert.equal(dateToTimestamp('2026-09-08T02:30:00.123Z', { unit: 'milliseconds' }), 1788834600123);
  assert.equal(timestampToDateString(1788834600, { timeZone: 'Asia/Shanghai' }), '2026-09-08 10:30:00');
  assert.equal(formatDateTime(new Date('2026-09-08T02:30:00Z'), { timeZone: 'UTC', includeSeconds: false }), '2026-09-08 02:30');
  assert.throws(() => timestampToDate('nope'), /finite number/);
  assert.throws(() => dateToTimestamp(null), /Date must be/);
});

test('JSON helpers format, minify, and optionally sort keys', () => {
  const input = '{"z":1,"nested":{"b":true,"a":null}}';
  assert.equal(formatJson(input, { indent: 2, sortKeys: true }), '{\n  "nested": {\n    "a": null,\n    "b": true\n  },\n  "z": 1\n}');
  assert.equal(formatJson('{"a":1}', { indent: '\t' }), '{\n\t"a": 1\n}');
  assert.equal(minifyJson(input), '{"z":1,"nested":{"b":true,"a":null}}');
  assert.equal(formatJson(null), 'null');
  assert.throws(() => formatJson('{oops}'), SyntaxError);
});

test('URL helpers handle components and complete URLs', () => {
  const value = '你好 &/?';
  assert.equal(decodeUrl(encodeUrl(value)), value);
  const url = 'https://example.com/a path?q=hello world';
  assert.equal(decodeUrl(encodeUrl(url, { component: false }), { component: false }), url);
});

test('UUID helper emits RFC 4122 version 4 values', () => {
  const uuid = generateUuid();
  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(uuid, generateUuid());
});
