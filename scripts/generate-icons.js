// Генерация PNG-иконок для QWAS Mobile (Expo).
// Pure Node.js — без внешних зависимостей.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets', 'images');

function crc32(buf) {
  let c, t = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = t[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcInput, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(width, height, pixelFn) {
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowBytes + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const off = y * (rowBytes + 1) + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function brandColor(t) {
  // Gradient #5e8ee7 → #2b5278
  return [lerp(94, 43, t), lerp(142, 82, t), lerp(231, 120, t), 255];
}

function pointInTri(px, py, v1, v2, v3) {
  const sign = (p1, p2, p3) =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign({ x: px, y: py }, v1, v2);
  const d2 = sign({ x: px, y: py }, v2, v3);
  const d3 = sign({ x: px, y: py }, v3, v1);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

// Paper plane icon: gradient circle + white paper plane
function paperPlane(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45;
  const planeSize = size * 0.22;

  return (x, y) => {
    const dy = y / size;
    const c = brandColor(dy);
    const dx = x - cx;
    const dy2 = y - cy;
    const dist = Math.sqrt(dx * dx + dy2 * dy2);

    if (dist > r) return [0, 0, 0, 0];

    const ang = -Math.PI / 6;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const rx = dx * cos - dy2 * sin;
    const ry = dx * sin + dy2 * cos;

    const v1 = { x: -planeSize * 0.5, y: planeSize * 0.4 };
    const v2 = { x: planeSize * 0.6, y: -planeSize * 0.1 };
    const v3 = { x: -planeSize * 0.4, y: -planeSize * 0.5 };

    if (pointInTri(rx, ry, v1, v2, v3)) {
      return [255, 255, 255, 230];
    }
    return c;
  };
}

// Solid background gradient (no plane) — для Android adaptive
function solidBackground(size) {
  return (x, y) => brandColor(y / size);
}

// Adaptive icon foreground: только paper plane на прозрачном фоне
function adaptiveForeground(size) {
  const cx = size / 2;
  const cy = size / 2;
  const planeSize = size * 0.18;

  return (x, y) => {
    const dx = x - cx;
    const dy2 = y - cy;
    const dist = Math.sqrt(dx * dx + dy2 * dy2);
    const ang = -Math.PI / 6;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const rx = dx * cos - dy2 * sin;
    const ry = dx * sin + dy2 * cos;
    const v1 = { x: -planeSize * 0.5, y: planeSize * 0.4 };
    const v2 = { x: planeSize * 0.6, y: -planeSize * 0.1 };
    const v3 = { x: -planeSize * 0.4, y: -planeSize * 0.5 };
    if (pointInTri(rx, ry, v1, v2, v3)) return [255, 255, 255, 255];
    return [0, 0, 0, 0];
  };
}

// Monochrome version (для Android themed icons)
function monochrome(size) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45;
  const planeSize = size * 0.22;

  return (x, y) => {
    const dx = x - cx;
    const dy2 = y - cy;
    const dist = Math.sqrt(dx * dx + dy2 * dy2);
    if (dist > r) return [0, 0, 0, 0];

    const ang = -Math.PI / 6;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const rx = dx * cos - dy2 * sin;
    const ry = dx * sin + dy2 * cos;
    const v1 = { x: -planeSize * 0.5, y: planeSize * 0.4 };
    const v2 = { x: planeSize * 0.6, y: -planeSize * 0.1 };
    const v3 = { x: -planeSize * 0.4, y: -planeSize * 0.5 };
    if (pointInTri(rx, ry, v1, v2, v3)) return [0, 0, 0, 255];
    return [255, 255, 255, 255];
  };
}

function generate(size, fileName, drawFn) {
  const buf = makePng(size, size, drawFn);
  const out = path.join(OUT, fileName);
  fs.writeFileSync(out, buf);
  console.log(`✓ ${fileName} (${size}x${size}, ${buf.length} bytes)`);
}

console.log('Генерация иконок QWAS Mobile…');

// Main app icon (Expo)
generate(1024, 'icon.png', paperPlane(1024));

// iOS-specific (если Expo попросит)
generate(180, 'icon-180.png', paperPlane(180));
generate(120, 'icon-120.png', paperPlane(120));
generate(60, 'icon-60.png', paperPlane(60));

// Android adaptive: foreground (plane on transparent), background (gradient solid)
generate(1024, 'android-icon-foreground.png', adaptiveForeground(1024));
generate(1024, 'android-icon-background.png', solidBackground(1024));
generate(1024, 'android-icon-monochrome.png', monochrome(1024));

// Splash icon (smaller paper plane)
generate(1024, 'splash-icon.png', paperPlane(1024));

// Favicon
generate(48, 'favicon.png', paperPlane(48));
generate(32, 'favicon-32.png', paperPlane(32));
generate(16, 'favicon-16.png', paperPlane(16));

console.log('Готово!');
