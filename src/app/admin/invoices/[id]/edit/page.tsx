'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { RichEditor } from '@/components/ui/RichEditor';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type LineItem = {
  service: string;
  description: string;
  rate: number;
  hours: number;
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  status: string;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  taxRate: number;
  discount?: number;
  discountType?: string;
  partial?: number;
  poNumber?: string;
  notes?: string;
  terms?: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  clientId: { _id: string; name: string; email: string } | null;
  companyId: { _id: string; name: string } | null;
};

const NOTE_TABS = ['Public Notes', 'Private Notes', 'Terms', 'Footer'] as const;
type NoteTab = typeof NOTE_TABS[number];

const emptyLine = (): LineItem => ({ service: '', description: '', rate: 0, hours: 1 });

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

function TotalsRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${bold ? 'border-t border-gray-200 mt-1' : 'border-t border-gray-100'}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{value}</span>
    </div>
  );
}

export default function EditInvoicePage() {
  useDocumentTitle('Edit Invoice');
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [noteTab, setNoteTab] = useState<NoteTab>('Public Notes');

  const [form, setForm] = useState({
    invoiceDate:  '',
    dueDate:      '',
    partial:      '',
    poNumber:     '',
    discount:     '',
    discountType: 'Amount',
    taxRate:      0,
    publicNotes:  '',
    privateNotes: '',
    terms:        '',
    footer:       '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([emptyLine()]);

  const totals = useMemo(() => {
    const net      = lineItems.reduce((s, i) => s + i.rate * i.hours, 0);
    const discount = form.discountType === 'Percent'
      ? net * (Number(form.discount) / 100)
      : Number(form.discount) || 0;
    const subtotal  = Math.max(0, net - discount);
    const taxAmount = subtotal * ((form.taxRate || 0) / 100);
    const total     = subtotal + taxAmount;
    return { net, discount, subtotal, taxAmount, total };
  }, [lineItems, form.discount, form.discountType, form.taxRate]);

  useEffect(() => {
    const load = async () => {
      const res  = await fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' });
      const data = await res.json();
      if (!data.success) { setError('Invoice not found'); setIsLoading(false); return; }
      const inv: Invoice = data.data;
      setInvoice(inv);
      setForm({
        invoiceDate:  new Date(inv.invoiceDate).toISOString().split('T')[0],
        dueDate:      new Date(inv.dueDate).toISOString().split('T')[0],
        partial:      String(inv.partial  || ''),
        poNumber:     inv.poNumber     || '',
        discount:     String(inv.discount || ''),
        discountType: inv.discountType || 'Amount',
        taxRate:      inv.taxRate || 0,
        publicNotes:  inv.notes  || '',
        privateNotes: '',
        terms:        inv.terms  || '',
        footer:       '',
      });
      setLineItems(
        inv.lineItems.length > 0
          ? inv.lineItems.map((li) => ({
              service:     li.description,
              description: '',
              rate:        li.unitPrice,
              hours:       li.quantity,
            }))
          : [emptyLine()]
      );
      setIsLoading(false);
    };
    load();
  }, [invoiceId]);

  const sf = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const setLine = (i: number, patch: Partial<LineItem>) =>
    setLineItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));

  const addLine    = () => setLineItems((p) => [...p, emptyLine()]);
  const removeLine = (i: number) => setLineItems((p) => p.filter((_, idx) => idx !== i));

  const noteFieldMap: Record<NoteTab, keyof typeof form> = {
    'Public Notes':  'publicNotes',
    'Private Notes': 'privateNotes',
    'Terms':         'terms',
    'Footer':        'footer',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        invoiceDate:  form.invoiceDate,
        dueDate:      form.dueDate,
        taxRate:      Number(form.taxRate) || 0,
        discount:     Number(form.discount) || 0,
        discountType: form.discountType,
        partial:      Number(form.partial) || 0,
        poNumber:     form.poNumber,
        notes:        form.publicNotes,
        terms:        form.terms,
        lineItems:    lineItems.map((li) => ({
          description: li.service || 'Service',
          quantity:    li.hours,
          unitPrice:   li.rate,
        })),
      }),
    });
    const data = await res.json();
    setIsSaving(false);
    if (!res.ok) { setError(data.error || 'Failed to save invoice'); return; }
    router.push(`/admin/invoices/${invoiceId}`);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse py-6">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <div className="h-8 w-64 rounded-lg bg-gray-200" />
          <div className="h-4 w-44 rounded bg-gray-100" />
        </div>
        {/* Dates card */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 p-5">
            <div className="h-5 w-16 rounded bg-gray-200" />
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-gray-100" />
              <div className="h-9 rounded-md bg-gray-200" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-gray-100" />
              <div className="h-9 rounded-md bg-gray-200" />
            </div>
          </div>
        </div>
        {/* Line items card */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div className="h-5 w-24 rounded bg-gray-200" />
            <div className="h-8 w-20 rounded-md bg-gray-200" />
          </div>
          <div className="space-y-4 p-5">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4">
                <div className="grid gap-3 md:grid-cols-5">
                  <div className="space-y-2 md:col-span-2">
                    <div className="h-4 w-24 rounded bg-gray-100" />
                    <div className="h-9 rounded-md bg-gray-200" />
                  </div>
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-4 w-16 rounded bg-gray-100" />
                      <div className="h-9 rounded-md bg-gray-200" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Notes + Totals */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 p-5">
              <div className="h-5 w-36 rounded bg-gray-200" />
            </div>
            <div className="space-y-4 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 rounded bg-gray-100" />
                  <div className="h-16 rounded-md bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
          <div className="h-fit rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 p-5">
              <div className="h-5 w-16 rounded bg-gray-200" />
            </div>
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-16 rounded bg-gray-100" />
                  <div className="h-4 w-20 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || 'Invoice not found'}
      </div>
    );
  }

  const canEdit = invoice.status === 'draft' && !(invoice as any).paidAmount;

  return (
    <form onSubmit={handleSubmit} className="py-6 space-y-4">

      <PageHeader
        title={`Edit Invoice ${invoice.invoiceNumber}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard', home: true },
          { label: 'Invoices', href: '/admin/invoices' },
          { label: invoice.invoiceNumber },
          { label: 'Edit' },
        ]}
        actions={
          <>
            <button type="button" onClick={() => router.push(`/admin/invoices/${invoiceId}`)}
              className="h-9 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            {canEdit && (
              <button type="submit" disabled={isSaving}
                className="h-9 rounded-md bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-60">
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </>
        }
      />

      {!canEdit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This invoice cannot be edited — it has payments recorded or is no longer in Draft status.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* ── Row 1: Client | Dates | Invoice Details ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Client — locked */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Client</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Locked
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Company</label>
              <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                {invoice.companyId?.name || '—'}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Client</label>
              <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-600">
                {invoice.clientId?.name || '—'}
              </div>
            </div>
            {invoice.clientId?.email && (
              <p className="text-xs text-gray-400">{invoice.clientId.email}</p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Dates</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="w-32 shrink-0 text-sm text-gray-600">Invoice Date</label>
              <input name="invoiceDate" className="input flex-1" type="date" value={form.invoiceDate} onChange={sf('invoiceDate')} required disabled={!canEdit} />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-32 shrink-0 text-sm text-gray-600">Due Date</label>
              <input name="dueDate" className="input flex-1" type="date" value={form.dueDate} onChange={sf('dueDate')} required disabled={!canEdit} />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-32 shrink-0 text-sm text-gray-600">Partial / Deposit</label>
              <input name="partial" className="input flex-1" type="number" min="0" step="0.01" placeholder="0.00"
                value={form.partial} onChange={sf('partial')} disabled={!canEdit} />
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Invoice Details</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="w-24 shrink-0 text-sm text-gray-600">Invoice #</label>
              <div className="input flex-1 bg-gray-50 text-gray-500 select-none">{invoice.invoiceNumber}</div>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-24 shrink-0 text-sm text-gray-600">PO #</label>
              <input name="poNumber" className="input flex-1" value={form.poNumber} onChange={sf('poNumber')} disabled={!canEdit} />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-24 shrink-0 text-sm text-gray-600">Discount</label>
              <select className="input w-24 shrink-0" value={form.discountType} onChange={sf('discountType')} disabled={!canEdit}>
                <option>Amount</option>
                <option>Percent</option>
              </select>
              <input name="discount" className="input flex-1" type="number" min="0" step="0.01" placeholder="0"
                value={form.discount} onChange={sf('discount')} disabled={!canEdit} />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-24 shrink-0 text-sm text-gray-600">Tax Rate %</label>
              <input name="taxRate" className="input flex-1" type="number" min="0" step="0.01" placeholder="0"
                value={form.taxRate} onChange={(e) => setForm((p) => ({ ...p, taxRate: Number(e.target.value) }))} disabled={!canEdit} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Line items ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="hidden grid-cols-[2fr_2fr_1fr_1fr_1fr_40px] gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 md:grid">
          <span>Service</span>
          <span>Description</span>
          <span>Rate</span>
          <span>Hours</span>
          <span className="text-right">Line Total</span>
          <span />
        </div>

        <div className="divide-y divide-gray-50">
          {lineItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-[2fr_2fr_1fr_1fr_1fr_40px] md:items-center">
              <input name={`items[${idx}].service`} className="input" placeholder="Service / Product"
                value={item.service} onChange={(e) => setLine(idx, { service: e.target.value })} disabled={!canEdit} />
              <input name={`items[${idx}].description`} className="input" placeholder="Description (optional)"
                value={item.description} onChange={(e) => setLine(idx, { description: e.target.value })} disabled={!canEdit} />
              <input name={`items[${idx}].unitPrice`} className="input" type="number" min="0" step="0.01" placeholder="0.00"
                value={item.rate || ''} onChange={(e) => setLine(idx, { rate: Number(e.target.value) })} disabled={!canEdit} />
              <input name={`items[${idx}].quantity`} className="input" type="number" min="0" step="0.01" placeholder="1"
                value={item.hours || ''} onChange={(e) => setLine(idx, { hours: Number(e.target.value) })} disabled={!canEdit} />
              <div className="flex items-center justify-end text-sm font-semibold text-gray-800">
                {fmt(item.rate * item.hours)}
              </div>
              <div className="flex justify-end">
                {canEdit && lineItems.length > 1 && (
                  <button type="button" onClick={() => removeLine(idx)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {canEdit && (
          <div className="border-t border-gray-100 px-5 py-3">
            <button type="button" onClick={addLine}
              className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add Line
            </button>
          </div>
        )}
      </div>

      {/* ── Notes + Totals ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_480px]">

        {/* Tabbed rich text notes */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex border-b border-gray-200">
            {NOTE_TABS.map((tab) => (
              <button key={tab} type="button" onClick={() => setNoteTab(tab)}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  noteTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab}
              </button>
            ))}
          </div>
          {NOTE_TABS.map((tab) => (
            <div key={tab} className={noteTab === tab ? 'block' : 'hidden'}>
              <RichEditor
                value={form[noteFieldMap[tab]] as string}
                onChange={(html) => canEdit && setForm((p) => ({ ...p, [noteFieldMap[tab]]: html }))}
                placeholder={`Enter ${tab.toLowerCase()}…`}
              />
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 h-fit">
          <TotalsRow label="Net"      value={fmt(totals.net)} />
          {totals.discount > 0 && (
            <TotalsRow
              label={`Discount${form.discountType === 'Percent' ? ` (${form.discount}%)` : ''}`}
              value={`− ${fmt(totals.discount)}`}
            />
          )}
          <TotalsRow label="Subtotal" value={fmt(totals.subtotal)} />
          {form.taxRate > 0 && (
            <TotalsRow label={`Tax (${form.taxRate}%)`} value={fmt(totals.taxAmount)} />
          )}
          <TotalsRow label="Total"        value={fmt(totals.total)} bold />
          <TotalsRow label="Paid to Date" value={fmt(0)} />
          <TotalsRow label="Balance"      value={fmt(totals.total)} />
        </div>
      </div>
    </form>
  );
}
