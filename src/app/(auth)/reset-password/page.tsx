'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLogo } from '@/components/layout/AppLogo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function ResetPasswordPage() {
  useDocumentTitle('Reset Password');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Request failed'); return; }
      setMessage('Password reset link has been sent to your email.');
      setEmail('');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl shadow-2xl">
      {/* Dark header with branding */}
      <div className="flex flex-col items-center justify-center bg-sidebar px-8 py-4">
        <AppLogo className="h-24 w-auto max-w-[280px] object-contain" priority />
      </div>

      {/* Subtitle strip */}
      <div className="bg-gray-50 px-8 py-3 text-center text-sm text-gray-500 border-b border-gray-100">
        No worries! We&apos;ll send you reset instructions.
      </div>

      {/* White form body */}
      <div className="bg-white px-8 py-8">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Reset Password</h1>
        <p className="mb-7 text-center text-sm text-gray-500">Enter your email to receive a reset link</p>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-600">
              <EnvelopeIcon />
              <span>Email Address</span>
            </div>
            <input
              type="email"
              name="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700 underline underline-offset-2">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}

function EnvelopeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
