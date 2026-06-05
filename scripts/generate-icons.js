// Генерация PNG-иконок для QWAS Mobile (Expo) — через sharp.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.join(__dirname, '..', 'assets', 'images');

// iOS-style gradient: #5e8ee7 → #2b5278
function svgPaperPlane(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#5e8ee7"/>
      <stop offset="100%" stop-color="#2b5278"/>
    </linearGradient>
  </defs>
  <circle cx="512" cy="512" r="512" fill="url(#bg)"/>
  <g transform="translate(512 512) rotate(-30)">
    <path d="M -220 180 L 270 -50 L -180 -220 Z" fill="white" fill-opacity="0.95"/>
    <path d="M -220 180 L 270 -50 L 80 60 Z" fill="white" fill-opacity="0.65"/>
  </g>
</svg>`;
}

function svgBackground(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#5e8ee7"/>
      <stop offset="100%" stop-color="#2b5278"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
</svg>`;
}

function svgForeground(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <g transform="translate(512 512) rotate(-30)">
    <path d="M -220 180 L 270 -50 L -180 -220 Z" fill="white"/>
  </g>
</svg>`;
}

function svgMonochrome(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <circle cx="512" cy="512" r="512" fill="white"/>
  <g transform="translate(512 512) rotate(-30)">
    <path d="M -220 180 L 270 -50 L -180 -220 Z" fill="black"/>
  </g>
</svg>`;
}

async function generate(fileName, svg, size) {
  const out = path.join(OUT, fileName);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  const stat = fs.statSync(out);
  console.log(`✓ ${fileName} (${size}x${size}, ${stat.size} bytes)`);
}

async function main() {
  console.log('Генерация иконок QWAS Mobile…');

  // Main app icon (Expo) - 1024x1024
  await generate('icon.png', svgPaperPlane(1024), 1024);

  // iOS-specific
  await generate('icon-180.png', svgPaperPlane(180), 180);
  await generate('icon-120.png', svgPaperPlane(120), 120);
  await generate('icon-60.png', svgPaperPlane(60), 60);

  // Android adaptive
  await generate('android-icon-foreground.png', svgForeground(1024), 1024);
  await generate('android-icon-background.png', svgBackground(1024), 1024);
  await generate('android-icon-monochrome.png', svgMonochrome(1024), 1024);

  // Splash icon
  await generate('splash-icon.png', svgPaperPlane(1024), 1024);

  // Favicon
  await generate('favicon.png', svgPaperPlane(48), 48);
  await generate('favicon-32.png', svgPaperPlane(32), 32);
  await generate('favicon-16.png', svgPaperPlane(16), 16);

  console.log('Готово!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
