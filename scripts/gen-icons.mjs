/**
 * Regenerates all PNG icon files from public/logs.png using sharp.
 * Run: node scripts/gen-icons.mjs
 */

import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const source = path.join(publicDir, "logs.png");

const sizes = [
  { name: "icon-16x16.png", size: 16, format: "png" },
  { name: "icon-32x32.png", size: 32, format: "png" },
  { name: "icon-72x72.png", size: 72, format: "png" },
  { name: "icon-96x96.png", size: 96, format: "png" },
  { name: "icon-128x128.png", size: 128, format: "png" },
  { name: "icon-144x144.png", size: 144, format: "png" },
  { name: "icon-152x152.png", size: 152, format: "png" },
  { name: "icon-192x192.png", size: 192, format: "png" },
  { name: "icon-384x384.png", size: 384, format: "png" },
  { name: "icon-512x512.png", size: 512, format: "png" },
  { name: "apple-touch-icon.png", size: 180, format: "png" },
  // Legacy filenames — kept in sync so nothing is ever stale
  { name: "logo njimbong.jpeg", size: 512, format: "jpeg" },
  { name: "iphone logo njimbong.PNG", size: 180, format: "png" },
];

// Trim white edges from source first, keep as buffer for reuse
const trimmedBuf = await sharp(source)
  .trim({ background: "#ffffff", threshold: 20 })
  .png()
  .toBuffer();

for (const { name, size, format } of sizes) {
  // Fit logo inside 80% of canvas so each side has exactly 10% padding
  const innerSize = Math.round(size * 0.8);
  const pad = Math.round((size - innerSize) / 2);

  const logoBuf = await sharp(trimmedBuf)
    .resize(innerSize, innerSize, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  const pipeline = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  }).composite([{ input: logoBuf, top: pad, left: pad }]);

  if (format === "jpeg") {
    await pipeline.jpeg({ quality: 95 }).toFile(path.join(publicDir, name));
  } else {
    await pipeline.png().toFile(path.join(publicDir, name));
  }

  console.log(`✓  ${name} (${size}x${size})`);
}

console.log("\nAll icons generated.");
