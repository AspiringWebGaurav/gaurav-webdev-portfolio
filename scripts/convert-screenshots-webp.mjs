import fs from "fs";
import path from "path";
import sharp from "sharp";

async function convertAll() {
  const projectsDir = path.join(process.cwd(), "public", "projects");
  const slugs = fs.readdirSync(projectsDir);
  let totalOrigBytes = 0;
  let totalWebpBytes = 0;
  let count = 0;

  console.log("Starting WebP conversion for project screenshots...");

  for (const slug of slugs) {
    const dir = path.join(projectsDir, slug);
    if (!fs.statSync(dir).isDirectory()) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png"));
    for (const file of files) {
      const pngPath = path.join(dir, file);
      const webpPath = path.join(dir, file.replace(/\.png$/, ".webp"));

      const origSize = fs.statSync(pngPath).size;
      totalOrigBytes += origSize;

      await sharp(pngPath)
        .webp({ quality: 85, effort: 5 })
        .toFile(webpPath);

      const webpSize = fs.statSync(webpPath).size;
      totalWebpBytes += webpSize;
      count++;

      const saving = (((origSize - webpSize) / origSize) * 100).toFixed(1);
      console.log(
        `[${slug}] ${file} -> ${path.basename(webpPath)}: ${(origSize / 1024).toFixed(0)}KB -> ${(webpSize / 1024).toFixed(0)}KB (-${saving}%)`
      );

      // Remove the original PNG
      fs.unlinkSync(pngPath);
    }
  }

  console.log("\n================ CONVERSION SUMMARY ================");
  console.log(`Converted: ${count} screenshots`);
  console.log(`Original total size: ${(totalOrigBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`New WebP total size: ${(totalWebpBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(
    `Saved: ${((totalOrigBytes - totalWebpBytes) / (1024 * 1024)).toFixed(2)} MB (-${(
      ((totalOrigBytes - totalWebpBytes) / totalOrigBytes) *
      100
    ).toFixed(1)}%)`
  );
}

convertAll().catch(console.error);
