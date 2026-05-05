#!/usr/bin/env node
/**
 * Generates PWA icons: amber background + white checkmark
 * Pure Node.js, no external deps (only built-in zlib)
 */

import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "zlib";

// ── CRC32 ─────────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

// ── PNG writer ────────────────────────────────────────────────────────────────

function pngChunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.allocUnsafe(4);
  crc.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, t, data, crc]);
}

function buildPNG(pixels, size) {
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rowLen = 1 + size * 3;
  const raw = Buffer.alloc(rowLen * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const pi = (y * size + x) * 3;
      raw[y * rowLen + 1 + x * 3] = pixels[pi];
      raw[y * rowLen + 1 + x * 3 + 1] = pixels[pi + 1];
      raw[y * rowLen + 1 + x * 3 + 2] = pixels[pi + 2];
    }
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Drawing helpers ───────────────────────────────────────────────────────────

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const nx = x1 + t * dx - px;
  const ny = y1 + t * dy - py;
  return Math.sqrt(nx * nx + ny * ny);
}

// ── Icon generator ────────────────────────────────────────────────────────────

function generateIcon(size) {
  const pixels = new Uint8Array(size * size * 3);
  const amber = [217, 119, 6]; // #d97706

  // Checkmark control points (relative to size)
  const p = (v) => Math.round(v * size);
  const x1 = p(0.22), y1 = p(0.52);
  const xm = p(0.42), ym = p(0.70);
  const x2 = p(0.78), y2 = p(0.30);
  const thickness = size * 0.075;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3;
      const d1 = distToSegment(x, y, x1, y1, xm, ym);
      const d2 = distToSegment(x, y, xm, ym, x2, y2);
      const d = Math.min(d1, d2);

      if (d < thickness) {
        // white with anti-alias at edge
        const alpha = d < thickness - 1 ? 1 : 1 - (d - (thickness - 1));
        pixels[i] = Math.round(255 * alpha + amber[0] * (1 - alpha));
        pixels[i + 1] = Math.round(255 * alpha + amber[1] * (1 - alpha));
        pixels[i + 2] = Math.round(255 * alpha + amber[2] * (1 - alpha));
      } else {
        pixels[i] = amber[0];
        pixels[i + 1] = amber[1];
        pixels[i + 2] = amber[2];
      }
    }
  }

  return buildPNG(pixels, size);
}

// ── Generate ──────────────────────────────────────────────────────────────────

mkdirSync("public/icons", { recursive: true });

const sizes = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable-512.png", 512],
  ["apple-touch-icon.png", 180],
];

for (const [name, size] of sizes) {
  const buf = generateIcon(size);
  writeFileSync(`public/icons/${name}`, buf);
  console.log(`✓ public/icons/${name} (${size}×${size})`);
}
