"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateVisitorId } from '@/lib/deviceFingerprint';
import { showToast } from '@/lib/toast';
import type { CodeVerificationResponse } from '@/types/codeGate';

export default function CodeGatePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [visitorId, setVisitorId] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    // Generate visitor ID on mount
    const id = generateVisitorId();
    setVisitorId(id);

    // Check if already has access
    checkExistingAccess(id);
  }, []);

  const checkExistingAccess = async (id: string) => {
    try {
      const response = await fetch('/api/code-gate/session', {
        headers: {
          'x-visitor-id': id
        }
      });

      const data = await response.json();

      if (data.banned) {
        router.push('/banned');
        return;
      }

      if (data.hasAccess) {
        // Already has clearance, redirect to login
        sessionStorage.setItem('code_gate_cleared', 'true');
        sessionStorage.setItem('code_gate_timestamp', Date.now().toString());
        window.location.href = '/admin/login';
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      showToast.error('Please enter a code', 'Code Required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/code-gate/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code.trim(),
          visitorId
        })
      });

      const data: CodeVerificationResponse = await response.json();

      if (data.success) {
        showToast.success('Access granted! Redirecting...', 'Success');
        // Store clearance in sessionStorage to prevent redirect loop
        sessionStorage.setItem('code_gate_cleared', 'true');
        sessionStorage.setItem('code_gate_timestamp', Date.now().toString());
        // Wait for database write and use hard navigation
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
      } else if (data.banned) {
        showToast.error(data.message, 'Access Denied');
        setTimeout(() => {
          router.push('/banned');
        }, 1500);
      } else {
        showToast.error(data.message, 'Incorrect Code');
        setAttemptsRemaining(data.attemptsRemaining || null);
        setCode('');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showToast.error('Verification failed. Please try again.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-purple-500/20 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-purple-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Restricted Access
            </h1>
            <p className="text-purple-200">
              Enter the secret code to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-purple-200 mb-2">
                Secret Code
              </label>
              <input
                id="code"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter code..."
                autoComplete="off"
                autoFocus
              />
            </div>

            {attemptsRemaining !== null && (
              <div className={`p-3 rounded-lg ${
                attemptsRemaining <= 1 
                  ? 'bg-red-500/20 border border-red-500/50' 
                  : 'bg-yellow-500/20 border border-yellow-500/50'
              }`}>
                <p className={`text-sm font-medium ${
                  attemptsRemaining <= 1 ? 'text-red-200' : 'text-yellow-200'
                }`}>
                  {attemptsRemaining === 1 
                    ? '⚠️ Last attempt remaining!'
                    : `${attemptsRemaining} attempts remaining`}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Submit'
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-purple-300 text-center">
              This area is protected. Unauthorized access attempts are logged and may result in a permanent ban.
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-purple-300/70">
            Don't have access? This area is private.
          </p>
        </div>
      </div>
    </div>
  );
}
