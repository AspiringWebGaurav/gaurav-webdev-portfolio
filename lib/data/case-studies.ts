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
  githubUrl: string;
  coverImage: string;
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
  "3d-solar-system-simulation": {
    slug: "3d-solar-system-simulation",
    projectId: "proj_01",
    title: "3D Solar System Planets Simulation",
    subtitle: "High-performance WebGL celestial orbital mechanics engine built with Three.js and React",
    category: "3D Interactive & WebGL",
    role: "Lead 3D Frontend Engineer",
    timeline: "2024",
    technologies: ["React", "Three.js", "WebGL", "TypeScript", "Tailwind CSS", "Framer Motion"],
    liveUrl: "https://github.com/AspiringWebGaurav",
    githubUrl: "https://github.com/AspiringWebGaurav",
    coverImage: "/p1.webp",
    overview:
      "A mathematically grounded, interactive 3D simulation of celestial planetary bodies within our solar system. Designed to render orbital trajectories, custom atmospheric shaders, and dynamic lighting transitions smoothly across all devices at 60 FPS.",
    architecture: {
      title: "WebGL Scene Graph & Shader Architecture",
      description:
        "Engineered using a modular Three.js scene architecture decoupled from React's render loop to eliminate unnecessary re-renders during high-frequency animation ticks.",
      points: [
        "Hierarchical scene graph modeling gravitational parent-child relationships and orbital eccentricities.",
        "Custom GLSL fragment and vertex shaders simulating planetary atmospheric light scattering.",
        "Resource lifecycle management ensuring zero GPU texture memory leaks upon component unmounting.",
      ],
    },
    challenges: [
      {
        title: "Sustaining 60 FPS across low-power mobile GPUs",
        solution:
          "Implemented adaptive Level of Detail (LOD) rendering and instanced meshes for asteroid belts, dynamically throttling shadow map resolution on low-tier devices.",
      },
      {
        title: "Spherical UV texture distortion at polar regions",
        solution:
          "Utilized high-resolution equirectangular texture maps paired with custom normal mapping shaders to preserve surface detail without texture stretching.",
      },
    ],
    features: [
      "Real-time orbital tracking with accurate scale velocity adjustments",
      "Interactive 360-degree orbit and pinch-to-zoom camera controls",
      "Dynamic celestial lighting calculated from the central sun light emitter",
      "Informational telemetry overlays for each planet's diameter, distance, and orbital period",
    ],
    results: [
      "Stable 60 FPS performance maintained across mobile and desktop test environments",
      "Zero GPU memory leakage verified through Chrome Performance tooling",
      "Featured as an open-source educational WebGL demonstration",
    ],
  },

  "yoom-video-conferencing": {
    slug: "yoom-video-conferencing",
    projectId: "proj_02",
    title: "Yoom — Video Conferencing Web Application",
    subtitle: "Enterprise-grade real-time video collaboration platform built with Next.js 15 and Stream API",
    category: "Full Stack Web Application",
    role: "Full Stack Engineer",
    timeline: "2024",
    technologies: ["Next.js 15", "TypeScript", "Stream API", "Clerk", "Tailwind CSS"],
    liveUrl: "https://github.com/AspiringWebGaurav",
    githubUrl: "https://github.com/AspiringWebGaurav",
    coverImage: "/p2.webp",
    overview:
      "Yoom is a production-ready video conferencing platform providing seamless real-time audio/video communication, meeting scheduling, screen sharing, recording, and multi-tenant authentication.",
    architecture: {
      title: "Real-Time Streaming & Authentication Pipeline",
      description:
        "Engineered on Next.js 15 App Router utilizing Stream's low-latency global mesh network combined with Clerk's cryptographic session tokens for zero-trust room authorization.",
      points: [
        "Edge-rendered room orchestration coordinating participant tokens and call states.",
        "Adaptive bitrate video negotiation adjusting quality dynamically according to participant network bandwidth.",
        "Secure server action middleware validating room participant permissions and host privileges.",
      ],
    },
    challenges: [
      {
        title: "Low-latency participant state synchronization",
        solution:
          "Leveraged Stream's WebSocket event emitters and optimistic UI updates to reflect mute, video toggle, and hand-raise states with sub-50ms latency.",
      },
      {
        title: "Dynamic video tile layout responsiveness",
        solution:
          "Engineered a dynamic CSS Grid layout algorithm that recalculates aspect ratios automatically for 1 to 50 concurrent participants without layout shift.",
      },
    ],
    features: [
      "Instant meeting creation and persistent personal meeting rooms",
      "Scheduled upcoming calls with automated calendar synchronization",
      "Full cloud screen recording with post-meeting playback archiving",
      "Speaker spotlight and active participant view switching",
    ],
    results: [
      "Sub-200ms glass-to-glass latency achieved in global call tests",
      "Zero layout shift during participant entry and exit events",
      "Robust role-based authorization preventing unauthorized meeting interruptions",
    ],
  },

  "ai-image-saas-platform": {
    slug: "ai-image-saas-platform",
    projectId: "proj_03",
    title: "AI Image SaaS — Full Stack Platform",
    subtitle: "Commercial AI image transformation platform with Stripe payments and credits architecture",
    category: "SaaS & Cloud Architecture",
    role: "Full Stack & Cloud Engineer",
    timeline: "2024 - 2025",
    technologies: ["Next.js", "React", "TypeScript", "Cloudinary AI", "Stripe", "Tailwind CSS"],
    liveUrl: "https://github.com/AspiringWebGaurav",
    githubUrl: "https://github.com/AspiringWebGaurav",
    coverImage: "/p3.webp",
    overview:
      "A commercial Software-as-a-Service application delivering automated AI image manipulation—including generative fill, background removal, object recoloring, and image restoration—coupled with a transactional credit balance and Stripe checkout.",
    architecture: {
      title: "Event-Driven Asynchronous Processing & Ledger Pipeline",
      description:
        "Built around asynchronous image transformation pipelines, webhook event reconciliation, and transactional credit deductions guaranteeing idempotency.",
      points: [
        "Stripe webhook handler with signature verification and atomic database balance mutations.",
        "Cloudinary AI integration for deterministic parameter-based transformation pipelines.",
        "Optimistic transformation previews paired with server-side download asset signing.",
      ],
    },
    challenges: [
      {
        title: "Preventing double-spend of user transformation credits",
        solution:
          "Implemented atomic transactional mutations with distributed locking so credit deductions and transformation jobs execute as a unified atomic unit.",
      },
      {
        title: "Processing large image transformations without request timeouts",
        solution:
          "Architected an asynchronous job queue delegating heavy generative rendering to background workers while polling completion status via serverless hooks.",
      },
    ],
    features: [
      "AI-powered generative fill extending canvas boundaries seamlessly",
      "Precise semantic object removal and background isolation",
      "Multi-tier credit subscription packages with Stripe Checkout and Customer Portal",
      "User transformation history archive with direct high-resolution download links",
    ],
    results: [
      "100% webhook transaction reconciliation with zero duplicate charge reports",
      "Average transformation dispatch time reduced to under 1.2 seconds",
      "Secure asset URL signing preventing unauthorized CDN bandwidth consumption",
    ],
  },

  "apple-iphone-3d-experience": {
    slug: "apple-iphone-3d-experience",
    projectId: "proj_04",
    title: "Animated Apple iPhone 3D Showcase",
    subtitle: "Precision recreation of Apple's flagship product showcase using GSAP and Three.js",
    category: "Creative Development & 3D Web",
    role: "Creative Frontend Developer",
    timeline: "2024",
    technologies: ["Next.js", "Three.js", "GSAP", "ScrollTrigger", "TypeScript", "Tailwind CSS"],
    liveUrl: "https://github.com/AspiringWebGaurav",
    githubUrl: "https://github.com/AspiringWebGaurav",
    coverImage: "/p4.webp",
    overview:
      "A high-fidelity creative engineering recreation of Apple's iconic iPhone 15 Pro promotional website. Showcases synchronized 3D model manipulation, camera trajectory interpolation, and timeline animations tied precisely to user viewport scroll progression.",
    architecture: {
      title: "Scroll-Driven 3D Animation Pipeline",
      description:
        "Coordinates GSAP ScrollTrigger timeline states with a WebGL canvas rendering glTF 3D device models with real-time physical lighting.",
      points: [
        "Normalized scroll scrub timeline ensuring buttery smooth interpolation across variable refresh rate displays (60Hz to 120Hz).",
        "glTF model material switching updating titanium finishes without reloading base geometry.",
        "Custom canvas containment preventing layout jitter during high-velocity scrolling.",
      ],
    },
    challenges: [
      {
        title: "Synchronizing scroll position with 3D camera coordinates without jitter",
        solution:
          "Employed cubic Bezier smoothing curves and requestAnimationFrame ticker throttling to decouple scroll listener events from GPU render passes.",
      },
      {
        title: "Complex metallic shader reflections on mobile devices",
        solution:
          "Pre-filtered high dynamic range environment maps (HDRI) converted to low-bandwidth cubemaps, cutting memory footprint by 78%.",
      },
    ],
    features: [
      "Smooth 360-degree rotation and scale transitions bound to page scroll",
      "Interactive material colorway picker dynamically altering device finish",
      "Responsive dual-size model rendering (iPhone 15 Pro and iPhone 15 Pro Max)",
      "Accessible reduced-motion fallback states for accessibility compliance",
    ],
    results: [
      "Flawless 60 FPS scrub playback verified on desktop and mobile browsers",
      "78% reduction in texture asset payloads through optimized cubemap filtering",
      "Zero cumulative layout shift (CLS = 0) throughout all animation stages",
    ],
  },
};
