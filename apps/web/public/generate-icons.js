const fs = require('fs');
const path = require('path');

// This script generates SVG icons that can be converted to PNG
// You can use an online converter or ImageMagick to convert these to PNG

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateSVGIcon(size) {
  const borderWidth = size * 0.02;
  const gmFontSize = size * 0.35;
  const subFontSize = size * 0.08;
  const starSize = size * 0.04;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#055F3C;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#044a2f;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="${size * 0.01}" dy="${size * 0.01}" stdDeviation="${size * 0.01}" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bgGradient)"/>
  
  <!-- Border -->
  <rect x="${borderWidth}" y="${borderWidth}" 
        width="${size - borderWidth * 2}" height="${size - borderWidth * 2}" 
        fill="none" stroke="#fbbf24" stroke-width="${borderWidth}"/>
  
  <!-- GM Text -->
  <text x="${size / 2}" y="${size * 0.45}" 
        font-family="Arial, sans-serif" 
        font-size="${gmFontSize}" 
        font-weight="bold" 
        fill="#fbbf24" 
        text-anchor="middle" 
        dominant-baseline="middle"
        filter="url(#shadow)">GM</text>
  
  <!-- GOLDMASTERS Text -->
  <text x="${size / 2}" y="${size * 0.75}" 
        font-family="Arial, sans-serif" 
        font-size="${subFontSize}" 
        fill="#fbbf24" 
        text-anchor="middle" 
        dominant-baseline="middle">GOLDMASTERS</text>
  
  ${size >= 192 ? `
  <!-- Decorative stars -->
  <path d="M${size * 0.15},${size * 0.13}l${starSize * 0.3},${starSize * 0.9}l${starSize * 0.9},${starSize * 0.3}l-${starSize * 0.7},${starSize * 0.7}l${starSize * 0.3},${starSize * 0.9}l-${starSize * 0.9},-${starSize * 0.3}l-${starSize * 0.7},${starSize * 0.7}l-${starSize * 0.3},-${starSize * 0.9}l-${starSize * 0.9},-${starSize * 0.3}l${starSize * 0.7},-${starSize * 0.7}z" fill="#fbbf24"/>
  <path d="M${size * 0.85},${size * 0.13}l${starSize * 0.3},${starSize * 0.9}l${starSize * 0.9},${starSize * 0.3}l-${starSize * 0.7},${starSize * 0.7}l${starSize * 0.3},${starSize * 0.9}l-${starSize * 0.9},-${starSize * 0.3}l-${starSize * 0.7},${starSize * 0.7}l-${starSize * 0.3},-${starSize * 0.9}l-${starSize * 0.9},-${starSize * 0.3}l${starSize * 0.7},-${starSize * 0.7}z" fill="#fbbf24"/>
  <path d="M${size * 0.15},${size * 0.85}l${starSize * 0.3},${starSize * 0.9}l${starSize * 0.9},${starSize * 0.3}l-${starSize * 0.7},${starSize * 0.7}l${starSize * 0.3},${starSize * 0.9}l-${starSize * 0.9},-${starSize * 0.3}l-${starSize * 0.7},${starSize * 0.7}l-${starSize * 0.3},-${starSize * 0.9}l-${starSize * 0.9},-${starSize * 0.3}l${starSize * 0.7},-${starSize * 0.7}z" fill="#fbbf24"/>
  <path d="M${size * 0.85},${size * 0.85}l${starSize * 0.3},${starSize * 0.9}l${starSize * 0.9},${starSize * 0.3}l-${starSize * 0.7},${starSize * 0.7}l${starSize * 0.3},${starSize * 0.9}l-${starSize * 0.9},-${starSize * 0.3}l-${starSize * 0.7},${starSize * 0.7}l-${starSize * 0.3},-${starSize * 0.9}l-${starSize * 0.9},-${starSize * 0.3}l${starSize * 0.7},-${starSize * 0.7}z" fill="#fbbf24"/>
  ` : ''}
</svg>`;
}

const iconsDir = path.join(__dirname, 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG files
sizes.forEach(size => {
  const svg = generateSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated: ${filename}`);
});

console.log('\n✅ All SVG icons generated!');
console.log('\nNext steps:');
console.log('1. Convert SVG to PNG using one of these methods:');
console.log('   - Online: https://svgtopng.com/ or https://cloudconvert.com/svg-to-png');
console.log('   - ImageMagick: magick convert icon-72x72.svg icon-72x72.png');
console.log('   - Inkscape: inkscape icon-72x72.svg --export-filename=icon-72x72.png');
console.log('2. Place all PNG files in: apps/web/public/icons/');
