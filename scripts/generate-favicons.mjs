import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

async function buildIco(sizes, srcSvgPath) {
  const images = [];
  for (const s of sizes) {
    const buf = await sharp(srcSvgPath)
      .resize(s, s)
      .ensureAlpha()
      .png({ colorType: 6 })
      .toBuffer();
    images.push({ size: s, buf });
  }

  const count = images.length;
  const headerSize = 6 + count * 16;
  let currentOffset = headerSize;

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry[0] = img.size >= 256 ? 0 : img.size;
    entry[1] = img.size >= 256 ? 0 : img.size;
    entry[2] = 0; // color palette
    entry[3] = 0; // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buf.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset
    entries.push(entry);
    currentOffset += img.buf.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  return Buffer.concat([header, ...entries, ...images.map((img) => img.buf)]);
}

async function main() {
  const svgPath = path.join(process.cwd(), "public", "icon.svg");

  console.log("Generating 32-bit RGBA favicon.ico (16x16, 32x32, 48x48)...");
  const icoBuffer = await buildIco([16, 32, 48], svgPath);

  // Write to both app/favicon.ico and public/favicon.ico
  await fs.writeFile(path.join(process.cwd(), "app", "favicon.ico"), icoBuffer);
  await fs.writeFile(path.join(process.cwd(), "public", "favicon.ico"), icoBuffer);
  console.log("  ✔ Saved app/favicon.ico and public/favicon.ico (" + icoBuffer.length + " bytes)");

  // Generate 512x512 public/icon.png
  console.log("Generating 512x512 public/icon.png (RGBA)...");
  const iconPngBuffer = await sharp(svgPath)
    .resize(512, 512)
    .ensureAlpha()
    .png({ colorType: 6 })
    .toBuffer();
  await fs.writeFile(path.join(process.cwd(), "public", "icon.png"), iconPngBuffer);
  console.log("  ✔ Saved public/icon.png (" + iconPngBuffer.length + " bytes)");

  // Generate 180x180 Apple touch icons (RGBA)
  console.log("Generating 180x180 Apple touch icons (RGBA)...");
  const appleTouchBuffer = await sharp(svgPath)
    .resize(180, 180)
    .ensureAlpha()
    .png({ colorType: 6 })
    .toBuffer();
  await fs.writeFile(path.join(process.cwd(), "public", "apple-touch-icon.png"), appleTouchBuffer);
  await fs.writeFile(path.join(process.cwd(), "public", "apple-icon.png"), appleTouchBuffer);
  console.log("  ✔ Saved public/apple-touch-icon.png and public/apple-icon.png");

  console.log("\nAll favicons and icons regenerated successfully with RGBA format!");
}

main().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
