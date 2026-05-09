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

  // Countdown timer for resend
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
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <AppLogo className="mx-auto h-16 w-auto max-w-[270px] object-contain" priority />
          <h1 className="mt-5 text-2xl font-bold text-gray-900">Invoice Portal</h1>
          <p className="mt-1 text-sm text-gray-500">Access your invoices and payment history</p>
        </div>

        <div className="card">
          {step === 'email' ? (
            <>
              <div className="card-header">
                <h2 className="font-semibold">Sign in</h2>
                <p className="mt-1 text-sm text-gray-500">Enter your email to receive a login code</p>
              </div>
              <form onSubmit={handleEmailSubmit} className="card-body space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    className="input"
                    placeholder="you@yourcompany.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
                  {isLoading ? 'Sending code...' : 'Send Login Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="card-header">
                <h2 className="font-semibold">Enter your code</h2>
                <p className="mt-1 text-sm text-gray-500">
                  We sent a 6-digit code to <span className="font-medium text-gray-800">{email}</span>
                </p>
              </div>
              <form onSubmit={handleVerify} className="card-body space-y-6">
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* OTP boxes */}
                <div className="flex justify-center gap-3" onPaste={handleOtpPaste}>
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
                      className="h-14 w-12 rounded-lg border border-gray-300 bg-white text-center text-xl font-bold text-gray-900 shadow-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10"
                    />
                  ))}
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={isLoading || otp.join('').length !== 6}>
                  {isLoading ? 'Verifying...' : 'Verify & Sign In'}
                </button>

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
                    className="text-gray-700 font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
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

        <p className="mt-6 text-center text-xs text-gray-400">
          Admin?{' '}
          <a href="/login" className="text-gray-600 underline">Sign in here</a>
        </p>
      </div>
    </div>
  );
}
