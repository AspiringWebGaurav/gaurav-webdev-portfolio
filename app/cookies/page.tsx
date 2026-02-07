export const metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for Gaurav Patil Portfolio - Learn about how we use cookies and browser storage",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-black-100 py-20">
      <div className="max-w-4xl mx-auto px-5">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Cookie Policy
        </h1>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-white-200 mb-6">
            <strong>Effective Date:</strong> January 9, 2026<br />
            <strong>Last Updated:</strong> January 9, 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. What Are Cookies?</h2>
            <p className="text-white-200 mb-4">
              Cookies are small text files stored on your device when you visit websites. They help websites remember your preferences, authenticate sessions, and improve user experience.
            </p>
            <p className="text-white-200">
              This Website also uses other browser storage technologies including LocalStorage, SessionStorage, and IndexedDB for similar purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Cookies and Storage</h2>
            <p className="text-white-200 mb-4">
              We use cookies and browser storage for the following purposes:
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">2.1 Essential Cookies (Always Active)</h3>
            <p className="text-white-200 mb-4">
              These are necessary for the Website to function and cannot be disabled:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Authentication:</strong> Firebase session tokens for admin login</li>
              <li><strong>Security:</strong> CSRF protection, rate limiting counters</li>
              <li><strong>Session Management:</strong> Chat session IDs, visitor tracking</li>
              <li><strong>Device Fingerprinting:</strong> UUID-sync for visitor identification</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">2.2 Functional Cookies</h3>
            <p className="text-white-200 mb-4">
              These enhance functionality and personalization:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Theme Preferences:</strong> Dark mode settings</li>
              <li><strong>Chat History:</strong> LocalStorage for anonymous chat messages</li>
              <li><strong>Form Data:</strong> Temporary storage of draft messages</li>
              <li><strong>Scroll Position:</strong> Remembering page positions</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">2.3 Analytics Cookies</h3>
            <p className="text-white-200 mb-4">
              These help us understand how visitors use the Website:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Visitor Analytics:</strong> Page views, session duration, bounce rate</li>
              <li><strong>Performance Monitoring:</strong> Vercel Analytics for Web Vitals</li>
              <li><strong>Error Tracking:</strong> Crash reports stored in IndexedDB</li>
              <li><strong>Usage Patterns:</strong> Feature adoption, click tracking</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">2.4 Security Cookies</h3>
            <p className="text-white-200 mb-4">
              These protect against abuse and security threats:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Ban Detection:</strong> Checking visitor ban status</li>
              <li><strong>Spam Prevention:</strong> Rate limit counters, submission history</li>
              <li><strong>Bot Detection:</strong> Cloudflare Turnstile verification</li>
              <li><strong>Maintenance Mode:</strong> Bypass tokens for authorized users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Browser Storage Technologies</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">3.1 LocalStorage</h3>
            <p className="text-white-200 mb-4">
              We use LocalStorage to store:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Device fingerprint and visitor UUID</li>
              <li>Chat session data</li>
              <li>User preferences (theme, settings)</li>
              <li>Analytics event queue (for offline support)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">3.2 SessionStorage</h3>
            <p className="text-white-200 mb-4">
              Temporary storage cleared when you close your browser:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Temporary form data</li>
              <li>Navigation state</li>
              <li>Current session information</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">3.3 IndexedDB</h3>
            <p className="text-white-200 mb-4">
              Large structured data storage for:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Crash reports and error logs</li>
              <li>Offline data synchronization</li>
              <li>Performance metrics</li>
              <li>Analytics event batching</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Cookies</h2>
            <p className="text-white-200 mb-4">
              We use services that may set their own cookies:
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">4.1 Firebase (Google)</h3>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Authentication cookies for login sessions</li>
              <li>Firestore connection tokens</li>
              <li>Privacy Policy: <a href="https://firebase.google.com/support/privacy" className="text-purple underline" target="_blank" rel="noopener noreferrer">Firebase Privacy</a></li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">4.2 Vercel</h3>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Deployment and hosting cookies</li>
              <li>Analytics and performance monitoring</li>
              <li>Privacy Policy: <a href="https://vercel.com/legal/privacy-policy" className="text-purple underline" target="_blank" rel="noopener noreferrer">Vercel Privacy</a></li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">4.3 Cloudflare Turnstile</h3>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Bot detection and verification</li>
              <li>Spam prevention cookies</li>
              <li>Privacy Policy: <a href="https://www.cloudflare.com/privacypolicy/" className="text-purple underline" target="_blank" rel="noopener noreferrer">Cloudflare Privacy</a></li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Cookie Duration</h2>
            <p className="text-white-200 mb-4">
              Different cookies have different lifespans:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain for a set period (e.g., 30 days for chat sessions)</li>
              <li><strong>Authentication Tokens:</strong> Valid until logout or expiration</li>
              <li><strong>Analytics Data:</strong> Retained as per our Privacy Policy</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Managing Cookies</h2>
            
            <h3 className="text-xl font-semibold text-white mb-3">6.1 Browser Settings</h3>
            <p className="text-white-200 mb-4">
              You can control cookies through your browser settings:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
              <li><strong>Firefox:</strong> Preferences → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">6.2 Clear Storage</h3>
            <p className="text-white-200 mb-4">
              To clear all stored data:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Open browser DevTools (F12)</li>
              <li>Go to Application/Storage tab</li>
              <li>Clear LocalStorage, SessionStorage, IndexedDB</li>
              <li>Clear cookies for www.gauravpatil.online</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">6.3 Impact of Disabling Cookies</h3>
            <p className="text-white-200 mb-4">
              If you disable cookies:
            </p>
            <ul className="list-disc list-inside text-white-200 mb-4 space-y-2">
              <li>Chat functionality may not work properly</li>
              <li>Admin login will not function</li>
              <li>Preferences will not be saved</li>
              <li>Some security features may be limited</li>
              <li>Analytics will not track your visit</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Do Not Track (DNT)</h2>
            <p className="text-white-200">
              We respect Do Not Track signals. When DNT is enabled in your browser, we will not use non-essential tracking technologies. However, essential cookies required for Website functionality will still be used.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Updates to Cookie Policy</h2>
            <p className="text-white-200">
              We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated date. Please review this policy periodically.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact Us</h2>
            <p className="text-white-200 mb-4">
              For questions about our use of cookies:
            </p>
            <ul className="list-none text-white-200 space-y-2">
              <li><strong>Website:</strong> <a href="https://www.gauravpatil.online" className="text-purple underline">www.gauravpatil.online</a></li>
              <li><strong>Contact Form:</strong> <a href="https://www.gauravpatil.online/contact" className="text-purple underline">www.gauravpatil.online/contact</a></li>
              <li><strong>Privacy Policy:</strong> <a href="/privacy" className="text-purple underline">View Privacy Policy</a></li>
            </ul>
          </section>

          <div className="mt-12 pt-8 border-t border-white-200/20">
            <p className="text-white-200 text-sm">
              This cookie policy is designed to provide transparency about our data practices and comply with GDPR, CCPA, and other applicable regulations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
