import fs from "fs";
import path from "path";
import sharp from "sharp";

const SOURCE_PATH = path.resolve("public/brand/gp-logo-master.jpg");

function createIco(images) {
  const headerLen = 6;
  const dirEntryLen = 16;
  let offset = headerLen + dirEntryLen * images.length;

  const header = Buffer.alloc(headerLen);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const dirEntries = [];
  const buffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(dirEntryLen);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);

    dirEntries.push(entry);
    buffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...buffers]);
}

async function run() {
  console.log("Generating brand assets from:", SOURCE_PATH);

  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error("Source image not found: " + SOURCE_PATH);
  }

  const baseImage = sharp(SOURCE_PATH);

  // 1. High-Res Master Square Brand Assets
  console.log("-> Generating 1024x1024 Vercel / GitHub Avatar");
  await baseImage
    .clone()
    .resize(1024, 1024, { fit: "cover" })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile("public/brand/gp-logo-vercel.png");

  console.log("-> Generating 512x512 Master Avatar");
  await baseImage
    .clone()
    .resize(512, 512, { fit: "cover" })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile("public/brand/gp-avatar-512.png");

  // 2. PWA Icons
  console.log("-> Generating PWA 512x512 icon");
  await baseImage
    .clone()
    .resize(512, 512, { fit: "cover" })
    .png({ quality: 95 })
    .toFile("public/icons/icon-512.png");

  console.log("-> Generating PWA 192x192 icon");
  await baseImage
    .clone()
    .resize(192, 192, { fit: "cover" })
    .png({ quality: 95 })
    .toFile("public/icons/icon-192.png");

  // Maskable icon with 10% safe-zone margin on #000319 background
  console.log("-> Generating PWA 512x512 Maskable icon");
  const innerSize = Math.round(512 * 0.82); // 82% scale leaves ~9% safe zone padding all around
  const innerBuffer = await baseImage
    .clone()
    .resize(innerSize, innerSize, { fit: "cover" })
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 3, b: 25, alpha: 1 }, // #000319
    },
  })
    .composite([{ input: innerBuffer, gravity: "center" }])
    .png({ quality: 95 })
    .toFile("public/icons/icon-maskable-512.png");

  // 3. Apple Touch Icon (180x180)
  console.log("-> Generating Apple Touch Icon (180x180)");
  await baseImage
    .clone()
    .resize(180, 180, { fit: "cover" })
    .png({ quality: 95 })
    .toFile("public/apple-touch-icon.png");

  // 4. Standard Browser Tab PNG Icon (32x32 & 48x48)
  console.log("-> Generating icon.png (32x32)");
  await baseImage
    .clone()
    .resize(32, 32, { fit: "cover" })
    .png({ quality: 95 })
    .toFile("public/icon.png");

  // 5. Multi-resolution favicon.ico (16, 32, 48)
  console.log("-> Generating favicon.ico (16x16, 32x32, 48x48)");
  const b16 = await baseImage.clone().resize(16, 16, { fit: "cover" }).png().toBuffer();
  const b32 = await baseImage.clone().resize(32, 32, { fit: "cover" }).png().toBuffer();
  const b48 = await baseImage.clone().resize(48, 48, { fit: "cover" }).png().toBuffer();

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: b16 },
    { width: 32, height: 32, buffer: b32 },
    { width: 48, height: 48, buffer: b48 },
  ]);

  fs.writeFileSync("public/favicon.ico", icoBuffer);

  // Also copy apple-touch-icon and icon to root for direct fallback
  fs.copyFileSync("public/favicon.ico", "app/favicon.ico");

  console.log("✅ All raster brand assets successfully generated!");
}

run().catch((err) => {
  console.error("Asset generation error:", err);
  process.exit(1);
});
