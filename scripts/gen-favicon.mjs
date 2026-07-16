/**
 * Creates a multi-size favicon.ico from the generated PNGs.
 * Run: node scripts/gen-favicon.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const outPath = path.join(__dirname, "..", "app", "favicon.ico");

// ICO format: header + directory entries + PNG blobs
// Modern browsers accept PNG-compressed ICO entries.
const sizes = [16, 32, 48];

const pngBuffers = sizes.map((s) => {
  const file =
    s === 48
      ? path.join(publicDir, "icon-96x96.png") // scale 96→48 not available; reuse 96 (browsers downscale)
      : path.join(publicDir, `icon-${s}x${s}.png`);
  // For 48 we don't have a native file; embed the 32px one and browsers handle it
  const actual = fs.existsSync(file)
    ? file
    : path.join(publicDir, "icon-32x32.png");
  return fs.readFileSync(actual);
});

// We'll write a simpler 2-size ICO (16 + 32) which is the standard
const entries = [pngBuffers[0], pngBuffers[1]]; // 16x16, 32x32
const entrySizes = [16, 32];

const HEADER_SIZE = 6;
const DIR_ENTRY_SIZE = 16;
const OFFSET_BASE = HEADER_SIZE + DIR_ENTRY_SIZE * entries.length;

const parts = [];

// ICO file header (6 bytes)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: 1 = ICO
header.writeUInt16LE(entries.length, 4); // image count
parts.push(header);

// Directory entries
let offset = OFFSET_BASE;
for (let i = 0; i < entries.length; i++) {
  const dir = Buffer.alloc(16);
  const sz = entrySizes[i];
  dir.writeUInt8(sz === 256 ? 0 : sz, 0); // width  (0 = 256)
  dir.writeUInt8(sz === 256 ? 0 : sz, 1); // height
  dir.writeUInt8(0, 2); // color palette count
  dir.writeUInt8(0, 3); // reserved
  dir.writeUInt16LE(1, 4); // color planes
  dir.writeUInt16LE(32, 6); // bits per pixel
  dir.writeUInt32LE(entries[i].length, 8); // size of image data
  dir.writeUInt32LE(offset, 12); // offset
  parts.push(dir);
  offset += entries[i].length;
}

// Image data
for (const buf of entries) parts.push(buf);

fs.writeFileSync(outPath, Buffer.concat(parts));
console.log(
  `favicon.ico written to ${outPath} (${Buffer.concat(parts).length} bytes)`,
);
