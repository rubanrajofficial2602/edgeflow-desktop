/**
 * Icon Generator for EdgeFlow ERP Desktop
 * Run: node build/generate-icons.js
 * Requires: npm install sharp (run once)
 *
 * This generates icon.png (1024x1024) → icon.ico (Windows) and icon.icns (Mac)
 * You can replace icon.svg with your own logo before running.
 */
const fs = require("fs");
const path = require("path");

// SVG source — EdgeFlow logo
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="200" fill="#1e0a4c"/>
  <rect width="1024" height="1024" rx="200" fill="url(#grad)"/>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#db2777"/>
    </linearGradient>
  </defs>
  <!-- Lightning bolt -->
  <polygon points="580,120 380,530 510,530 440,900 680,440 540,440 640,120" fill="white" opacity="0.95"/>
</svg>`;

fs.writeFileSync(path.join(__dirname, "icon.svg"), svg);
console.log("✅ icon.svg written");
console.log("");
console.log("Next steps to generate .ico and .icns:");
console.log("  npm install -g electron-icon-maker");
console.log("  electron-icon-maker --input=build/icon.png --output=build/");
console.log("");
console.log("Or use an online tool:");
console.log("  https://www.icoconverter.com  → icon.ico");
console.log("  https://cloudconvert.com      → icon.icns");
