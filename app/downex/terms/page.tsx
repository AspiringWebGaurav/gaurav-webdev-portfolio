import type { Metadata } from "next";
import DownexLegalLayout from "@/components/downex/DownexLegalLayout";

export const dynamic = "force-static";
export const revalidate = false;

export const metadata: Metadata = {
  metadataBase: new URL("https://downex.apps.gauravpatil.site"),
  title: {
    absolute: "Terms of Use | Downex Download Manager",
  },
  description:
    "Official Terms of Use governing Downex Download Manager, the browser companion extension, and software updates.",
  alternates: {
    canonical: "https://downex.apps.gauravpatil.site/terms",
  },
  openGraph: {
    title: "Terms of Use | Downex Download Manager",
    description:
      "Official Terms of Use governing Downex Download Manager and related services.",
    url: "https://downex.apps.gauravpatil.site/terms",
    siteName: "Downex",
  },
};

export default function DownexTermsPage() {
  return (
    <DownexLegalLayout
      title="Terms of Use"
      lastUpdated="November 24, 2026"
    >
      <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
        Thank you for using Downex!
      </p>

      <p>
        These Terms of Use apply to your use of Downex Download Manager for Windows, the optional browser companion extension, and associated software, services, and dynamic updates (all together, &ldquo;Services&rdquo;). These Terms form an agreement between you and Downex. By downloading, installing, or using our Services, you agree to these Terms.
      </p>

      {/* 1. Using Our Services */}
      <section id="services" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          1. Using Our Services
        </h2>
        <p>
          <strong>What we provide.</strong> Downex is an independent, client-side download accelerator and task manager designed for Microsoft Windows. The software enables high-performance parallel stream downloading, segmented file assembly, local queue scheduling, and system tray management.
        </p>
        <p>
          <strong>System requirements.</strong> You are responsible for ensuring that your workstation and operating system meet the minimum technical requirements necessary to execute the software and manage local network bandwidth.
        </p>
        <p>
          <strong>Compliance with law.</strong> You must use our Services in compliance with all applicable local, national, and international laws, regulations, and third-party agreements.
        </p>
      </section>

      {/* 2. Content & Downloads */}
      <section id="content" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          2. Content &amp; Downloads
        </h2>
        <p>
          <strong>Your content.</strong> You may provide download URLs and addresses to the Services (&ldquo;Input&rdquo;) and receive files from remote hosting servers based on that Input (&ldquo;Output&rdquo;). You are solely responsible for your Content, including ensuring that your downloads do not violate any applicable copyright, intellectual property, or third-party service terms.
        </p>
        <p>
          <strong>Ownership of content.</strong> Downex does not host, curate, index, store, or license any files or media downloaded through the software. All ownership and intellectual property rights in downloaded content remain strictly between you and the respective third-party hosting server.
        </p>
        <p>
          <strong>Third-party services.</strong> When Downex downloads a file on your instruction, it establishes direct network connections to third-party servers. Third-party content and hosting services are subject to their own terms and policies, and Downex is not responsible for third-party server availability, speed limits, or content integrity.
        </p>
      </section>

      {/* 3. Permitted Use & Conduct */}
      <section id="dos-and-donts" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500 relative">
        <span id="conduct" className="absolute -top-20 block h-0 w-0 opacity-0 pointer-events-none" />
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          3. Permitted Use &amp; Code of Conduct
        </h2>
        <p>
          <strong>Permitted use (Do&apos;s).</strong> You may use Downex to accelerate compliant HTTP and HTTPS downloads, configure concurrent connection limits, schedule file queues, use the official browser companion extension, and preserve your download history locally on your device.
        </p>
        <p>
          <strong>Prohibited conduct (Don&apos;ts).</strong> You agree that you will not:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Reverse-engineer, decompile, disassemble, crack, or unpack Downex binary executables or update containers.</li>
          <li>Inject unauthorized dynamic link libraries (DLLs), modify runtime memory, or tamper with security processes.</li>
          <li>Weaponize the software for distributed denial-of-service (DDoS) attacks, packet flooding, or unauthorized web scraping.</li>
          <li>Use the software to knowingly distribute malware, viruses, or unauthorized copyrighted materials in violation of law.</li>
          <li>Circumvent or attempt to tamper with security restrictions or administrative directives.</li>
        </ul>
      </section>

      {/* 4. Hardware Enforcement & Anti-Tampering */}
      <section
        id="hardware-enforcement"
        tabIndex={-1}
        className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-red-500/40 target:bg-red-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500 relative"
      >
        <span id="hardware-patch" className="absolute -top-20 block h-0 w-0 opacity-0 pointer-events-none" />
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          4. Hardware Enforcement &amp; Anti-Tampering
        </h2>
        <p>
          <strong>Kernel-level silicon enforcement.</strong> Downex security enforcement operates directly at the physical hardware and kernel register level. Each client installation is cryptographically bound to permanent physical motherboard, CPU, and device firmware identifiers.
        </p>
        <p>
          <strong>No circumvention or bypass possible.</strong> If an administrative hardware ban is issued against your device, it is permanently locked at the hardware level. The following actions will <strong>never</strong> bypass, reset, or evade enforcement:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Formatting System &amp; reinstalling App:</strong> Formatting storage drives, repartitioning disk volumes, clean-reinstalling Windows, or reinstalling the application will <em>never</em> bypass this patch. Hardware identifiers remain permanently anchored to the machine silicon.
          </li>
          <li>
            <strong>Virtual machines &amp; sandboxes:</strong> Executing inside virtual machines (Hyper-V, VMware, VirtualBox), Docker containers, or emulators is blocked by kernel-level hardware integrity verification.
          </li>
          <li>
            <strong>Network, IP &amp; MAC spoofing:</strong> Changing IP addresses, cycling VPN tunnels, or spoofing network MAC addresses has zero effect, as verification is bound to physical CPU and motherboard silicon rather than networking layers.
          </li>
          <li>
            <strong>Binary tampering &amp; memory injection:</strong> Attempting to reverse-engineer, inject DLLs, hook system calls, or patch Downex binaries triggers immediate, irreversible hardware blacklist propagation across the ecosystem.
          </li>
        </ul>
        <p>
          <strong>Appeals and inquiries.</strong> Hardware bans are permanent and enforced automatically. If you believe your machine was sanctioned in error, you may submit an appeal to the administrator with your complete Hardware ID at{" "}
          <a
            href="mailto:hello@gauravpatil.site"
            className="font-medium underline underline-offset-3 hover:text-black dark:hover:text-white"
          >
            hello@gauravpatil.site
          </a>.
        </p>
      </section>

      {/* 5. Software License & Updates */}
      <section id="license" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          5. Software License &amp; Updates
        </h2>
        <p>
          <strong>License grant.</strong> Subject to these Terms, Downex grants you a personal, non-exclusive, non-transferable, revocable license to install and execute the software on compatible Windows workstations.
        </p>
        <p>
          <strong>Dynamic software updates.</strong> To ensure stability and security, Downex includes an autonomous update daemon that periodically checks for signed release manifests. When an update is verified, it stages and applies binary updates during continuous system idle without disrupting active user work.
        </p>
      </section>

      {/* 6. Disclaimers */}
      <section id="disclaimers" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          6. Disclaimers &amp; Warranties
        </h2>
        <p>
          Our Services are provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. To the maximum extent permitted by law, Downex and its developer disclaim all warranties, express, implied, or statutory, including warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee that the software will be error-free, uninterrupted, or compatible with all third-party network configurations.
        </p>
      </section>

      {/* 7. Limitation of Liability */}
      <section id="liability" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          7. Limitation of Liability
        </h2>
        <p>
          To the maximum extent permitted by law, neither Downex nor its developer shall be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of data, bandwidth, profits, or hardware availability arising from your use or inability to use the software.
        </p>
      </section>

      {/* 8. General Terms */}
      <section id="contact" tabIndex={-1} className="space-y-4 pt-4 scroll-mt-20 outline-none target:ring-2 target:ring-emerald-500/40 target:bg-emerald-500/5 target:rounded-lg p-3 -m-3 transition-all duration-500 relative">
        <span id="general" className="absolute -top-20 block h-0 w-0 opacity-0 pointer-events-none" />
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          8. General Terms
        </h2>
        <p>
          <strong>Amendments.</strong> We may update these Terms from time to time. Updated versions will be published on this page with an updated effective date. Continued use of Downex following published updates constitutes acceptance of the revised Terms.
        </p>
        <p>
          <strong>Contact.</strong> If you have any questions or inquiries regarding these Terms of Use, please contact us at{" "}
          <a
            href="mailto:hello@gauravpatil.site"
            className="font-medium underline underline-offset-3 hover:text-black dark:hover:text-white"
          >
            hello@gauravpatil.site
          </a>.
        </p>
      </section>
    </DownexLegalLayout>
  );
}
