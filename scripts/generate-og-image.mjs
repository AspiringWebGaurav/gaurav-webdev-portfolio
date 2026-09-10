import fs from "fs";
import path from "path";
import sharp from "sharp";

async function generateOgImage() {
  const width = 1200;
  const height = 630;

  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <!-- Background Gradient -->
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#000319"/>
        <stop offset="50%" stop-color="#04071D"/>
        <stop offset="100%" stop-color="#0A0E2A"/>
      </linearGradient>

      <!-- Glow Gradients -->
      <radialGradient id="purpleGlow" cx="20%" cy="30%" r="40%">
        <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#7C3AED" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="blueGlow" cx="80%" cy="70%" r="40%">
        <stop offset="0%" stop-color="#3B82F6" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#3B82F6" stop-opacity="0"/>
      </radialGradient>

      <!-- Border Gradient -->
      <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#CBACF9" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="#7C3AED" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#3B82F6" stop-opacity="0.4"/>
      </linearGradient>
    </defs>

    <!-- Base Canvas -->
    <rect width="${width}" height="${height}" fill="url(#bg)" />

    <!-- Ambient Glows -->
    <rect width="${width}" height="${height}" fill="url(#purpleGlow)" />
    <rect width="${width}" height="${height}" fill="url(#blueGlow)" />

    <!-- Inner Framed Border -->
    <rect x="40" y="40" width="1120" height="550" rx="24" fill="none" stroke="url(#borderGrad)" stroke-width="2" />

    <!-- Eyebrow Tag -->
    <g transform="translate(90, 110)">
      <rect x="0" y="0" width="280" height="38" rx="19" fill="#10132E" stroke="#CBACF9" stroke-opacity="0.3" stroke-width="1.5"/>
      <text x="140" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#CBACF9" letter-spacing="2" text-anchor="middle">
        PRODUCTION SOFTWARE ENGINEER
      </text>
    </g>

    <!-- Main Title -->
    <text x="90" y="220" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="800" fill="#FFFFFF" letter-spacing="-1">
      Gaurav Patil
    </text>

    <!-- Subtitle / Value Prop -->
    <text x="90" y="280" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="400" fill="#C1C2D3">
      Architecting Scalable Systems &amp; High-Performance Software
    </text>

    <!-- Description -->
    <text x="90" y="340" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="400" fill="#888EAC">
      Specializing in Next.js 15, WebRTC P2P networks, distributed cloud systems, and real-time platforms.
    </text>

    <!-- Tech Stack Strip -->
    <g transform="translate(90, 420)">
      <!-- Pill 1 -->
      <g transform="translate(0, 0)">
        <rect width="130" height="42" rx="10" fill="#0E1328" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
        <text x="65" y="26" font-family="monospace" font-size="14" font-weight="500" fill="#E2E8F0" text-anchor="middle">Next.js 15</text>
      </g>
      <!-- Pill 2 -->
      <g transform="translate(145, 0)">
        <rect width="130" height="42" rx="10" fill="#0E1328" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
        <text x="65" y="26" font-family="monospace" font-size="14" font-weight="500" fill="#E2E8F0" text-anchor="middle">React 19</text>
      </g>
      <!-- Pill 3 -->
      <g transform="translate(290, 0)">
        <rect width="140" height="42" rx="10" fill="#0E1328" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
        <text x="70" y="26" font-family="monospace" font-size="14" font-weight="500" fill="#E2E8F0" text-anchor="middle">TypeScript</text>
      </g>
      <!-- Pill 4 -->
      <g transform="translate(445, 0)">
        <rect width="130" height="42" rx="10" fill="#0E1328" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
        <text x="65" y="26" font-family="monospace" font-size="14" font-weight="500" fill="#E2E8F0" text-anchor="middle">WebRTC</text>
      </g>
      <!-- Pill 5 -->
      <g transform="translate(590, 0)">
        <rect width="140" height="42" rx="10" fill="#0E1328" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
        <text x="70" y="26" font-family="monospace" font-size="14" font-weight="500" fill="#E2E8F0" text-anchor="middle">Rust &amp; Tauri</text>
      </g>
      <!-- Pill 6 -->
      <g transform="translate(745, 0)">
        <rect width="130" height="42" rx="10" fill="#0E1328" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1"/>
        <text x="65" y="26" font-family="monospace" font-size="14" font-weight="500" fill="#E2E8F0" text-anchor="middle">Firestore</text>
      </g>
    </g>

    <!-- Footer URL -->
    <g transform="translate(90, 525)">
      <circle cx="6" cy="-4" r="5" fill="#10B981" />
      <text x="24" y="0" font-family="monospace" font-size="18" font-weight="600" fill="#CBACF9">
        https://gauravpatil.site
      </text>
    </g>

    <!-- Corner Watermark -->
    <text x="1070" y="525" font-family="monospace" font-size="14" font-weight="500" fill="#555C7A" text-anchor="end">
      Portfolio &amp; Engineering Systems
    </text>
  </svg>
  `;

  const outputPath = path.join(process.cwd(), "public", "og-image.png");
  await sharp(Buffer.from(svg))
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log(`Generated luxury OG image: ${outputPath} (${fs.statSync(outputPath).size} bytes)`);
}

generateOgImage().catch(console.error);
