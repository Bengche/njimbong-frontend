/**
 * Embeds public/logs.png as base64 into logo.svg, app/icon.svg, and public/icon-192x192.svg.
 * Run: node scripts/gen-svgs.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const src = fs.readFileSync(path.join(root, "public", "logs.png"));
const dataUri = "data:image/png;base64," + src.toString("base64");

const svg200 = `<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Njimbong">
  <rect width="200" height="200" fill="white"/>
  <image href="${dataUri}" x="0" y="0" width="200" height="200" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

const svg192 = `<svg width="192" height="192" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Njimbong">
  <rect width="200" height="200" fill="white"/>
  <image href="${dataUri}" x="0" y="0" width="200" height="200" preserveAspectRatio="xMidYMid meet"/>
</svg>`;

fs.writeFileSync(path.join(root, "public", "logo.svg"), svg200);
fs.writeFileSync(path.join(root, "app", "icon.svg"), svg200);
fs.writeFileSync(path.join(root, "public", "icon-192x192.svg"), svg192);

console.log("logo.svg         written");
console.log("app/icon.svg     written");
console.log("icon-192x192.svg written");
