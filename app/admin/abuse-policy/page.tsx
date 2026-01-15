"use client";

/**
 * ABUSE POLICY DOCUMENTATION
 * 
 * Explains the temporary ban policy for repeated failed login attempts.
 */

import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { ShieldAlert, ArrowLeft, AlertTriangle, Clock, CheckCircle, FileText } from 'lucide-react';

export default function AbusePolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ShieldAlert className="w-12 h-12 text-orange-500" />
            <h1 className="text-4xl font-bold text-white">Abuse Policy</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Protecting our systems from unauthorized access attempts
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl mb-8">
          {/* Overview */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              Policy Overview
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Our Abuse Policy is a security measure designed to protect the admin panel from brute-force attacks 
              and unauthorized access attempts. This policy automatically activates when suspicious login behavior is detected.
            </p>
          </section>

          {/* Trigger Conditions */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              What Triggers the Abuse Policy?
            </h2>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
              <p className="text-orange-300 font-semibold mb-3">
                The Abuse Policy activates after:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span><strong className="text-white">3 consecutive failed login attempts</strong> using incorrect credentials</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Attempts must be consecutive (a successful login resets the counter)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 mt-1">•</span>
                  <span>Both password and Google OAuth failed attempts count toward the limit</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Consequences */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-400" />
              What Happens When Activated?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-5">
                <h3 className="text-white font-semibold mb-2">Temporary Ban</h3>
                <p className="text-gray-300 text-sm">
                  A <strong className="text-blue-400">2-minute temporary ban</strong> is automatically applied to prevent further login attempts.
                </p>
              </div>
              <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-5">
                <h3 className="text-white font-semibold mb-2">Access Blocked</h3>
                <p className="text-gray-300 text-sm">
                  All authentication attempts are blocked during the ban period, regardless of credentials.
                </p>
              </div>
              <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-5">
                <h3 className="text-white font-semibold mb-2">Live Countdown</h3>
                <p className="text-gray-300 text-sm">
                  A countdown timer displays the exact remaining time until access is restored.
                </p>
              </div>
              <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-5">
                <h3 className="text-white font-semibold mb-2">Automatic Restoration</h3>
                <p className="text-gray-300 text-sm">
                  Access is automatically restored when the countdown reaches zero—no manual intervention needed.
                </p>
              </div>
            </div>
          </section>

          {/* Important Notes */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Important Information
            </h2>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong className="text-white">No Permanent Bans:</strong> This policy only applies temporary restrictions. There are no permanent bans in this version.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong className="text-white">Persists Across Sessions:</strong> The ban timer persists even if you reload the page, switch tabs, or access the site from different devices.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong className="text-white">Accurate Countdown:</strong> The countdown is synchronized with server time and cannot be manipulated.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span><strong className="text-white">Automatic Reset:</strong> Successfully logging in resets the failed attempt counter to zero.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Security Rationale */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Why This Policy Exists</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              The Abuse Policy is a critical security measure that protects the admin panel from:
            </p>
            <ul className="space-y-2 text-gray-300 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span><strong className="text-white">Brute-force attacks:</strong> Automated scripts attempting thousands of password combinations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span><strong className="text-white">Credential stuffing:</strong> Using leaked credentials from other breaches</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span><strong className="text-white">Unauthorized access:</strong> Malicious actors trying to gain admin privileges</span>
              </li>
            </ul>
            <p className="text-gray-300 leading-relaxed">
              By temporarily blocking access after multiple failed attempts, we ensure the security and integrity 
              of the system while minimizing inconvenience to legitimate users.
            </p>
          </section>

          {/* Contact Support */}
          <section className="border-t border-gray-700 pt-6">
            <h2 className="text-xl font-bold text-white mb-3">Need Assistance?</h2>
            <p className="text-gray-300 mb-4">
              If you believe you've been incorrectly restricted or need help with login issues, please contact support:
            </p>
            <a
              href="mailto:gauravpatil9262@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all"
            >
              Contact Support
            </a>
          </section>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white rounded-lg font-medium transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Last updated: January 15, 2026
          </p>
        </div>
      </div>
    </div>
  );
}
