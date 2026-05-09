'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type Company = { _id: string; name: string };

const CLASSIFICATIONS = [
  { value: '', label: '— select —' },
  { value: 'Company', label: 'Company' },
  { value: 'Individual', label: 'Individual' },
  { value: 'Government', label: 'Government' },
  { value: 'Other', label: 'Other' },
];

const emptyForm = {
  companyId: '',
  name: '', number: '', group: '', idNumber: '', vatNumber: '',
  website: '', phone: '', routingId: '',
  validVatNumber: false, taxExempt: false, classification: '',
  firstName: '', lastName: '', email: '', contactPhone: '',
  addToInvoices: true, ccOnly: false,
  billingStreet: '', billingApt: '', billingCity: '',
  billingState: '', billingPostalCode: '', billingCountry: '',
  shippingStreet: '', shippingApt: '', shippingCity: '',
  shippingState: '', shippingPostalCode: '', shippingCountry: '',
};

type FieldErrors = Partial<Record<keyof typeof emptyForm, string>>;

function validate(form: typeof emptyForm): FieldErrors {
  const errs: FieldErrors = {};
  if (!form.name.trim()) errs.name = 'Required';
  if (!form.email.trim()) {
    errs.email = 'Required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errs.email = 'Enter a valid email address';
  }
  return errs;
}

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="w-36 shrink-0 pt-1.5 text-sm text-gray-500">{label}</span>
      <div className="flex-1 min-w-0">
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export default function CreateClientPage() {
  useDocumentTitle('New Client');
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [addressTab, setAddressTab] = useState<'billing' | 'shipping'>('billing');

  useEffect(() => {
    fetch('/api/companies', { credentials: 'include' }).then(r => r.json()).then(data => {
      if (data.success) {
        setCompanies(data.data || []);
        setForm(p => ({ ...p, companyId: data.data?.[0]?._id || '' }));
      }
    });
  }, []);

  const set = (k: keyof typeof emptyForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [k]: e.target.value }));
      if (fieldErrors[k]) setFieldErrors(p => ({ ...p, [k]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setIsSaving(true); setError('');
    const res = await fetch('/api/clients', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tenantId: form.companyId }),
    });
    const data = await res.json();
    setIsSaving(false);
    if (res.ok) router.push('/admin/clients');
    else setError(data.error || 'Failed to create client');
  };

  const copyBilling = () => setForm(p => ({
    ...p,
    shippingStreet: p.billingStreet, shippingApt: p.billingApt,
    shippingCity: p.billingCity, shippingState: p.billingState,
    shippingPostalCode: p.billingPostalCode, shippingCountry: p.billingCountry,
  }));

  const inp = (err?: string) =>
    `w-full rounded-md border ${err ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-primary-400 focus:ring-primary-300'} bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1`;

  const companyOptions = [
    { value: '', label: '— select —' },
    ...companies.map(c => ({ value: c._id, label: c.name })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-0 py-6">
      <PageHeader
        title="New Client"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard', home: true },
          { label: 'Clients', href: '/admin/clients' },
          { label: 'New Client' },
        ]}
        actions={
          <>
            <button type="button" onClick={() => router.back()}
              className="h-9 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="h-9 rounded-md bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60">
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      />

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">

        {/* ── Company Details ── */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-800">Company Details</h2>
          </div>
          <div className="px-5 py-2">
            {companies.length > 1 && (
              <Field label="Company">
                <Select
                  options={companyOptions}
                  value={form.companyId}
                  onChange={v => setForm(p => ({ ...p, companyId: v }))}
                />
              </Field>
            )}
            <Field label="Name *" error={fieldErrors.name}>
              <input name="name" className={inp(fieldErrors.name)} value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Number"><input name="number" className={inp()} value={form.number} onChange={set('number')} /></Field>
            <Field label="Group"><input name="group" className={inp()} value={form.group} onChange={set('group')} /></Field>
            <Field label="ID Number"><input name="idNumber" className={inp()} value={form.idNumber} onChange={set('idNumber')} /></Field>
            <Field label="VAT Number"><input name="vatNumber" className={inp()} value={form.vatNumber} onChange={set('vatNumber')} /></Field>
            <Field label="Website"><input name="website" className={inp()} value={form.website} onChange={set('website')} placeholder="https://" /></Field>
            <Field label="Phone"><input name="phone" className={inp()} value={form.phone} onChange={set('phone')} /></Field>
            <Field label="Routing ID"><input name="routingId" className={inp()} value={form.routingId} onChange={set('routingId')} /></Field>
            <Field label="Valid VAT Number">
              <Switch checked={form.validVatNumber} onChange={v => setForm(p => ({ ...p, validVatNumber: v }))} />
            </Field>
            <Field label="Tax Exempt">
              <Switch checked={form.taxExempt} onChange={v => setForm(p => ({ ...p, taxExempt: v }))} />
            </Field>
            <Field label="Classification">
              <Select
                options={CLASSIFICATIONS}
                value={form.classification}
                onChange={v => setForm(p => ({ ...p, classification: v }))}
              />
            </Field>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* Contacts */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-800">Contacts</h2>
              <span className="text-xs text-gray-400 cursor-not-allowed">+ Add contact</span>
            </div>
            <div className="px-5 py-2">
              <Field label="First Name"><input name="firstName" className={inp()} value={form.firstName} onChange={set('firstName')} autoComplete="given-name" /></Field>
              <Field label="Last Name"><input name="lastName" className={inp()} value={form.lastName} onChange={set('lastName')} autoComplete="family-name" /></Field>
              <Field label="Email *" error={fieldErrors.email}>
                <input name="email" className={inp(fieldErrors.email)} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
              </Field>
              <Field label="Phone"><input name="contactPhone" className={inp()} value={form.contactPhone} onChange={set('contactPhone')} /></Field>
              <Field label="Add to Invoices">
                <Switch checked={form.addToInvoices} onChange={v => setForm(p => ({ ...p, addToInvoices: v }))} />
              </Field>
              <Field label="CC Only">
                <Switch checked={form.ccOnly} onChange={v => setForm(p => ({ ...p, ccOnly: v }))} />
              </Field>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-800">Address</h2>
            </div>
            <div className="flex border-b border-gray-100">
              {(['billing', 'shipping'] as const).map(tab => (
                <button key={tab} type="button" onClick={() => setAddressTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${addressTab === tab ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {tab === 'billing' ? 'Billing Address' : 'Shipping Address'}
                </button>
              ))}
            </div>
            <div className="px-5 py-2">
              {addressTab === 'billing' ? (
                <>
                  <Field label="Street"><input name="billingStreet" className={inp()} value={form.billingStreet} onChange={set('billingStreet')} /></Field>
                  <Field label="Apt/Suite"><input name="billingApt" className={inp()} value={form.billingApt} onChange={set('billingApt')} /></Field>
                  <Field label="City"><input name="billingCity" className={inp()} value={form.billingCity} onChange={set('billingCity')} /></Field>
                  <Field label="State/Province"><input name="billingState" className={inp()} value={form.billingState} onChange={set('billingState')} /></Field>
                  <Field label="Postal Code"><input name="billingPostalCode" className={inp()} value={form.billingPostalCode} onChange={set('billingPostalCode')} /></Field>
                  <Field label="Country">
                    <input name="billingCountry" className={inp()} value={form.billingCountry} onChange={set('billingCountry')} placeholder="e.g. United States" />
                  </Field>
                </>
              ) : (
                <>
                  <div className="py-2">
                    <button type="button" onClick={copyBilling}
                      className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
                      Copy Billing
                    </button>
                  </div>
                  <Field label="Street"><input name="shippingStreet" className={inp()} value={form.shippingStreet} onChange={set('shippingStreet')} /></Field>
                  <Field label="Apt/Suite"><input name="shippingApt" className={inp()} value={form.shippingApt} onChange={set('shippingApt')} /></Field>
                  <Field label="City"><input name="shippingCity" className={inp()} value={form.shippingCity} onChange={set('shippingCity')} /></Field>
                  <Field label="State/Province"><input name="shippingState" className={inp()} value={form.shippingState} onChange={set('shippingState')} /></Field>
                  <Field label="Postal Code"><input name="shippingPostalCode" className={inp()} value={form.shippingPostalCode} onChange={set('shippingPostalCode')} /></Field>
                  <Field label="Country"><input name="shippingCountry" className={inp()} value={form.shippingCountry} onChange={set('shippingCountry')} /></Field>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
