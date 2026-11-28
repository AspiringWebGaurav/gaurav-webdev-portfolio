import type { Metadata } from "next";
import CpLegalLayout from "@/components/cp/CpLegalLayout";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Terms of Use | CP Engine",
  description:
    "Terms of Use governing the CP Engine Windows file copy accelerator (v0.0.1 Base Foundation) and Dynamic Over-the-Air Update services.",
  alternates: {
    canonical: "https://cp.apps.gauravpatil.site/terms",
  },
  openGraph: {
    title: "Terms of Use | CP Engine",
    description:
      "Terms of Use for CP Engine for Windows, hardware-accelerated local transfers, and dynamic edge updates.",
    url: "https://cp.apps.gauravpatil.site/terms",
    siteName: "CP Engine",
  },
};

const CP_SHA256 =
  "ee19d1b329e5291e4ffe15461dbc812284349595e724ecb538ae2d76655d582c";

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "CP Engine",
      item: "https://cp.apps.gauravpatil.site",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Terms of Use",
      item: "https://cp.apps.gauravpatil.site/terms",
    },
  ],
};

export default function CpTermsPage() {
  return (
    <CpLegalLayout title="Terms of Use" lastUpdated="November 28, 2026">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <p className="text-zinc-900 dark:text-zinc-100 font-medium">
        Thank you for using CP Engine!
      </p>

      <p>
        These Terms of Use apply to your use of CP Engine for Microsoft Windows (Desktop
        Foundation <code className="font-mono text-sm">v0.0.1</code>), background tray services,
        and dynamic edge update delivery (collectively, &ldquo;Services&rdquo;). These Terms
        form an agreement between you and CP Engine (maintained by Gaurav Patil). By
        downloading, installing, or using our Services, you agree to these Terms.
      </p>

      {/* 1. Using CP Engine */}
      <section
        id="services"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          1. Using Our Services
        </h2>
        <p>
          <strong>What we provide.</strong> CP Engine is a lightweight, client-side file transfer
          accelerator for Microsoft Windows x64. The application monitors clipboard file-drop
          operations (<code className="font-mono text-sm">CF_HDROP</code>) and executes fast,
          parallel user-mode file transfers with a minimal transfer HUD and system tray controller.
        </p>
        <p>
          <strong>System requirements.</strong> You are responsible for ensuring your workstation
          meets Microsoft Windows 10/11 (64-bit) requirements and maintains healthy storage media
          and power stability prior to executing large high-throughput transfers.
        </p>
        <p>
          <strong>No kernel hooks.</strong> CP Engine operates strictly within documented Win32
          user-mode APIs and does not install kernel-mode (Ring 0) drivers or inject unauthorized
          shell extensions into system processes.
        </p>
      </section>

      {/* 2. Local File Transfers & Ownership */}
      <section
        id="transfers"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          2. Local File Transfers &amp; Data Ownership
        </h2>
        <p>
          <strong>100% local execution.</strong> All file copy, move, pause, resume, and verify
          operations execute strictly on your local drives or local network shares. CP Engine
          never uploads copied files, directory listings, filenames, or clipboard text to external
          servers.
        </p>
        <p>
          <strong>Your data.</strong> You retain all ownership, rights, and responsibility for
          files transferred using CP Engine. Because zero user files pass through external
          infrastructure, we cannot inspect, recover, or restore deleted or overwritten local files.
        </p>
      </section>

      {/* 3. Acceptable Use & Verification */}
      <section
        id="acceptable-use"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          3. Permitted Use &amp; Code of Conduct
        </h2>
        <p>
          We provide CP Engine to improve everyday Windows productivity. You agree to use our
          Services responsibly and not to abuse our software or update infrastructure. You must not:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-zinc-700 dark:text-zinc-300">
          <li>
            Disrupt, overload, flood, or launch denial-of-service attacks against GPHost or
            Cloudflare R2 dynamic update endpoints.
          </li>
          <li>
            Spoof release manifests, forge cryptographic signatures, or redistribute altered binaries
            carrying official CP Engine branding or certificates.
          </li>
          <li>
            Deploy CP Engine in safety-critical nuclear, medical life-support, aviation, or
            emergency dispatch systems where failure could cause physical harm.
          </li>
        </ul>
        <p>
          <strong>Installer verification.</strong> The official Windows setup package (
          <code className="font-mono text-sm">cpsetup.exe</code>,{" "}
          <code className="font-mono text-sm">v0.0.1</code>) is distributed strictly via{" "}
          <code className="font-mono text-sm">https://cp.apps.gauravpatil.site</code> and{" "}
          <code className="font-mono text-sm">https://gphost.eu.cc</code> with verified SHA-256
          digest:
        </p>
        <p className="font-mono text-xs sm:text-[13px] break-all text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 px-3.5 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
          {CP_SHA256}
        </p>
      </section>

      {/* 4. Anti-Tampering & Hardware Ban Policy */}
      <section
        id="anti-tampering"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          4. Software Integrity &amp; Hardware Ban Enforcement
        </h2>
        <p>
          <strong>Protection against tampering.</strong> Unauthorized binary patching, memory
          injection, DLL hijacking, reverse-engineering cracking, or tampering with embedded update
          verification checks is strictly prohibited on official builds.
        </p>
        <p>
          <strong>Ecosystem enforcement.</strong> Bypassing security verification or attempting to
          inject tampered update payloads triggers automated local rollback quarantine and may
          result in permanent machine and hardware-level bans across official Gaurav Patil
          ecosystem distribution services.
        </p>
      </section>

      {/* 5. Open Source License & Dynamic Updates */}
      <section
        id="updates-license"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          5. Software License &amp; Dynamic Updates
        </h2>
        <p>
          <strong>MIT open source license.</strong> CP Engine source code and official base builds
          are licensed under the MIT License, granting permission free of charge to use, copy,
          modify, and distribute copies subject to preservation of the copyright and permission
          notice. Official source is published at{" "}
          <a
            href="https://github.com/AspiringWebGaurav/cp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            github.com/AspiringWebGaurav/cp
          </a>
          .
        </p>
        <p>
          <strong>Silent binary handoffs.</strong> Once base release{" "}
          <code className="font-mono text-sm">v0.0.1</code> is installed, CP Engine checks for
          updates quietly, verifies AES-256-GCM / Windows PE headers, defers restarts while you
          are actively typing or copying files, performs atomic NTFS swaps, and rolls back
          automatically if a probationary boot fails.
        </p>
      </section>

      {/* 6. Disclaimers & Warranties */}
      <section
        id="disclaimers"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          6. Disclaimers &amp; Storage Responsibilities
        </h2>
        <p>
          THE SOFTWARE IS PROVIDED &ldquo;AS IS&rdquo;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          High-throughput sequential disk I/O places sustained workload on SSDs, NVMe controllers,
          and USB bridges. You acknowledge sole responsibility for maintaining backups of
          irreplaceable data and ensuring underlying hardware health.
        </p>
      </section>

      {/* 7. Limitation of Liability */}
      <section
        id="liability"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          7. Limitation of Liability
        </h2>
        <p>
          To the fullest extent permitted by applicable law, neither Gaurav Patil nor CP Engine
          contributors shall be liable for any indirect, incidental, special, consequential, or
          punitive damages, including data loss, hardware fault, or loss of business profits
          arising from your use or inability to use the Services.
        </p>
        <p>
          In no event shall aggregate liability exceed Five United States Dollars (US $5.00) or the
          amount paid by you for the free software during the preceding twelve months, whichever is
          lesser.
        </p>
      </section>

      {/* 8. Governing Law & Contact */}
      <section
        id="general"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          8. Governing Law &amp; Contact
        </h2>
        <p>
          These Terms are governed by the laws of India, with disputes subject to the exclusive
          jurisdiction of the competent courts of Maharashtra, India. If any clause is held
          unenforceable, the remaining Terms remain in full force.
        </p>
        <p>
          We may update these Terms when new capabilities or legal requirements apply. Questions
          can be sent to{" "}
          <a
            href="mailto:hello@gauravpatil.site"
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            hello@gauravpatil.site
          </a>{" "}
          or reviewed alongside our{" "}
          <a
            href="/privacy"
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="/aou"
            className="text-zinc-950 dark:text-zinc-50 underline underline-offset-4 hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            Acceptance of Use (AOU)
          </a>
          .
        </p>
      </section>
    </CpLegalLayout>
  );
}
