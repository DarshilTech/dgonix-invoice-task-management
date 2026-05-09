'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLogo } from '@/components/layout/AppLogo';

type Step = 'email' | 'otp';

export default function ClientLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!resendCooldown) return;
    const t = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const requestOTP = async (emailVal: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/client/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send code');
      } else {
        setStep('otp');
        setResendCooldown(60);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await requestOTP(email.trim());
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) { setError('Please enter the full 6-digit code'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/client/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed');
      } else {
        router.replace('/client/dashboard');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="overflow-hidden rounded-2xl shadow-2xl">

          {/* Dark header with logo */}
          <div className="flex flex-col items-center justify-center bg-sidebar px-8 py-4">
            <AppLogo className="h-24 w-auto max-w-[280px] object-contain" priority />
          </div>

          {/* Subtitle strip */}
          <div className="bg-gray-50 px-8 py-3 text-center text-sm text-gray-500 border-b border-gray-100">
            {step === 'email'
              ? 'Access your invoices and payment history'
              : `We sent a 6-digit code to ${email}`}
          </div>

          {/* White form body */}
          <div className="bg-white px-8 py-8">
            {step === 'email' ? (
              <>
                <h1 className="mb-7 text-center text-2xl font-bold text-gray-900">Client Portal</h1>

                {error && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-600">
                      <EnvelopeIcon />
                      <span>Email Address</span>
                    </div>
                    <input
                      type="email"
                      name="email"
                      className="auth-input"
                      placeholder="you@yourcompany.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      autoComplete="email"
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? 'Sending code…' : 'Send Login Code'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h1 className="mb-7 text-center text-2xl font-bold text-gray-900">Enter your code</h1>

                {error && (
                  <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                  {/* OTP boxes */}
                  <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        name={`otp[${i}]`}
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="h-14 w-11 rounded-lg border border-gray-300 bg-white text-center text-xl font-bold text-gray-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                      />
                    ))}
                  </div>

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading || otp.join('').length !== 6}
                      className="w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? 'Verifying…' : 'Verify & Sign In'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError(''); }}
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      className="font-medium text-primary-600 hover:text-primary-700 disabled:text-gray-400"
                      onClick={() => { setOtp(['', '', '', '', '', '']); requestOTP(email); }}
                      disabled={resendCooldown > 0 || isLoading}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-gray-500">
          Admin?{' '}
          <a href="/login" className="font-medium text-primary-600 hover:text-primary-700 underline underline-offset-2">
            Sign in here
          </a>
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
