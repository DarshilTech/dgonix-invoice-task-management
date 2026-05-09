'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ar', label: 'Arabic' },
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)' },
  { value: 'AED', label: 'UAE Dirham (AED)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
];

type Step = 1 | 2;

export function OnboardingModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showOnboarding = searchParams.get('onboarding') === 'true';

  const [step, setStep] = useState<Step>(1);
  const [isOpen, setIsOpen] = useState(showOnboarding);

  // Step 1 state
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [step1Error, setStep1Error] = useState('');
  const [step1Loading, setStep1Loading] = useState(false);

  // Step 2 state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [step2Loading, setStep2Loading] = useState(false);
  const [step2Error, setStep2Error] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsOpen(showOnboarding);
  }, [showOnboarding]);

  const handleSubdomainChange = useCallback((value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSubdomain(sanitized);
    setSubdomainStatus('idle');

    if (checkTimeout.current) clearTimeout(checkTimeout.current);
    if (sanitized.length < 3) return;

    setSubdomainStatus('checking');
    checkTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/check-subdomain?subdomain=${sanitized}`);
        const data = await res.json();
        setSubdomainStatus(data.available ? 'available' : 'taken');
      } catch {
        setSubdomainStatus('idle');
      }
    }, 500);
  }, []);

  const handleStep1Submit = async () => {
    setStep1Error('');
    if (!companyName.trim()) { setStep1Error('Company name is required'); return; }
    if (subdomain.length < 3) { setStep1Error('Subdomain must be at least 3 characters'); return; }
    if (subdomainStatus === 'taken') { setStep1Error('Subdomain is already taken'); return; }

    setStep1Loading(true);
    try {
      const res = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, subdomain, language, currency }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) { setStep1Error(data.error || 'Setup failed'); return; }
      // Notify sidebar to show company name immediately
      window.dispatchEvent(new CustomEvent('company-updated'));
      setStep(2);
    } catch {
      setStep1Error('An error occurred. Please try again.');
    } finally {
      setStep1Loading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setStep2Error('Please upload a PNG, JPG, or SVG file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStep2Error('File too large. Maximum 5 MB.');
      return;
    }
    setStep2Error('');
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleStep2Submit = async () => {
    setStep2Loading(true);
    try {
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        const res = await fetch('/api/onboarding/logo', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json();
          setStep2Error(data.error || 'Logo upload failed');
          return;
        }
      }
      // Notify sidebar to refresh company data immediately (no page reload needed)
      window.dispatchEvent(new CustomEvent('company-updated'));
      // Close modal and remove onboarding query param
      router.replace('/admin/dashboard');
    } catch {
      setStep2Error('An error occurred. Please try again.');
    } finally {
      setStep2Loading(false);
    }
  };

  const handleClose = () => {
    router.replace('/admin/dashboard');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          {step === 1 ? (
            <>
              <h2 className="mb-5 text-lg font-semibold text-gray-900">Welcome to Invoxa</h2>

              {step1Error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {step1Error}
                </div>
              )}

              <div className="space-y-4">
                {/* Company Name */}
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Company Name</label>
                  <input
                    type="text"
                    className="input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>

                {/* Subdomain */}
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Subdomain</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`input pr-24 ${subdomainStatus === 'taken' ? 'border-red-400 focus:ring-red-300' : subdomainStatus === 'available' ? 'border-green-400 focus:ring-green-300' : ''}`}
                      value={subdomain}
                      onChange={(e) => handleSubdomainChange(e.target.value)}
                      placeholder="acme-corp"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-xs">
                      {subdomainStatus === 'checking' && <span className="text-gray-400">Checking…</span>}
                      {subdomainStatus === 'available' && <span className="text-green-600 font-medium">Available ✓</span>}
                      {subdomainStatus === 'taken' && <span className="text-red-600 font-medium">Taken ✗</span>}
                    </span>
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Language</label>
                  <div className="relative">
                    <select
                      className="input appearance-none"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="mb-1 block text-sm text-gray-600">Currency</label>
                  <div className="relative">
                    <select
                      className="input appearance-none"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleStep1Submit}
                  disabled={step1Loading || subdomainStatus === 'taken' || subdomainStatus === 'checking'}
                  className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {step1Loading ? 'Saving…' : 'Next'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="mb-5 text-lg font-semibold text-gray-900">Upload Your Company Logo</h2>

              {step2Error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {step2Error}
                </div>
              )}

              {/* Drop zone */}
              <div
                className="relative mb-4 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-primary-400 hover:bg-primary-50"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    width={160}
                    height={80}
                    className="max-h-32 w-auto object-contain"
                    unoptimized
                  />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="mb-3 h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <p className="text-sm text-gray-500">Drop files or click to upload</p>
                    <p className="mt-1 text-xs text-gray-400">PNG, JPG, SVG — max 5 MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                />
              </div>

              {logoPreview && (
                <button
                  type="button"
                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                  className="mb-4 flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove logo
                </button>
              )}

              <button
                onClick={handleStep2Submit}
                disabled={step2Loading}
                className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {step2Loading ? 'Finishing…' : 'Next'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
