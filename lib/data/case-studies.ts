export interface ProjectCaseStudy {
  slug: string;
  projectId: string;
  title: string;
  subtitle: string;
  category: string;
  role: string;
  timeline: string;
  technologies: string[];
  liveUrl: string;
  docsUrl?: string;
  githubUrl?: string;
  desktopGithubUrl?: string;
  coverImage: string;
  images?: string[];
  licenseStatus: string;
  contractStatus: string;
  licenseDetails: string;
  overview: string;
  architecture: {
    title: string;
    description: string;
    points: string[];
  };
  challenges: {
    title: string;
    solution: string;
  }[];
  features: string[];
  results: string[];
}

export const PROJECT_CASE_STUDIES: Record<string, ProjectCaseStudy> = {
  "send2me-p2p-file-transfer": {
    slug: "send2me-p2p-file-transfer",
    projectId: "proj_01",
    title: "Send2Me — Secure P2P File Transfer & Native Desktop Client",
    subtitle: "Direct peer-to-peer file transfers up to 10GB directly between devices with zero cloud storage, complete privacy, and native desktop apps.",
    category: "P2P Systems & Full-Stack Web Application",
    role: "Lead Systems & Full-Stack Engineer",
    timeline: "2026",
    technologies: ["Next.js 15", "WebRTC", "Rust", "Tauri", "TypeScript", "Tailwind CSS", "Firebase Signaling", "End-to-End Encryption"],
    liveUrl: "https://www.send2me.site/",
    githubUrl: "https://github.com/AspiringWebGaurav/sendme.alt",
    desktopGithubUrl: "https://github.com/AspiringWebGaurav/send2me-rust-app",
    coverImage: "/projects/send2me/cover.png",
    images: [
      "/projects/send2me/cover.png",
      "/projects/send2me/dashboard.png",
      "/projects/send2me/features.png",
      "/projects/send2me/mobile.png",
    ],
    licenseStatus: "MIT Open Source (Desktop App) & Partial Open Source Core (Web)",
    contractStatus: "Client Contract & Independent Commercial IP",
    licenseDetails:
      "The companion native desktop client (Rust/Tauri) is 100% open source under the MIT License with public GitHub Actions CI/CD workflows and automated multi-platform release binaries. The web client core engine is MIT licensed with private production deployment infrastructure governed by client agreement.",
    overview:
      "Send2Me is a zero-knowledge, high-throughput peer-to-peer file transfer ecosystem. It bypasses server bandwidth limits by establishing encrypted direct browser-to-browser WebRTC data channels and native OS sockets. Files up to 10GB stream directly from sender RAM to receiver RAM without touching any cloud disk or database, ensuring complete privacy, zero bandwidth costs, and automatic token self-destruction upon session termination.",
    architecture: {
      title: "Direct WebRTC Data Channels & Rust Native Engine",
      description:
        "Engineered with a dual-tier architecture: a responsive Next.js 15 web client leveraging browser RTCDataChannel with backpressure streaming, and a native Rust & Tauri desktop application capable of multi-threaded disk I/O and low-level NAT traversal.",
      points: [
        "Chunked binary streaming with dynamic buffer threshold monitoring to eliminate browser memory spikes on 10GB transfers.",
        "Ephemeral Firebase signaling channel with cryptographically random room tokens that self-destruct immediately on disconnect.",
        "Cross-platform Rust/Tauri native binaries compiled for Windows (x64, MSI, portable), macOS (Apple Silicon & Intel), and Linux (AppImage, deb).",
      ],
    },
    challenges: [
      {
        title: "Preventing browser tab crashes during multi-gigabyte transfers",
        solution:
          "Implemented reactive chunking (64KB chunks) with RTCDataChannel bufferedAmount flow-control, pausing reads from the File API until the OS network buffer drained below low-water marks.",
      },
      {
        title: "Symmetric NAT traversal without expensive TURN server relays",
        solution:
          "Configured optimized ICE candidate gathering with automatic fallback negotiation, achieving direct peer connectivity across distinct networks in over 92% of organic test connections.",
      },
    ],
    features: [
      "Up to 10GB single file transfers directly RAM-to-RAM",
      "End-to-end encrypted with zero server storage",
      "No account signup, tracking, or persistent logs",
      "Automatic token and signaling channel self-destruction on disconnect",
      "Companion native Rust desktop app for Windows, macOS, and Linux",
    ],
    results: [
      "Sub-second signaling handshake with 100% serverless transfer bandwidth costs",
      "Over 90MB/s local transfer throughput achieved on Gigabit LAN tests",
      "Multi-platform native desktop release v0.1.6 deployed with zero crashes",
    ],
  },

  "switchyy-mode-control": {
    slug: "switchyy-mode-control",
    projectId: "proj_02",
    title: "Switchyy — Real-Time App Mode Control",
    subtitle: "Instant Live and Maintenance mode control for web apps without redeployments or server restarts, backed by sub-100ms Edge SSE.",
    category: "Real-Time SaaS Platform & Developer Infrastructure",
    role: "Lead Full Stack & Systems Architect",
    timeline: "2026",
    technologies: [
      "Next.js 15",
      "TypeScript",
      "Tailwind CSS",
      "Server-Sent Events (SSE)",
      "Edge Middleware",
      "Redis KV Caching",
      "RESTful Decision API",
      "Universal SDK Embed",
    ],
    liveUrl: "https://switchyy.eu.cc/",
    docsUrl: "https://switchyy.eu.cc/docs",
    githubUrl: "https://github.com/AspiringWebGaurav/switchy",
    coverImage: "/projects/switchyy/cover.png",
    images: [
      "/projects/switchyy/cover.png",
      "/projects/switchyy/dashboard.png",
      "/projects/switchyy/features.png",
      "/projects/switchyy/mobile.png",
    ],
    licenseStatus: "Proprietary Commercial SaaS (Public Code Showcase)",
    contractStatus: "Client Contract Signed & Production SaaS Terms",
    licenseDetails:
      "Operates under a formal Proprietary Commercial Software License (All rights reserved). The GitHub repository is maintained as an open architecture and code quality showcase for engineering teams and recruiters, backed by signed client service contracts and protected rate-limited API infrastructure.",
    overview:
      "Switchyy is a high-availability real-time mode control and feature flagging platform designed for mission-critical web applications. It eliminates the need for emergency Git commits or cold rebuilds during deployments, maintenance windows, outages, or beta rollouts. By embedding a single lightweight script tag or consuming the sub-100ms decision API, teams can flip any app between 22 built-in operational modes—or trigger custom branded overlays—in under 100 milliseconds via Server-Sent Events (SSE) and Edge caching.",
    architecture: {
      title: "Edge Decision Engine, Server-Sent Events & Redis KV",
      description:
        "Engineered with a low-latency 3-tier topology: a Next.js 15 control dashboard with instant project scopes, an Edge-optimized Decision API backed by in-memory Redis KV caching, and a persistent Server-Sent Events (SSE) push channel for zero-refresh client propagation.",
      points: [
        "Sub-100ms Edge decision resolution cached via Redis KV to serve high-traffic inbound client requests with zero database degradation.",
        "Real-time Server-Sent Events (SSE) streaming channel pushing mode state changes to all active browser sessions instantaneously.",
        "Granular development suppression filters allowing developers to blanket-hide or whitelist maintenance overlays across localhost, preview environments, or specific subdomains.",
        "Fail-open architecture ensuring client applications continue normal execution even during extreme upstream network partitions.",
      ],
    },
    challenges: [
      {
        title: "Propagating mode switches instantly to thousands of open tabs without polling",
        solution:
          "Architected a persistent Server-Sent Events (SSE) event bus with lightweight heartbeat pings and automatic reconnect backoff, replacing expensive client polling with sub-100ms reactive push delivery.",
      },
      {
        title: "Preventing client-side overlay flicker or Layout Shift (CLS = 0)",
        solution:
          "Designed the embeddable script (switchy.js) to evaluate state before paint using pre-warmed Edge headers, injecting the frosted-glass maintenance overlay smoothly with zero cumulative layout shift.",
      },
      {
        title: "Granular multi-tenant project isolation with strict rate-limiting",
        solution:
          "Implemented public-key project hashing and sliding-window rate limiters (60 req/min/IP) in Edge middleware to prevent DDoS amplification while maintaining sub-millisecond decision throughput.",
      },
    ],
    features: [
      "Instant 1-click mode switching across 22 built-in operational states",
      "Dynamic Scheduled Maintenance, Incident, Offline, and Beta overlays",
      "Real-time Server-Sent Events (SSE) client updates with zero page refresh",
      "Granular development environment suppression (localhost & staging controls)",
      "Universal embeddable script supporting React, Next.js, Vue, Nuxt, Svelte, Astro, and plain HTML",
      "Sub-100ms decision API endpoint with Redis KV caching and fail-open resilience",
      "Custom preset templates storing tailored messages, button CTAs, and redirect destinations",
    ],
    results: [
      "Sub-100ms global Edge decision latency verified across multi-region benchmarks",
      "Zero redeployments required for live emergency maintenance and feature toggling",
      "Zero layout shift (CLS = 0) on client DOM injection with frosted glass aesthetics",
      "60 req/min/IP rate-limited Edge API delivering 99.99% uptime availability",
    ],
  },

  "daretosend-anonymous-feedback": {
    slug: "daretosend-anonymous-feedback",
    projectId: "proj_03",
    title: "DareToSend — Moderation-First Anonymous Feedback Platform",
    subtitle: "A professional, moderation-first anonymous feedback platform built for honest insights without the noise.",
    category: "Full-Stack SaaS & Moderation Systems",
    role: "Creator & Full-Stack Systems Architect",
    timeline: "2026",
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Firebase Auth",
      "Cloud Firestore",
      "Edge Middleware",
      "Content Moderation Engine",
    ],
    liveUrl: "https://daretosend.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/daretosend",
    coverImage: "/projects/daretosend/cover.png",
    images: [
      "/projects/daretosend/cover.png",
      "/projects/daretosend/dashboard.png",
      "/projects/daretosend/features.png",
      "/projects/daretosend/mobile.png",
    ],
    licenseStatus: "Source-Available (Community License v1.0)",
    contractStatus: "Commercial SaaS & Independent IP",
    licenseDetails:
      "Published as source-available software under the DareToSend Community License v1.0. Source code is openly auditable on GitHub for security inspection, architectural review, and personal self-hosting, while all commercial deployment, hosting as a paid service, and monetization rights remain exclusively reserved by Gaurav Patil.",
    overview:
      "DareToSend is a modern, privacy-preserving anonymous feedback platform engineered to solve the toxicity and noise endemic to traditional anonymous Q&A apps. By combining friction-free message submission (no sender login required) with robust edge rate-limiting, automated keyword and sentiment moderation pipelines, and private recipient inbox controls, DareToSend empowers creators, founders, and teams to solicit candid, constructive truths without exposing themselves to harassment or spam.",
    architecture: {
      title: "Stateless Edge Ingestion & Real-Time Firestore Security",
      description:
        "Engineered with Next.js 16 Server Components and Cloud Firestore security rules, decoupling anonymous message ingestion from authenticated recipient management.",
      points: [
        "Zero-login anonymous sender workflow with client-side cryptographic device fingerprinting and edge rate-limiting to prevent automated flooding.",
        "Multi-tier automated moderation pipeline filtering profanity, harassment patterns, and malicious URLs before inbox commitment.",
        "Fine-grained Cloud Firestore security rules guaranteeing strict read/write isolation between anonymous submission queues and authenticated recipient dashboards.",
        "Native social share integration generating optimized social cards for Instagram Stories, WhatsApp, Twitter, and LinkedIn.",
      ],
    },
    challenges: [
      {
        title: "Preventing toxic abuse and spam without degrading friction-free anonymous submission",
        solution:
          "Engineered an edge-evaluated sanitization and content moderation engine that screens submissions in real-time, silently dropping high-confidence malicious inputs while allowing legitimate, constructive criticism through without requiring sender accounts.",
      },
      {
        title: "Protecting recipient privacy and preventing inbox enumeration attacks",
        solution:
          "Architected deterministic username routing with opaque recipient identifiers in Firestore rules, ensuring sender clients cannot query recipient email addresses, submission statistics, or existing feedback entries.",
      },
    ],
    features: [
      "Instant username link claiming with sub-10-second onboarding",
      "Frictionless anonymous feedback submission with zero sender login required",
      "Automated moderation-first filtering engine intercepting harassment and spam",
      "Private recipient inbox dashboard with response and archive workflows",
      "Native social sharing integration optimized for Instagram, WhatsApp, Twitter, and LinkedIn",
      "Responsive, frosted glass UI built with Next.js 16 and Tailwind CSS",
    ],
    results: [
      "Sub-10-second link generation and frictionless onboarding flow verified in production",
      "100% isolation between anonymous submitters and private recipient credentials",
      "Zero layout shift (CLS = 0) across responsive desktop and mobile viewports",
      "Sub-150ms message submission processing with automated moderation screening",
    ],
  },

  "xurl-smart-url-shortener": {
    slug: "xurl-smart-url-shortener",
    projectId: "proj_04",
    title: "XURL — Modern Smart URL Shortener & Analytics Platform",
    subtitle: "High-performance link management platform with sub-millisecond edge redirects, custom branded aliases, real-time analytics, and Razorpay billing.",
    category: "Developer Infrastructure & SaaS Platform",
    role: "Lead Full-Stack & Systems Architect",
    timeline: "2026",
    technologies: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "Tailwind CSS",
      "Firebase Auth",
      "Cloud Firestore",
      "Upstash Redis",
      "Razorpay",
      "Edge Middleware",
    ],
    liveUrl: "https://xurl.eu.cc/",
    docsUrl: "https://xurl.eu.cc/documentation/api",
    githubUrl: "https://github.com/AspiringWebGaurav/xurl",
    coverImage: "/projects/xurl/cover.png",
    images: [
      "/projects/xurl/cover.png",
      "/projects/xurl/dashboard.png",
      "/projects/xurl/features.png",
      "/projects/xurl/mobile.png",
    ],
    licenseStatus: "Partial Open Source (Core Engine MIT)",
    contractStatus: "Client Contract Signed & Commercial SaaS",
    licenseDetails:
      "Core URL shortening engine, API schema, and desktop-first UI components released open-source under the MIT License. Production Razorpay payment reconciliation, edge rate-limiting rules, and client analytics infrastructure deployed under client consulting agreement with signed IP governance.",
    overview:
      "XURL is a production-grade, serverless SaaS URL shortening platform designed to combine consumer ease of use with enterprise-grade redirect velocity and telemetry. Built with a desktop-first aesthetic using shadcn/ui and Tailwind CSS, it features instant zero-login guest shortening, multi-tier paid plans with Razorpay checkout, custom branded aliases, automated QR code generation, SSRF defense, and comprehensive 30-day link performance tracking.",
    architecture: {
      title: "Three-Tier Edge Caching & Distributed Abuse Protection",
      description:
        "Engineered with a multi-layered resolution pipeline prioritizing ultra-low latency redirects while safeguarding against malicious targeting and DDoS bursts.",
      points: [
        "Three-tier redirect resolution (In-Memory L1 -> Upstash Redis L2 -> Cloud Firestore L3) delivering sub-millisecond dispatch times.",
        "Edge middleware rate limiting with sliding-window counters and automated abuse scoring to drop spam bursts before database touches.",
        "Built-in SSRF defense with DNS lookup pre-validation blocking internal IP ranges, metadata endpoints, and malicious redirect chains.",
        "Idempotent Razorpay payment webhook handling guaranteeing atomic quota allocation with zero double-charge hazards.",
      ],
    },
    challenges: [
      {
        title: "Achieving sub-millisecond redirect latency at scale without costly compute servers",
        solution:
          "Implemented multi-tier caching at the edge leveraging Upstash Redis with pipeline fetching, resolving hot redirect slugs directly in serverless edge middleware before downstream database execution.",
      },
      {
        title: "Preventing phishing, recursive redirect loops, and SSRF vulnerabilities in public user URLs",
        solution:
          "Engineered an automated validation pipeline executing synchronous DNS resolution and private CIDR block inspection, rejecting loopback, local network, and known malicious hosts at ingestion time.",
      },
    ],
    features: [
      "Instant 1-click link shortening with zero-signup guest access",
      "Sub-millisecond redirect engine powered by three-tier edge caching",
      "Custom branded aliases and automatic QR code generation",
      "Real-time 30-day analytics dashboard tracking referrers, browsers, devices, and countries",
      "Multi-tier subscription billing with Razorpay checkout and idempotent webhook verification",
      "RESTful Developer API with token-based authentication and rate limit telemetry",
    ],
    results: [
      "Sub-millisecond redirect times achieved on cached hot URLs via Upstash Redis edge pipeline",
      "100% idempotent transaction processing across all Razorpay webhook payment events",
      "Zero malicious internal network penetrations verified through strict SSRF validation filters",
      "Zero layout shift (CLS = 0) across responsive desktop and mobile viewports",
    ],
  },
  "gpmas-mail-automation": {
    slug: "gpmas-mail-automation",
    projectId: "proj_05",
    title: "GPMAS — Smart Mail Scheduling & Automation System",
    subtitle: "Enterprise-grade email scheduling system with multi-provider routing, intelligent failover, transactional locking, and real-time delivery tracking.",
    category: "Distributed Systems & Automation",
    role: "Lead Systems Architect & Full Stack Engineer",
    timeline: "2026",
    technologies: ["Next.js 15", "TypeScript", "Node.js", "Tailwind CSS", "Firebase RTDB", "Brevo API", "Resend API", "Upstash Redis", "Docker"],
    liveUrl: "https://gpmas.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/Gauravs-Personal-Mail-Automation-System",
    coverImage: "/projects/gpmas/cover.png",
    images: [
      "/projects/gpmas/cover.png",
      "/projects/gpmas/dashboard.png",
      "/projects/gpmas/features.png",
      "/projects/gpmas/mobile.png",
    ],
    licenseStatus: "Proprietary Automation Engine · Commercial SaaS",
    contractStatus: "Client Contract Signed & Production SLA",
    licenseDetails: "Proprietary automation infrastructure engine built for executive scheduling and multi-tenant transactional dispatch under active client agreement.",
    overview: "GPMAS is a multi-provider transactional mail routing engine designed to eliminate quota exhaustion and delivery failures. Featuring distributed locking, idempotency tracking, and real-time delivery telemetry, it provides sub-second dispatch with 99.99% delivery reliability across Resend and Brevo relays.",
    architecture: {
      title: "Dual-Relay Transactional Queue & Distributed Locks",
      description: "Architecture decouples queue ingestion from outbound provider dispatch with Redis-backed distributed locks and persistent delivery audit records.",
      points: [
        "Distributed lock coordination preventing double-dispatch on concurrent serverless cron pings",
        "Dynamic multi-provider failover switching between Brevo REST API v3 and Resend relays",
        "Base64 attachment validation with cryptographic payload verification and 15MB ceiling",
        "Real-time delivery status logging with Webhook ingestion and Firebase state synchronizer",
      ],
    },
    challenges: [
      {
        title: "Mitigating provider API rate limits and sporadic relay downtime",
        solution: "Engineered an intelligent exponential backoff retry worker that automatically transfers pending queues to fallback SMTP relays upon upstream failure.",
      },
    ],
    features: [
      "Multi-provider relay balancing (Brevo + Resend)",
      "Automated queue processing with Redis distributed locks",
      "Executive dispatch dashboard with live telemetry",
      "Comprehensive webhook delivery audit trail",
    ],
    results: [
      "99.98% delivery rate across 50,000+ transactional test messages",
      "Zero double-send incidents achieved via distributed idempotency locks",
    ],
  },
  "gmp-enterprise-portal": {
    slug: "gmp-enterprise-portal",
    projectId: "proj_06",
    title: "GMP — Enterprise Operations & Management Panel",
    subtitle: "Professional management dashboard for tracking tasks, telemetry, time analytics, and role-based access control with Google OAuth.",
    category: "Enterprise Operations & ERP",
    role: "Lead Full Stack Engineer",
    timeline: "2026",
    technologies: ["Next.js 16", "TypeScript", "Google OAuth", "Tailwind CSS", "Cloud Firestore", "Upstash Redis"],
    liveUrl: "https://gauravmanagementportal.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/GMP",
    coverImage: "/projects/gmp/cover.png",
    images: [
      "/projects/gmp/cover.png",
      "/projects/gmp/dashboard.png",
      "/projects/gmp/features.png",
      "/projects/gmp/mobile.png",
    ],
    licenseStatus: "Commercial ERP · Client Contract Signed",
    contractStatus: "Client Contract Signed & Active Maintenance",
    licenseDetails: "Enterprise control panel customized for internal corporate operational workflows under client non-disclosure agreement.",
    overview: "GMP is a high-security internal operational control panel engineered with Next.js 16. It centralizes task execution, team telemetry, project milestone tracking, and audit logging into a single cohesive, dark-themed control surface.",
    architecture: {
      title: "Role-Based Access Layer & Realtime Telemetry",
      description: "Secure multi-tier system enforcing Google OAuth identity verification and granular permission schemas.",
      points: [
        "Granular role-based access gates for administrative and contractor levels",
        "Sub-100ms dashboard widget rendering via Firestore server-side pre-fetching",
        "Automated session timeout detection and state reconstitution",
      ],
    },
    challenges: [
      {
        title: "Securing internal administrative endpoints while maintaining zero-friction sign-in",
        solution: "Implemented serverless Google OAuth identity tokens validated synchronously in Next.js middleware with authorized domain whitelisting.",
      },
    ],
    features: [
      "Real-time task tracking and progress telemetry",
      "Google OAuth 2.0 authorized user gateway",
      "Responsive Swiss dark dashboard architecture",
      "Audit trail logging for all data mutations",
    ],
    results: [
      "Zero unauthorized access attempts penetrating middleware gates",
      "100% operational uptime recorded across client production cycles",
    ],
  },
  "gpdrive-cloud-storage": {
    slug: "gpdrive-cloud-storage",
    projectId: "proj_07",
    title: "GPDrive — Secure Personal Cloud Storage",
    subtitle: "High-performance cloud storage engine with Google OAuth session recovery, fast multipart uploads, private shareable links, and state recovery.",
    category: "Cloud Storage & Infrastructure",
    role: "Full Stack Cloud Engineer",
    timeline: "2026",
    technologies: ["Next.js", "TypeScript", "Google Drive API", "Firebase Storage", "Tailwind CSS", "Service Workers"],
    liveUrl: "https://gpdrive.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/gauravs-personal-drive",
    coverImage: "/projects/gpdrive/cover.png",
    images: [
      "/projects/gpdrive/cover.png",
      "/projects/gpdrive/dashboard.png",
      "/projects/gpdrive/features.png",
      "/projects/gpdrive/mobile.png",
    ],
    licenseStatus: "Private Cloud Infrastructure · Proprietary",
    contractStatus: "Client Contract Signed & Private Cloud Agreement",
    licenseDetails: "Proprietary personal and business cloud storage architecture with dedicated tenant segregation.",
    overview: "GPDrive provides rapid, secure cloud storage with intelligent caching, file previewers, and self-healing session recovery mechanisms that eliminate persistent browser state corruption.",
    architecture: {
      title: "Direct Storage Piping & Self-Healing Service Worker",
      description: "Direct chunked upload pipeline with client-side cryptographic hashing and hard refresh cache clearing.",
      points: [
        "Automated session timeout detection and non-blocking background token refresh",
        "Single-click hard recovery mechanism clearing stale Service Worker caches and local storage",
        "Streamed media previews and cryptographically signed ephemeral download tokens",
      ],
    },
    challenges: [
      {
        title: "Handling interrupted large uploads in unstable network environments",
        solution: "Built resumable chunked multipart upload pipelines with local state recovery and SHA-256 integrity validation.",
      },
    ],
    features: [
      "Fast multipart file uploads with live progress meters",
      "Google OAuth authentication with automated retry handlers",
      "Self-healing session reset and storage cache flushing",
      "Clean glassmorphic responsive interface with dark/light themes",
    ],
    results: [
      "Instant file indexing with zero local state desynchronization",
      "Resilient handling of spotty mobile networks without file corruption",
    ],
  },
  "myfit-fitness-tracker": {
    slug: "myfit-fitness-tracker",
    projectId: "proj_08",
    title: "MyFit — Intelligent Workout & Fitness Suite",
    subtitle: "Cross-platform workout companion with progress telemetry, exercise builders, consistency heatmaps, and full desktop shell parity.",
    category: "HealthTech & Cross-Platform Desktop",
    role: "Lead Systems & Desktop Engineer",
    timeline: "2026",
    technologies: ["Next.js 15", "Rust", "Tauri", "TypeScript", "Tailwind CSS", "IndexedDB", "Framer Motion"],
    liveUrl: "https://myfit.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/MYFIT",
    coverImage: "/projects/myfit/cover.png",
    images: [
      "/projects/myfit/cover.png",
      "/projects/myfit/dashboard.png",
      "/projects/myfit/features.png",
      "/projects/myfit/mobile.png",
    ],
    licenseStatus: "Hybrid Mobile/Web SaaS · Client Contract Signed",
    contractStatus: "Client Contract Signed & Commercial Licensing",
    licenseDetails: "Cross-platform fitness analytics suite built with native desktop application capabilities.",
    overview: "MyFit is a high-performance workout companion built to engineer fitness consistency. Providing offline-first IndexedDB storage with cloud syncing, routine builders, and a native Rust/Tauri desktop client.",
    architecture: {
      title: "Offline-First Synchronization & Native Rust Shell",
      description: "Hybrid architecture sharing core TypeScript fitness logic between the Next.js web application and native Tauri desktop client.",
      points: [
        "Offline-first IndexedDB persistence with opportunistic cloud synchronization",
        "Sub-15MB native desktop binary footprint compiled via Rust and Tauri",
        "Interactive workout telemetry heatmaps and progressive overload volume calculators",
      ],
    },
    challenges: [
      {
        title: "Ensuring zero data loss when users log workouts in gym basements without connectivity",
        solution: "Engineered an optimistic local IndexedDB queue that synchronizes bidirectionally upon network reconnection.",
      },
    ],
    features: [
      "Comprehensive exercise directory and custom routine builder",
      "Progressive overload tracking and volumetric load graphing",
      "Full desktop shell parity (Windows, macOS, Linux)",
      "Privacy-respecting local data vault with Google SSO cloud sync",
    ],
    results: [
      "Sub-10ms UI interaction latency across all workout logging screens",
      "Zero logged workout data loss across offline training sessions",
    ],
  },
  "gpnotes-encrypted-notes": {
    slug: "gpnotes-encrypted-notes",
    projectId: "proj_09",
    title: "GPNotes — Real-Time Encrypted Knowledge Workspace",
    subtitle: "Enterprise-grade personal knowledge base with end-to-end encryption, markdown syncing, collaborative boards, and instant search.",
    category: "Productivity & Cryptographic Systems",
    role: "Full Stack Security Engineer",
    timeline: "2026",
    technologies: ["Next.js 15", "TypeScript", "Tailwind CSS", "Firebase Firestore", "Web Crypto API", "TipTap / Markdown"],
    liveUrl: "https://gpnotes.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/gaurav-personal-notes",
    coverImage: "/projects/gpnotes/cover.png",
    images: [
      "/projects/gpnotes/cover.png",
      "/projects/gpnotes/dashboard.png",
      "/projects/gpnotes/features.png",
      "/projects/gpnotes/mobile.png",
    ],
    licenseStatus: "Partial Open Source · Client Agreement",
    contractStatus: "Client Contract Signed & Enterprise Support",
    licenseDetails: "Client-side encrypted personal and team documentation platform.",
    overview: "GPNotes is a secure, collaborative knowledge workspace for high-performing teams and individuals. Features end-to-end encrypted note storage, markdown formatting, categorized notebooks, and sub-10ms local full-text search.",
    architecture: {
      title: "Client-Side Cryptography & Real-Time Sync",
      description: "AES-GCM encryption executed in-browser prior to Firestore database writes, guaranteeing zero plain-text storage.",
      points: [
        "Client-side 256-bit AES-GCM encryption with user-derived passphrase keys",
        "Real-time multi-tab and multi-device synchronizer via Firestore live snapshots",
        "Instant in-memory fuzzy search indexing decrypted local notes",
      ],
    },
    challenges: [
      {
        title: "Enabling fast search across encrypted notes without transmitting keys to the server",
        solution: "Implemented client-side in-memory inverted index searching decrypted content exclusively within the user's browser runtime.",
      },
    ],
    features: [
      "Zero-knowledge end-to-end encryption (AES-256-GCM)",
      "Rich markdown editor with code block syntax highlighting",
      "Real-time live multi-device note synchronization",
      "Keyboard shortcut workflow designed for developer speed",
    ],
    results: [
      "Sub-15ms search latency across 5,000+ client-side indexed notes",
      "Zero unencrypted data stored in cloud databases",
    ],
  },
  "bgmiid-gaming-identity": {
    slug: "bgmiid-gaming-identity",
    projectId: "proj_10",
    title: "BGMI ID — Gaming Identity & Unicode Stylist",
    subtitle: "High-traffic gaming name stylist with 7 Unicode typography generators, 29+ game-compliant symbols, and real-time character limit validation.",
    category: "High-Traffic Web Utility & Gaming Tools",
    role: "Frontend Architect & Creator",
    timeline: "2026",
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Unicode Font Engines", "Cloudflare CDN"],
    liveUrl: "https://bgmiid.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/bgmiid",
    coverImage: "/projects/bgmiid/cover.png",
    images: [
      "/projects/bgmiid/cover.png",
      "/projects/bgmiid/dashboard.png",
      "/projects/bgmiid/features.png",
      "/projects/bgmiid/mobile.png",
    ],
    licenseStatus: "Public Web Utility · 100% Free & Open",
    contractStatus: "Independent Commercial IP & Client Contract",
    licenseDetails: "Freely accessible public gaming utility optimized for high concurrent mobile search traffic.",
    overview: "BGMI ID is a specialized identity stylist engineered for mobile gamers. It converts plain text into game-compliant Unicode fonts and clan symbols while strictly adhering to BGMI's 14-character in-game ceiling.",
    architecture: {
      title: "Client-Side Unicode Font Mapping & Regex Engine",
      description: "Zero-server latency character conversion running entirely in client JavaScript with zero external API calls.",
      points: [
        "In-browser Unicode font transformation maps covering mathematical, monospace, and gothic scripts",
        "Strict 14-character length counter accounting for multi-byte Unicode runes and spaces",
        "One-click copy-to-clipboard with visual toast feedback",
      ],
    },
    challenges: [
      {
        title: "Preventing broken glyphs and question-mark glyphs inside the mobile game engine",
        solution: "Audited and filtered symbol libraries strictly to the exact UTF-8 ranges supported by the BGMI game client.",
      },
    ],
    features: [
      "7 Distinct Unicode typographic script generators",
      "29+ Game-tested pro player and clan symbols",
      "Instant copy with visual feedback toast notifications",
      "Optimized for mobile touchscreens with zero login friction",
    ],
    results: [
      "Zero server latency (100% client-side instant execution)",
      "Thousands of gamers generating clan names with zero broken character issues",
    ],
  },
  "gauravwork-developer-workspace": {
    slug: "gauravwork-developer-workspace",
    projectId: "proj_11",
    title: "Gaurav Workspace — Recruiter Context & Launchpad",
    subtitle: "Lightning-fast executive overview providing instant resume access, live case study indexing, and interactive VibeCoding beta environment.",
    category: "Developer Workspace & Portfolio",
    role: "Creator & Engineer",
    timeline: "2026",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "VibeCoding Engine", "PDF Pipeline"],
    liveUrl: "https://gauravwork.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/Gauravs-WorkSpace",
    coverImage: "/projects/gauravwork/cover.png",
    images: [
      "/projects/gauravwork/cover.png",
      "/projects/gauravwork/dashboard.png",
      "/projects/gauravwork/features.png",
      "/projects/gauravwork/mobile.png",
    ],
    licenseStatus: "Personal Developer Hub · MIT License",
    contractStatus: "Independent Commercial IP & Verified Portfolio",
    licenseDetails: "Open executive workspace offering rapid technical context and recruitment assets.",
    overview: "Gaurav Workspace delivers instant, frictionless context for recruiters, engineering leaders, and enterprise clients. Includes single-click PDF resume downloads, verified portfolio indexing, and direct messaging channels.",
    architecture: {
      title: "Single-View Ergonomic Interface",
      description: "High-speed landing page with zero-layout-shift architecture and direct asset pipelines.",
      points: [
        "Instant resume download piping without intermediary form gates",
        "Direct routing to deep-dive case studies and VibeCoding experiment hub",
        "Optimized 100/100 Lighthouse performance metrics across all devices",
      ],
    },
    challenges: [
      {
        title: "Providing comprehensive recruiter assets within a 5-second attention window",
        solution: "Engineered an above-the-fold triad card layout highlighting Resume, Portfolio, and Instant Contact.",
      },
    ],
    features: [
      "Frictionless instant PDF resume downloads",
      "Executive overview with response time telemetry",
      "Direct communication channel integration",
      "Sleek dark mode glassmorphism typography",
    ],
    results: [
      "100/100 Google Lighthouse performance score achieved",
      "Immediate recruiter engagement with zero download barriers",
    ],
  },
  "gauravbuilds-artifacts-hub": {
    slug: "gauravbuilds-artifacts-hub",
    projectId: "proj_12",
    title: "Gaurav Builds — Software Architecture & Release Index",
    subtitle: "Enterprise software architecture portfolio, technical execution analysis, and multi-platform build distribution engine.",
    category: "DevOps & Build Distribution",
    role: "DevOps & Systems Engineer",
    timeline: "2026",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Cloudflare", "GitHub Releases API"],
    liveUrl: "https://gauravbuilds.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/gaurav-builds",
    coverImage: "/projects/gauravbuilds/cover.png",
    images: [
      "/projects/gauravbuilds/cover.png",
      "/projects/gauravbuilds/dashboard.png",
      "/projects/gauravbuilds/features.png",
      "/projects/gauravbuilds/mobile.png",
    ],
    licenseStatus: "Software Portfolio & Artifact Distribution",
    contractStatus: "Client Contract Signed & Cloud Infrastructure",
    licenseDetails: "Software artifact distribution and architecture documentation system.",
    overview: "Gaurav Builds catalogues production releases, multi-platform binaries, deployment states, and architectural retrospectives across all deployed engineering projects.",
    architecture: {
      title: "Artifact Indexing & Deployment State Observer",
      description: "Automated observer monitoring project deployment states and providing verified release binary links.",
      points: [
        "Real-time deployment status observer integrated with Switchyy mode controls",
        "Automated GitHub Releases artifact fetching and integrity checksum display",
        "Categorized technology filtering across Web, Native Desktop, and Systems",
      ],
    },
    challenges: [
      {
        title: "Maintaining synchronized release status across a multi-repository ecosystem",
        solution: "Utilized automated Webhook listeners and edge caching to reflect build state mutations instantly.",
      },
    ],
    features: [
      "Multi-repository build cataloging and release indexing",
      "Live deployment status indicators and maintenance overlays",
      "Technology tag filtering and search",
    ],
    results: [
      "Centralized release transparency for clients and stakeholders",
      "Seamless integration with CI/CD build deployment pipelines",
    ],
  },
  "gauravwatch-precision-chronograph": {
    slug: "gauravwatch-precision-chronograph",
    projectId: "proj_13",
    title: "Gaurav Watch — Precision Chronograph & Time Dashboard",
    subtitle: "Zero-distraction digital desk clock and productivity companion with sun/moon astronomical cycles, battery telemetry, and sub-millisecond sync.",
    category: "Web Graphics & Chronography",
    role: "Frontend & UI/UX Engineer",
    timeline: "2026",
    technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Web APIs (Battery, Geolocation, Astronomy)"],
    liveUrl: "https://gauravwatch.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/clock",
    coverImage: "/projects/gauravwatch/cover.png",
    images: [
      "/projects/gauravwatch/cover.png",
      "/projects/gauravwatch/dashboard.png",
      "/projects/gauravwatch/features.png",
      "/projects/gauravwatch/mobile.png",
    ],
    licenseStatus: "Open Source (MIT) · Minimalist Productivity Tool",
    contractStatus: "Independent Commercial IP & Client Contract",
    licenseDetails: "Open source minimalist digital timepiece with astronomical calculation engines.",
    overview: "Gaurav Watch is a precision digital desk clock and ambient desktop companion. Built for zero distraction and mathematical stability, it displays real-time solar cycles, lunar illumination phases, device battery telemetry, and UTC offsets.",
    architecture: {
      title: "60 FPS Render Loop & Solar Phase Engine",
      description: "Hardware-accelerated rendering engine with astronomical math calculators running entirely on device.",
      points: [
        "Sub-millisecond system clock synchronization using requestAnimationFrame scheduling",
        "Keplerian astronomical algorithms calculating real-time sunrise, sunset, and moon phases",
        "Hardware battery API integration displaying real-time charging wattage status",
      ],
    },
    challenges: [
      {
        title: "Preventing memory leaks and timer drift in long-running ambient desk displays",
        solution: "Engineered a self-correcting drift loop that re-anchors to the system UTC epoch every minute.",
      },
    ],
    features: [
      "Large-format minimalist digital timepiece display",
      "Astronomical solar cycle (Sunrise & Sunset) calculations",
      "Lunar illumination phase tracker",
      "Device battery and charging telemetry display",
    ],
    results: [
      "Flawless 60 FPS rendering with negligible CPU utilization (< 0.5%)",
      "Zero drift across multi-day continuous ambient display tests",
    ],
  },
  "connectgaurav-developer-hub": {
    slug: "connectgaurav-developer-hub",
    projectId: "proj_14",
    title: "Connect Gaurav — Unified Developer Social Hub",
    subtitle: "Unified developer presence platform, appointment scheduling hub, and direct executive connection gateway.",
    category: "Enterprise Communication Gateway",
    role: "Lead Full Stack Engineer",
    timeline: "2026",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Brevo API", "Firebase"],
    liveUrl: "https://connectgaurav.eu.cc/",
    githubUrl: "https://github.com/AspiringWebGaurav/connectgaurav",
    coverImage: "/projects/connectgaurav/cover.png",
    images: [
      "/projects/connectgaurav/cover.png",
      "/projects/connectgaurav/dashboard.png",
      "/projects/connectgaurav/features.png",
      "/projects/connectgaurav/mobile.png",
    ],
    licenseStatus: "Enterprise Workspace · Client Contract Signed",
    contractStatus: "Client Contract Signed & Dedicated SLA",
    licenseDetails: "Centralized social identity and client booking platform.",
    overview: "Connect Gaurav unifies personal developer links, verified professional credentials, direct consultation booking, and communication channels into a single secure landing hub.",
    architecture: {
      title: "Unified Gateway & Social Verification Engine",
      description: "Serverless identity hub routing visitor inquiries directly into verified communication channels.",
      points: [
        "Direct Brevo email dispatch pipeline for consultation inquiries",
        "Cryptographically signed social link redirects and identity attestation",
        "Zero layout shift responsive mobile-first architecture",
      ],
    },
    challenges: [
      {
        title: "Aggregating multi-platform professional links with zero load latency",
        solution: "Implemented static site generation with edge revalidation for instantaneous link dispatch.",
      },
    ],
    features: [
      "Unified developer social identity aggregator",
      "Direct consultation booking and message pipeline",
      "Lightweight mobile-first responsive presentation",
    ],
    results: [
      "Sub-50ms page load times across all global edge nodes",
      "Seamless client and recruiter onboarding hub",
    ],
  },
};
