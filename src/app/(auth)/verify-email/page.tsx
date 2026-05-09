'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppLogo } from '@/components/layout/AppLogo';

type Status = 'loading' | 'success' | 'expired' | 'invalid' | 'error';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    // New-style links: /verify-email?token=xxx  → POST to API
    const token = searchParams.get('token');
    // Old-style links (redirected from GET route): /verify-email?status=xxx
    const preStatus = searchParams.get('status') as Status | null;

    if (preStatus && ['success', 'expired', 'invalid', 'error'].includes(preStatus)) {
      setStatus(preStatus);
      return;
    }

    if (!token) {
      router.replace('/login');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
        } else if (data.error?.toLowerCase().includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => setStatus('error'));
  }, [searchParams, router]);

  const config: Record<Status, {
    icon: React.ReactNode;
    iconRing: string;
    title: string;
    titleColor: string;
    message: string;
  }> = {
    loading: {
      icon: (
        <svg className="h-7 w-7 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      ),
      iconRing: 'bg-gray-100',
      title: 'Verifying your email…',
      titleColor: 'text-gray-600',
      message: 'Please wait while we confirm your email address.',
    },
    success: {
      icon: <span className="text-2xl font-bold text-green-600">✓</span>,
      iconRing: 'bg-green-100',
      title: 'Email Verified!',
      titleColor: 'text-gray-900',
      message: 'Your email address has been confirmed. You can now log in to your account.',
    },
    expired: {
      icon: <span className="text-2xl text-amber-600">⏱</span>,
      iconRing: 'bg-amber-100',
      title: 'Link Expired',
      titleColor: 'text-amber-700',
      message: 'This verification link has expired. Please request a new one from your dashboard.',
    },
    invalid: {
      icon: <span className="text-2xl font-bold text-red-500">✕</span>,
      iconRing: 'bg-red-100',
      title: 'Invalid Link',
      titleColor: 'text-red-700',
      message: 'This verification link is invalid or has already been used.',
    },
    error: {
      icon: <span className="text-2xl font-bold text-red-500">!</span>,
      iconRing: 'bg-red-100',
      title: 'Something Went Wrong',
      titleColor: 'text-red-700',
      message: 'An error occurred during verification. Please try again.',
    },
  };

  const c = config[status];

  return (
    <div className="overflow-hidden rounded-2xl shadow-2xl">
      {/* Dark header with branding */}
      <div className="flex flex-col items-center justify-center bg-sidebar px-8 py-4">
        <AppLogo className="h-24 w-auto max-w-[280px] object-contain" priority />
      </div>

      {/* Subtitle strip */}
      <div className="bg-gray-50 px-8 py-3 text-center text-sm text-gray-500 border-b border-gray-100">
        Email verification for your Invoxa account
      </div>

      {/* White body */}
      <div className="bg-white px-8 py-10 text-center">
        {/* Icon */}
        <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${c.iconRing}`}>
          {c.icon}
        </div>

        <h1 className={`mb-3 text-2xl font-bold ${c.titleColor}`}>{c.title}</h1>
        <p className="mb-8 text-sm text-gray-500 leading-relaxed">{c.message}</p>

        {status !== 'loading' && (
          <Link
            href="/login"
            className="inline-block w-full rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            {status === 'success' ? 'Go to Login' : 'Back to Login'}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
