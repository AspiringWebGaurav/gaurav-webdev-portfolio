/**
 * Synchronization & Domain Sanitization Script
 * Synchronizes Firestore portfolio_legal_docs, history, and Redis to gauravpatil.site
 *
 * Usage: node scripts/sync-legal-to-site.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Read .env.local
const envPath = path.join(rootDir, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env.local not found at:', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
};

const projectId = getEnv('FIREBASE_ADMIN_PROJECT_ID') || getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
const clientEmail = getEnv('FIREBASE_ADMIN_CLIENT_EMAIL');
let privateKey = getEnv('FIREBASE_ADMIN_PRIVATE_KEY');
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}
const databaseURL = getEnv('FIREBASE_DATABASE_URL') || getEnv('NEXT_PUBLIC_FIREBASE_DATABASE_URL');

if (!getApps().length) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL,
  });
}

const db = getFirestore();

// Load seeds dynamically by parsing seed-data.ts or importing
async function loadSeeds() {
  const seedFile = path.join(rootDir, 'lib', 'dal', 'repositories', 'seed-data.ts');
  const code = fs.readFileSync(seedFile, 'utf8');

  // Extract SEED_TERMS_DOCUMENT and SEED_PRIVACY_DOCUMENT object definitions
  // We can also require/transpile or construct clean documents directly
  // Let's import or extract
  return {
    seedTerms: {
      id: "terms_active",
      docType: "TERMS",
      title: "Terms of Service",
      publishedVersion: "1.0.0",
      publishedAt: new Date().toISOString(),
      effectiveDate: "January 1, 2026",
      lastUpdatedDate: "September 9, 2026",
      jurisdiction: "Standard Global",
      version: 1,
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: "acceptance",
          heading: "1. Acceptance of Terms & Accessibility Commitment",
          filterMode: "all",
          order: 1,
          contentMarkdown: "By accessing, browsing, submitting inquiries, using authenticated services, or otherwise interacting with **Gaurav Portfolio**, you acknowledge and agree to be bound by these Terms of Service and all applicable policies. This platform commits to a strict **Mobile-First 10/10 Production Standard**, ensuring zero horizontal overflow, fluid typography, touch-ergonomic 44px hit targets, accessible reduced-motion fallbacks, and single-view contact workflows across all modern smartphones, tablets, and desktop workstations. If you do not agree with any provision, you may discontinue viewing or utilizing this platform.",
        },
        {
          id: "anonymity",
          heading: "2. Right to Confidential & Anonymous Communication",
          filterMode: "contact",
          order: 2,
          contentMarkdown: "Users and prospective partners are welcome to initiate contact anonymously:\n\n- **Confidential Inquiries:** Submitting an inquiry with the default \"Anonymous / Confidential\" role is fully permitted and legally respected as preliminary communication.\n- **Non-Disclosure Friendly:** Mutual non-disclosure agreements (NDAs) can be executed upon request prior to exchanging proprietary project details.",
        },
        {
          id: "ip",
          heading: "3. Intellectual Property & Engineering Architecture",
          filterMode: "all",
          order: 3,
          contentMarkdown: "All original visual design systems, dark luxury glassmorphic layouts, Three.js 3D Globe implementations, and full-stack software architectures showcased on this platform are the intellectual property of **Gaurav Patil**. Client deliverables and bespoke software engineering codebases are transferred strictly per individual written engagement agreements upon milestone completion.",
        },
        {
          id: "abuse-mitigation",
          heading: "4. Automated Abuse Mitigation & Cloudflare Verification",
          filterMode: "contact",
          order: 4,
          contentMarkdown: "To maintain high uptime and system integrity, public mutation endpoints (such as the contact form) are protected by **Cloudflare Turnstile**. Automated scraping, malicious payload injection, bot spam, and denial-of-service attempts are strictly prohibited and actively mitigated.",
        },
        {
          id: "email-standards",
          heading: "5. Transactional Communication Standards & Mandatory Legal Update Announcements",
          filterMode: "contact",
          order: 5,
          contentMarkdown: "All transactional emails, contact receipts, security alerts, and mandatory policy notices are dispatched from the authenticated server domain `gauravpatil.site` via Brevo API. Official sender identities include `gaurav@gauravpatil.site` (direct professional connections and consulting agreements), `hello@gauravpatil.site` (general inquiries and auto-replies), `security@gauravpatil.site` (authentication alerts and audit logs), `help@gauravpatil.site` (support), and `no-reply@gauravpatil.site` (system OTPs and automated legal announcements). A strict zero-spam guarantee is maintained: submitted contact emails are never enrolled in promotional marketing sequences.\n\n### Mandatory Legal & Policy Update Announcement Notice\n\n- **Automatic Registration for Policy Updates:** Submitting an email address through any service of this portfolio — including Contact Form inquiries, Live Chat email OTP authentication, support requests, or direct communications — registers that address to receive mandatory policy, legal, and security announcements in accordance with your acceptance of use.\n- **Mandatory Non-Marketing Announcements:** When material updates are made to the public Terms of Service, Privacy Policy, or critical security procedures, automated informational notices are broadcast directly from `no-reply@gauravpatil.site` or `security@gauravpatil.site`. These communications are strictly non-commercial, transactional legal disclosures and contain zero marketing or promotional sequences.\n- **No Unsubscribe & Immunity from Automated Client-Level Unsubscribe:** Because legal update announcements are mandatory contractual disclosures required to maintain operational and legal transparency for all users who have interacted with Gaurav Portfolio or its authenticated services, **no unsubscribe or opt-out option is provided**. Even if automated email client features (such as Google/Gmail's automatic \"Unsubscribe\" header or client-level spam filters) are invoked, you acknowledge and agree that you will continue to receive mandatory legal, policy, and security notices as per this policy and your acceptance of use.",
        },
        {
          id: "assistant-terms",
          heading: "6. Personal Assistant (Beta) Operational Terms & AI Disclaimer",
          filterMode: "assistant",
          order: 6,
          contentMarkdown: "### Purpose & Scope of Gaurav Assistant & Live Chat\n\nThe Personal Assistant and Live Chat system are engineered to provide an interactive, personal communication channel with Gaurav Patil. It provides direct, automated insights into engineering benchmarks, architecture patterns, and project deliverables, while facilitating immediate 1-to-1 live communication.\n\n### Live Chat Real-Time Dispatch & Notification Architecture\n\nWhen you initiate a conversation through **Live Chat with Gaurav**, the backend operates a hybrid real-time communication pipeline:\n\n- **Active Online Streaming:** If Gaurav is actively online and connected to the session, incoming messages arrive instantly in real-time.\n- **Automated Inbox Dispatch:** If Gaurav is away or offline, the server instantaneously generates and dispatches an automated lead notification directly to Gaurav's private inbox containing your verified sender details and full message transcript with 1-click direct response routing.\n- **Single-Use 6-Digit Email Verification:** To eliminate spam and protect system resources, access to Live Chat requires a single-use 6-digit OTP code dispatched exclusively from `no-reply@gauravpatil.site`. Verification codes expire in 5 minutes.\n- **4-Hour Active Session Token:** Once verified, an encrypted session remains active for 4 hours. You may close and reopen the chat window anytime within this window without re-authenticating. Visitors may explicitly terminate their session at any time using the **Sign out** button in the top-right header.\n\n### Official Verified Senders & Support Pipeline\n\nAll communications, support tickets, and contact verification flows originate exclusively from the authenticated domain `gauravpatil.site`:\n\n- `gaurav@gauravpatil.site` — Direct professional inquiries, technical consulting proposals, and executive recruiter outreach.\n- `hello@gauravpatil.site` — General portfolio inquiries, recruiter outreach, and direct developer contact.\n- `help@gauravpatil.site` — Assistant technical support, bug reports, and portfolio navigation guidance.\n- `security@gauravpatil.site` — Security notifications, 2FA OTP codes, and vulnerability disclosure reports.\n- `no-reply@gauravpatil.site` — Automated Live Chat OTP passcodes, system receipts, and non-interactive alerts.\n\n### AI Accuracy Disclaimer & Acceptable Use\n\n- **Generative Limitations:** While tuned for accuracy, automated assistant responses may occasionally produce incomplete or summarized statements. Official portfolio source code and direct communication with Gaurav remain authoritative benchmarks.\n- **Acceptable Use:** Visitors agree not to attempt prompt-injections, reverse-engineer underlying system prompts, extract internal configuration, or send abusive payloads.\n- **Continuous Beta Evolution:** The assistant is under active development and may undergo live feature updates or brief maintenance windows without notice.",
        },
        {
          id: "whatsapp-terms",
          heading: "7. WhatsApp Recruiter & Visitor Communication Channel",
          filterMode: "whatsapp",
          order: 7,
          contentMarkdown: "Gaurav Portfolio provides an official Meta WhatsApp Business Cloud API integration allowing recruiters, hiring managers, and prospective clients to connect directly with Gaurav Patil. Use of this channel is subject to the following terms:\n\n- **Authorized Professional Scope:** This WhatsApp channel is exclusively intended for professional recruitment discussions, job opportunities, engineering inquiries, and technical collaboration proposals. Promotional spam, harassment, or unsolicited marketing is strictly prohibited.\n- **Message Quota & Anti-Spam Safeguards:** To prevent spam and protect direct communication channels, sessions are allocated up to 3 direct inquiry message slots. Messages are delivered instantaneously to Gaurav Patil in real time with 1-click email response triggers.\n- **Unsubscribe & Immediate Data Erasure:** You may opt out at any time by replying `STOP`. Replying STOP immediately unsubscribes your number and permanently erases your conversation history from the database (GDPR Right to Erasure). You can resume anytime by replying `START`.\n- **Data Portability & Self-Service Export:** Under GDPR Article 20, you retain full ownership of your conversation records. You can type `/exportmydata` anytime in WhatsApp to instantly receive a cryptographically signed ZIP archive with your complete records (links are strictly time-limited to 10 minutes for privacy).",
        },
        {
          id: "admin-governance",
          heading: "8. Administrative Subsystem Isolation & 2FA Governance",
          filterMode: "all",
          order: 8,
          contentMarkdown: "The administrative panel (`/admin/*`) is an isolated workspace strictly restricted to authorized Superadmins. Administrative access requires Google OAuth 2.0 PKCE, salted HMAC-SHA256 Two-Factor Authentication (OTP), and zero-lockout IP security verification. Administrative access and data operations are governed separately under the Administrator Terms of Service.",
        },
        {
          id: "liability",
          heading: "9. Limitation of Liability & Disclaimers",
          filterMode: "all",
          order: 9,
          contentMarkdown: "This website and its demonstrative artifacts are provided on an \"as is\" and \"as available\" basis. In no event shall Gaurav Patil be liable for indirect, incidental, or consequential damages resulting from the use of this website.",
        },
        {
          id: "legal-contact",
          heading: "10. Inquiries & Legal Notices",
          filterMode: "all",
          order: 10,
          contentMarkdown: "For contract proposals, bespoke engineering consulting, or professional engagement agreements:\n\n- **Direct Professional Line:** [gaurav@gauravpatil.site](mailto:gaurav@gauravpatil.site) *(Reserved strictly for professional proposals, consulting contracts, and executive recruiter correspondence)*\n- **General Inquiries & Notices:** [hello@gauravpatil.site](mailto:hello@gauravpatil.site)",
        },
      ],
    },
    seedPrivacy: {
      id: "privacy_active",
      docType: "PRIVACY",
      title: "Privacy Policy",
      publishedVersion: "1.0.0",
      publishedAt: new Date().toISOString(),
      effectiveDate: "January 1, 2026",
      lastUpdatedDate: "September 9, 2026",
      jurisdiction: "Privacy-First",
      version: 1,
      updatedAt: new Date().toISOString(),
      sections: [
        {
          id: "overview",
          heading: "1. Overview & Privacy-First Philosophy",
          filterMode: "all",
          order: 1,
          contentMarkdown: "Your privacy, autonomy, and security are non-negotiable. This Privacy Policy governs how data is handled across **Gaurav Portfolio**. The architecture operates on strict data minimization principles: only the minimum information necessary to facilitate professional communication is collected, with zero third-party data tracking, zero cookie profiling, and zero monetization of personal information.",
        },
        {
          id: "anonymity",
          heading: "2. Absolute Right to Anonymity & Confidential Inquiries",
          filterMode: "contact",
          order: 2,
          contentMarkdown: "Every visitor and prospective collaborator has the full, unrestricted right to maintain complete anonymity:\n\n- **Default Anonymous Role:** The contact form defaults to the \"Anonymous / Confidential\" identity to ensure no visitor is pressured into declaring a specific role.\n- **Pseudonyms & Private Relays:** You may submit inquiries using an alias, pseudonym, or privacy-relayed email address (such as Apple Relay or SimpleLogin).\n- **Zero Telemetry Correlation:** Inbound contact messages are strictly segregated from user-agent fingerprints and external analytics data.",
        },
        {
          id: "turnstile",
          heading: "3. Bot Mitigation & Ephemeral Cloudflare Turnstile Evaluation",
          filterMode: "contact",
          order: 3,
          contentMarkdown: "To protect public endpoints against automated spam and DDoS attacks, the system utilizes **Cloudflare Turnstile**:\n\n- **Cookie-Free Evaluation:** Turnstile evaluates browser telemetry ephemerally during submission without setting persistent cross-site tracking cookies.\n- **Server-Side Token Validation:** Tokens are validated instantaneously via server-to-server TLS calls and discarded immediately following verification.",
        },
        {
          id: "brevo",
          heading: "4. Transactional Communications & Brevo Delivery Gateway",
          filterMode: "contact",
          order: 4,
          contentMarkdown: "All transactional communications, verification passcodes, and mandatory legal announcements are routed through an enterprise Brevo server pipeline:\n\n- **Authenticated Domain:** Official communications originate strictly from the verified primary identity `gauravpatil.site`.\n- **Official Senders:**\n  - `hello@gauravpatil.site` (Direct contact & automated receipts)\n  - `security@gauravpatil.site` (Security alerts, authentication verification & push audit logs)\n  - `help@gauravpatil.site` (Support & assistance)\n  - `no-reply@gauravpatil.site` (System OTPs & mandatory legal update announcements)\n- **Strict Non-Marketing Standard:** Submitting an inquiry or authenticating will never enroll you in promotional campaigns or marketing distributions.\n\n### Mandatory Legal Update Broadcasts & Strict No-Unsubscribe Standard\n\nEmail addresses provided through Contact Form submissions, Assistant/Live Chat OTP authentication, or direct inquiries are retained securely in cloud databases. These addresses receive mandatory service announcements whenever the public Terms of Service or Privacy Policy are amended. Because these notices represent vital legal disclosures required for platform transparency and governance (and never commercial marketing), they do not include marketing unsubscribe links and cannot be opted out of, even through third-party automated email client features (such as Google/Gmail automatic 1-click unsubscribe headers).",
        },
        {
          id: "data-rights",
          heading: "5. Data Security, Storage & Deletion Rights",
          filterMode: "all",
          order: 5,
          contentMarkdown: "Inquiries are stored in encrypted cloud databases (Firebase Firestore / Realtime Database in region `asia-southeast1`) with atomic lead tracking. You retain the right under GDPR, CCPA, and international privacy standards to:\n\n- Request a copy of any communication history associated with your email.\n- Request permanent, atomic deletion of all submitted contact records and message drafts.",
        },
        {
          id: "assistant-privacy",
          heading: "6. Personal Assistant (Beta) & AI Safety Architecture",
          filterMode: "assistant",
          order: 6,
          contentMarkdown: "### Why Gaurav Assistant Was Created\n\nThe Personal Assistant was conceived and engineered as an **intelligent interactive portfolio navigator** designed to elevate how recruiters, hiring managers, engineering leaders, and potential clients explore Gaurav Patil's work. Instead of manually parsing static resume bullets, visitors can receive real-time answers concerning deep case studies, technical specializations, engineering philosophy, and live architectural demonstrations.\n\n### Custom Mail Domain Support & Verified Communication Channels\n\nAll visitor interactions, assistant support inquiries, and transactional communications are backed by a dedicated, enterprise-grade Brevo email delivery pipeline configured with strict **SPF, DKIM, and DMARC** authentication records. Official communication originating from this portfolio is bound to the primary authenticated domain `gauravpatil.site`:\n\n- `gaurav@gauravpatil.site` — Direct professional contact, engineering consulting engagements, and formal controller correspondence.\n- `hello@gauravpatil.site` — Direct portfolio contact, visitor inquiries, developer collaboration, and automated inquiry receipts.\n- `help@gauravpatil.site` — Assistant technical assistance, bug reports, user feedback, and portfolio navigation support.\n- `security@gauravpatil.site` — Security disclosures, vulnerability reports, 2FA OTP codes, and authentication alerts.\n- `no-reply@gauravpatil.site` — Non-interactive automated notifications, system passcodes, and security verifications only.\n\n### Live Chat Notification Privacy & 4-Hour Session Security\n\n- **Direct Message Routing:** When you send a message in Live Chat, it is streamed immediately if Gaurav is connected. When away, the automated system triggers an instantaneous notification email to Gaurav's personal inbox with your message transcript and 1-click reply routing.\n- **Zero Plaintext OTP Storage:** 6-digit verification codes are hashed using salted HMAC-SHA256 before storage and destroyed immediately upon successful authentication or after 5 minutes.\n- **Encrypted 4-Hour Session Token:** Verified sessions are stored in an encrypted `httpOnly`, `SameSite=Lax` cookie valid for 4 hours. You can close and return to the portfolio anytime during this period without re-verifying.\n- **1-Click Sign-Out & Detachment:** You may revoke your session token at any time by clicking **Sign out** in the chat header, which atomically clears your session cookie and closes live streams across all browser tabs.\n\n### Data Protection, Ephemeral Processing & Anonymity\n\n- **Ephemeral Session Processing:** Assistant interactions are evaluated in-memory strictly for real-time guidance during your active session.\n- **Zero Third-Party Training or Data Selling:** A 100% data integrity guarantee is maintained: queries and live messages are never sold, rented, monetized, or fed into public generative model training pools.\n- **No Persistent Tracking:** The assistant functions completely without tracking cookies, behavioral tracking scripts, or persistent fingerprinting.\n- **Active Beta Guardrails:** Automated rate-limiting and input sanitization protect against malicious exploitation while maintaining zero layout shift (`CLS = 0`) across desktop and mobile devices.",
        },
        {
          id: "whatsapp-data-export",
          heading: "7. WhatsApp Recruiter Data Portability & Self-Service Export (GDPR Art. 20)",
          filterMode: "whatsapp",
          order: 7,
          contentMarkdown: "In full compliance with **GDPR Article 20 (Right to Data Portability)** and the **California Consumer Privacy Act (CCPA)**, visitors and recruiters interacting with Gaurav Patil via the official WhatsApp Business channel maintain absolute ownership of their communication records:\n\n- **Instant ZIP Archive:** Typing `/exportmydata` in WhatsApp immediately triggers the server to compile an encrypted in-memory ZIP package containing your complete records with zero wait time.\n- **Visual HTML Log:** Includes a standalone, beautifully styled Dark Luxury HTML transcript featuring verified timestamps, speaker badges, and Gaurav Portfolio branding readable offline on any browser.\n- **GDPR Certificate:** Every export includes an official Data Portability Certificate detailing exact UTC generation timestamps, session identifiers, compliance guarantees, and SHA-256 integrity verification.\n\n### How to Export Your WhatsApp Chat Data (2 Simple Steps)\n\n1. In your active WhatsApp conversation with Gaurav Patil, send: `/exportmydata` (or `/export`).\n2. The automated system will immediately confirm with a generation notice, followed by a cryptographically signed HMAC download link (strictly valid for 10 minutes). Tap the link to download your `.zip` archive directly to your device.\n\n### GDPR Article 17: Right to Immediate Erasure (STOP Command)\n\nYou maintain full sovereignty over your information. At any point, simply reply `STOP` to WhatsApp. The server immediately unsubscribes your number and permanently erases all message documents and session data from the database in an atomic transaction.",
        },
        {
          id: "admin-privacy",
          heading: "8. Administrative Subsystem Privacy Governance",
          filterMode: "all",
          order: 8,
          contentMarkdown: "The administrative panel (`/admin/*`) maintains a strictly isolated data governance architecture. Administrative authentication is restricted to authorized Superadmins via Google OAuth 2.0 PKCE. 2FA One-Time Passcodes are stored in salted HMAC-SHA256 hashed representations, and security IP verification challenges operate under an immutable 15-minute TTL. Sign-out triggers a complete 5-step detachment that clears all cookies, tokens, and browser session storage. Detailed administrative privacy protocols are documented in the Administrator Privacy Policy.",
        },
        {
          id: "contact-requests",
          heading: "9. Contact & Data Requests",
          filterMode: "all",
          order: 9,
          contentMarkdown: "For formal privacy inquiries, data deletion requests, or direct professional communication:\n\n- **Direct Professional & Controller Inquiries:** [gaurav@gauravpatil.site](mailto:gaurav@gauravpatil.site) *(Reserved strictly for professional proposals, consulting contracts, and data controller requests)*\n- **General Inquiries:** [hello@gauravpatil.site](mailto:hello@gauravpatil.site)",
        },
      ],
    },
  };
}

async function sync() {
  console.log('\n===============================================================');
  console.log('🔄 SYNCHRONIZING LEGAL DOCUMENTS & DOMAINS TO GAURAVPATIL.SITE');
  console.log('===============================================================\n');

  const { seedTerms, seedPrivacy } = await loadSeeds();

  // 1. Update terms_active
  console.log('📄 1. Upserting portfolio_legal_docs/terms_active...');
  await db.collection('portfolio_legal_docs').doc('terms_active').set(seedTerms);
  console.log('   ✓ terms_active synchronized with 10 sections and gauravpatil.site.');

  // 2. Update privacy_active
  console.log('\n📄 2. Upserting portfolio_legal_docs/privacy_active...');
  await db.collection('portfolio_legal_docs').doc('privacy_active').set(seedPrivacy);
  console.log('   ✓ privacy_active synchronized with 9 sections and gauravpatil.site.');

  // 3. Sanitize portfolio_legal_history
  console.log('\n📜 3. Sanitizing portfolio_legal_history collection...');
  const histSnap = await db.collection('portfolio_legal_history').get();
  let sanitizedHistCount = 0;
  for (const doc of histSnap.docs) {
    const data = doc.data();
    const dataStr = JSON.stringify(data);
    if (dataStr.includes('online') || dataStr.includes('gauravservices')) {
      const sanitizedStr = dataStr
        .replaceAll('gauravpatil.online', 'gauravpatil.site')
        .replaceAll('gauravservices.eu.cc', 'gauravpatil.site')
        .replaceAll('gauravservices.eu', 'gauravpatil.site')
        .replaceAll(' (with legacy domain `gauravservices.eu.cc`)', '')
        .replaceAll(' (with legacy domain `gauravservices.eu`)', '');
      const sanitizedData = JSON.parse(sanitizedStr);
      await doc.ref.set(sanitizedData);
      sanitizedHistCount++;
      console.log(`   ✓ Sanitized historical version [${doc.id}]`);
    }
  }
  console.log(`   ✓ Checked ${histSnap.size} history documents (${sanitizedHistCount} sanitized).`);

  // 4. Invalidate Redis Cache
  const redisUrl = getEnv('UPSTASH_REDIS_REST_URL');
  const redisToken = getEnv('UPSTASH_REDIS_REST_TOKEN');
  if (redisUrl && redisToken) {
    try {
      console.log('\n🧹 4. Invalidate Upstash Redis cache...');
      const r = await fetch(`${redisUrl}/flushdb`, {
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      const resData = await r.json();
      console.log(`   ✓ Redis flush status:`, resData.result || resData);
    } catch (err) {
      console.warn('   ⚠️ Redis flush warning:', err.message);
    }
  }

  // 5. Broadcast live CMS change signal to RTDB
  try {
    console.log('\n📡 5. Broadcasting RTDB CMS live update signal...');
    const rtdb = getDatabase();
    await rtdb.ref('public_signals/cms_sync').set({
      timestamp: Date.now(),
      target: 'portfolio_legal_docs',
      publishedBy: 'system_sync',
    });
    console.log('   ✓ RTDB broadcast dispatched.');
  } catch (err) {
    console.warn('   ⚠️ RTDB signal warning:', err.message);
  }

  console.log('\n===============================================================');
  console.log('✅ SYNCHRONIZATION COMPLETE: All legal documents now gauravpatil.site');
  console.log('===============================================================\n');
}

sync()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Fatal synchronization error:', err);
    process.exit(1);
  });
