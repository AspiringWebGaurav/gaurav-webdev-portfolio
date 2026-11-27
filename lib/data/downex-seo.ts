export const DOWNEX_ORIGIN = "https://downex.apps.gauravpatil.site";
export const DOWNEX_PORTFOLIO_URL = "https://gauravpatil.site";
export const DOWNEX_GITHUB_URL = "https://github.com/AspiringWebGaurav/downex";
export const DOWNEX_DESKTOP_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DOWNEX_DOWNLOAD_URL ||
  "https://gphost.eu.cc/raw/downex-desktop?stream=true";
export const DOWNEX_EXTENSION_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_DOWNEX_EXTENSION_DOWNLOAD_URL ||
  "https://gphost.eu.cc/raw/downex-extension?stream=true";
export const DOWNEX_OG_IMAGE_URL = `${DOWNEX_ORIGIN}/api/downex/og`;
export const DOWNEX_SHA256 =
  "56027fd18140861adbed8e4e09de77e2e70078667cd0f23883efe64a0bc64b8c";

export const DOWNEX_KEYWORDS: string[] = [
  "Downex",
  "Downex Download Manager",
  "Simple free download manager",
  "simple download manager",
  "download manager",
  "download manager free",
  "free download manager",
  "free open source download manager",
  "open source download manager",
  "free IDM",
  "free IDM alternative",
  "IDM alternative Windows",
  "Internet Download Manager free alternative",
  "Windows 11 download manager",
  "Windows 10 download manager",
  "fast download manager",
  "multi-connection download accelerator",
  "32 connection download manager",
  "browser extension download manager",
  "Chrome download manager extension",
  "Edge download manager extension",
  "Brave download manager extension",
  "lightweight download manager Windows",
  "4GB RAM download manager",
  "sequential queue download manager",
  "pause and resume downloads Windows",
  "Rust Tauri download manager",
  "zero ad download manager",
  "Gaurav Patil Downex",
];

export interface DownexTopicPageMeta {
  slug: string;
  navLabel: string;
  shortTitle: string;
  title: string;
  description: string;
  keywords: string[];
  badge: string;
  summary: string;
}

export const DOWNEX_TOPIC_PAGES: DownexTopicPageMeta[] = [
  {
    slug: "/idm-alternative",
    navLabel: "Free IDM Alternative",
    shortTitle: "Downex vs IDM (Free Alternative)",
    title: "Free & Open Source IDM Alternative for Windows 10 & 11 (2026) | Downex",
    description:
      "Looking for a free IDM alternative without 30-day trials or nag popups? Downex delivers 32-stream acceleration, auto browser capture, sequential 1-by-1 queues, and clean modern UI — 100% free & open source.",
    keywords: [
      "free IDM alternative",
      "free IDM",
      "Internet Download Manager free alternative",
      "IDM alternative Windows 11",
      "open source IDM alternative",
      "Downex vs IDM",
    ],
    badge: "IDM Alternative • 100% Free & Zero Nag Popups",
    summary:
      "Compare Downex against Internet Download Manager (IDM) and browser built-in downloaders: 32 parallel HTTP/1.1 connections, automatic Chromium capture, sequential 1-by-1 queues, modern light/dark UI, and lifetime free updates.",
  },
  {
    slug: "/simple-download-manager",
    navLabel: "Simple Download Manager",
    shortTitle: "Simple Download Manager Guide",
    title: "Simple Download Manager for Windows 10 & 11 — Fast & Clean | Downex",
    description:
      "A simple download manager built for everyday Windows speed. Install Downex once, grab browser links automatically, pause and resume large files reliably, and keep 4 GB RAM laptops smooth.",
    keywords: [
      "simple download manager",
      "easy download manager Windows",
      "clean download manager",
      "lightweight download manager",
      "download manager free",
      "low RAM download manager",
    ],
    badge: "Simple Download Manager • Zero Clutter",
    summary:
      "Built for people who want a clean, fast Windows download manager without 1990s menus, adware installers, or bloated background services — automatically optimizing itself even on 4 GB RAM PCs.",
  },
  {
    slug: "/open-source-download-manager",
    navLabel: "Open Source Engine",
    shortTitle: "Open Source Rust + Tauri Architecture",
    title: "Free Open Source Download Manager Built with Rust & Tauri | Downex",
    description:
      "Explore Downex: a free open source multi-connection Windows download manager engineered with Rust Tokio workers, HTTP/1.1 range splitting, SQLite WAL persistence, and Minisign Ed25519 updates.",
    keywords: [
      "free open source download manager",
      "open source download manager",
      "open source Windows download manager",
      "Rust download manager",
      "Tauri download manager",
      "free download accelerator open source",
    ],
    badge: "Open Source Architecture • Rust + Tauri v2",
    summary:
      "Deep technical look inside Downex's open source Rust download engine, crash-safe unconfirmed staging, SQLite WAL state machine, and zero-telemetry design.",
  },
  {
    slug: "/browser-extension",
    navLabel: "Browser Extension",
    shortTitle: "Chrome, Edge & Brave Extension",
    title: "Auto-Catch Download Manager Extension for Chrome, Edge & Brave | Downex",
    description:
      "Automatically intercept large .zip, .mkv, .exe, and .iso links from Chrome, Edge, and Brave into Downex with 1-click speed, per-link token security, and zero adware popups.",
    keywords: [
      "Chrome download manager extension",
      "Edge download manager",
      "Brave download catcher",
      "auto grab links download manager",
      "browser integration download manager",
      "Manifest V3 download manager",
    ],
    badge: "Chromium Companion • Manifest V3",
    summary:
      "How the UI-less Manifest V3 Downex companion extension connects securely over authenticated localhost handshakes to send browser downloads straight to Downex.",
  },
  {
    slug: "/how-queues-work",
    navLabel: "1-by-1 Queue",
    shortTitle: "How 1-by-1 Sequential Queue Works",
    title: "How 1-by-1 Queue Works | Downex Download Manager",
    description:
      "Understand Downex sequential 1-by-1 Queue: dedicate 100% of your 32-stream bandwidth to one file at a time, prevent router congestion, and enable safe auto-shutdown.",
    keywords: [
      "sequential download queue",
      "1-by-1 download manager queue",
      "auto shutdown download manager",
      "Downex queue",
    ],
    badge: "Sequential Turbo Architecture • Zero Bandwidth Thrashing",
    summary:
      "Download batches sequentially at full line speed instead of splitting bandwidth across parallel files.",
  },
  {
    slug: "/faq",
    navLabel: "FAQ",
    shortTitle: "Frequently Asked Questions",
    title: "Downex Download Manager FAQ — Free, Safe, Fast & Open Source Answers",
    description:
      "Answers to common questions about Downex: free pricing vs IDM, 32-connection acceleration, Chromium browser catch, pause/resume safety, 4 GB RAM Eco mode, and SHA-256 verification.",
    keywords: [
      "Downex FAQ",
      "is Downex free",
      "is Downex safe",
      "download manager FAQ",
      "free download manager Windows 11",
    ],
    badge: "Complete Q&A • Downex Knowledge Base",
    summary:
      "Clear answers on pricing, security, speed optimization, browser catching, low-RAM support, and troubleshooting.",
  },
];

export interface ComparisonRow {
  feature: string;
  downex: string;
  idm: string;
  browser: string;
}

export const DOWNEX_COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Price & License",
    downex: "100% Free & Open Source (No trial expiry)",
    idm: "30-day trial, Paid license ($24.95+)",
    browser: "Free (built-in basic fetcher)",
  },
  {
    feature: "Multi-Connection Acceleration",
    downex: "Up to 32 parallel HTTP/1.1 sockets + work stealing",
    idm: "Up to 32 connections",
    browser: "Single stream per file",
  },
  {
    feature: "Browser Auto-Catch",
    downex: "Manifest V3 extension (Chrome, Edge, Brave)",
    idm: "Browser extension (MV3 / legacy modules)",
    browser: "Built-in only",
  },
  {
    feature: "Modern UI & Dark Mode",
    downex: "Clean React + Tailwind UI, instant Light/Dark switch",
    idm: "Classic Windows XP/Win32 toolbar UI",
    browser: "Small corner download shelf",
  },
  {
    feature: "1-by-1 Sequential Queue",
    downex: "Dedicated Queues workspace with FIFO lock & auto-handoff",
    idm: "Scheduler queue dialogs",
    browser: "Downloads everything concurrently (slower)",
  },
  {
    feature: "4 GB Low-RAM Auto Optimization",
    downex: "Automatic Eco UI, stream cap & process trim",
    idm: "Fixed Win32 footprint",
    browser: "High multi-tab Chromium overhead",
  },
  {
    feature: "Crash-Safe Partial Staging",
    downex: "Atomic unconfirmed staging + SQLite WAL resume state",
    idm: "Per-part temp chunks",
    browser: "Frequent broken resume on reset",
  },
  {
    feature: "Privacy & Ads",
    downex: "Zero telemetry, zero ads, zero account required",
    idm: "Offline registration checks / serial prompts",
    browser: "Depends on browser vendor",
  },
];

export interface DownexFaqItem {
  question: string;
  answer: string;
}

export const DOWNEX_FAQS: DownexFaqItem[] = [
  {
    question: "Is Downex a completely free download manager?",
    answer:
      "Yes. Downex is 100% free and open source for Windows 10 and Windows 11. Unlike paid tools with a 30-day countdown or registration nag popups, every feature — 32-connection acceleration, sequential queues, speed limiter, auto-shutdown, and browser integration — stays free forever.",
  },
  {
    question: "How does Downex compare to IDM (Internet Download Manager)?",
    answer:
      "Downex delivers the same core multi-connection HTTP/1.1 range splitting (up to 32 threads with tail-end work stealing), pause/resume support, browser link interception, and auto-shutdown on completion — packaged in a free open-source Rust + Tauri desktop app with a clean modern Light/Dark UI and automatic low-RAM optimization.",
  },
  {
    question: "Why is a dedicated download manager faster than Chrome or Edge?",
    answer:
      "Web browsers normally fetch a file over a single TCP stream, which bottlenecks on per-socket ISP shaping or server throttling. Downex splits range-capable downloads across up to 32 parallel HTTP/1.1 connections using dynamic segment work-stealing and positional disk writes, saturating your full internet line.",
  },
  {
    question: "Is Downex simple enough for non-technical users?",
    answer:
      "Yes. Install Downex once, load the companion browser extension or copy any download link, and click Start Download. Default settings already auto-tune segments, crash-safe resume recovery, folder memory, and speed limits without requiring manual configuration.",
  },
  {
    question: "Does Downex work smoothly on 4 GB RAM or older Windows laptops?",
    answer:
      "Yes. Downex detects 4 GB RAM machines and sustained CPU/memory spikes automatically behind the scenes — scaling down background UI animations, destroying idle dialog renderers on close, capping simultaneous connections sensibly, and dropping process priority to Below Normal so your browser and desktop stay responsive.",
  },
  {
    question: "Is Downex safe and private? Does it collect telemetry?",
    answer:
      "Downex contains zero analytics SDKs, zero ads, and zero telemetry. Download URLs, queue metadata, and history remain strictly on your local machine inside SQLite, updates are verified with AES-256-GCM + Ed25519 signatures, and you can verify the installer against its published SHA-256 checksum.",
  },
  {
    question: "Can I pause, restart PC, and resume large 10 GB+ files later?",
    answer:
      "When a server returns Accept-Ranges / Content-Range support (marked RESUME OK), Downex tracks completed byte ranges atomically in SQLite WAL storage and stages parts in an isolated unconfirmed file so interrupted downloads resume reliably across pauses or Windows restarts.",
  },
  {
    question: "Which browsers are supported by the Downex extension?",
    answer:
      "The lightweight Manifest V3 companion extension works on Google Chrome, Microsoft Edge, Brave, Vivaldi, Opera, and other Chromium-based Windows browsers via Developer Mode → Load unpacked.",
  },
  {
    question: "Is downex.apps.gauravpatil.site the official Simple Free Download Manager by Gaurav Patil?",
    answer:
      "Yes. downex.apps.gauravpatil.site is the official home and installer portal for Downex — the free, open-source Rust + Tauri 32-stream Windows download manager and IDM alternative created by Gaurav Patil (github.com/AspiringWebGaurav/downex), distinct from unrelated third-party video-downloader domains.",
  },
];

export const DOWNEX_SITEMAP_URLS: {
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly";
}[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/idm-alternative", priority: 0.95, changeFrequency: "weekly" },
  { path: "/simple-download-manager", priority: 0.95, changeFrequency: "weekly" },
  { path: "/open-source-download-manager", priority: 0.95, changeFrequency: "weekly" },
  { path: "/browser-extension", priority: 0.9, changeFrequency: "weekly" },
  { path: "/how-queues-work", priority: 0.9, changeFrequency: "weekly" },
  { path: "/faq", priority: 0.85, changeFrequency: "weekly" },
  { path: "/privacy", priority: 0.6, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.6, changeFrequency: "monthly" },
];

export function buildDownexWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${DOWNEX_ORIGIN}/#website`,
    url: DOWNEX_ORIGIN,
    name: "Downex — Simple Free Download Manager",
    alternateName: [
      "Downex",
      "Downex Download Manager",
      "Downex by Gaurav Patil",
    ],
    description:
      "Official home of Downex: simple, free & open-source 32-stream Windows download manager and IDM alternative by Gaurav Patil.",
    publisher: {
      "@type": "Person",
      name: "Gaurav Patil",
      url: DOWNEX_PORTFOLIO_URL,
    },
    inLanguage: "en-US",
  };
}

export function buildDownexSoftwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${DOWNEX_ORIGIN}/#software`,
    name: "Downex — Simple Free Download Manager",
    alternateName: [
      "Downex",
      "Downex Download Manager",
      "Downex Simple Free Download Manager",
      "Downex by Gaurav Patil",
    ],
    url: DOWNEX_ORIGIN,
    downloadUrl: DOWNEX_DESKTOP_DOWNLOAD_URL,
    installUrl: DOWNEX_ORIGIN,
    applicationCategory: "UtilitiesApplication",
    applicationSubCategory: "Download Manager & Accelerator",
    operatingSystem: "Windows 10, Windows 11 (64-bit)",
    softwareVersion: "0.0.8",
    releaseNotes: `${DOWNEX_ORIGIN}/#architecture`,
    screenshot: `${DOWNEX_ORIGIN}/docs/downex/queue-light.png`,
    image: DOWNEX_OG_IMAGE_URL,
    description:
      "Free, open-source multi-connection download manager and IDM alternative for Windows 10 and Windows 11. Features up to 32 parallel HTTP/1.1 streams, sequential 1-by-1 queues, Chromium browser link catch, and automatic 4 GB low-RAM optimization.",
    isAccessibleForFree: true,
    license: DOWNEX_GITHUB_URL,
    codeRepository: DOWNEX_GITHUB_URL,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Up to 32 parallel HTTP/1.1 connections with dynamic work stealing",
      "Free and open-source Windows 10 and 11 native Rust and Tauri desktop app",
      "Manifest V3 companion extension for Chrome, Edge, and Brave",
      "Sequential 1-by-1 download queue with automatic task handoff",
      "Crash-safe pause and resume via SQLite WAL and unconfirmed staging",
      "Automatic Low-RAM 4 GB and Heavy-Load Eco mode optimization",
      "Custom speed limiter and verified zero-corruption auto-shutdown",
      "Zero telemetry, zero ads, and Ed25519 signed OTA updates",
    ],
    author: {
      "@type": "Person",
      name: "Gaurav Patil",
      url: DOWNEX_PORTFOLIO_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Gaurav Patil",
      url: DOWNEX_PORTFOLIO_URL,
    },
  };
}

export function buildDownexFaqJsonLd(faqs: DownexFaqItem[] = DOWNEX_FAQS) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildDownexBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
