'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type Invoice = {
  _id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  discount?: number;
  discountType?: string;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  dueDate: string;
  invoiceDate: string;
  poNumber?: string;
  paymentReference: string;
  notes?: string;
  terms?: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  clientId: { _id: string; name: string; email: string } | null;
  companyId: { _id: string; name: string } | null;
};

type Payment = {
  _id: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  notes?: string;
  proofUrl?: string;
};

type PaymentMethod = { _id: string; name: string };

const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

const fmt = (n: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

function TotalsRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2.5 ${bold ? 'border-t border-gray-200 mt-1' : 'border-t border-gray-100'}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{value}</span>
    </div>
  );
}

export default function AdminInvoiceDetailPage() {
  useDocumentTitle('Invoice');
  const params  = useParams();
  const router  = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice]               = useState<Invoice | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [payments, setPayments]             = useState<Payment[]>([]);
  const [methods, setMethods]               = useState<PaymentMethod[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sendingEmail, setSendingEmail]     = useState(false);
  const [activeNoteTab, setActiveNoteTab]   = useState<'notes' | 'terms'>('notes');
  const [paymentForm, setPaymentForm] = useState({
    amount: '', paymentMethod: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '', proofUrl: '', status: 'confirmed',
  });
  const [message, setMessage]   = useState('');
  const [isError, setIsError]   = useState(false);

  useEffect(() => { fetchInvoice(); fetchPayments(); fetchMethods(); }, [invoiceId]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const show = (text: string, error = false) => { setIsError(error); setMessage(text); };

  const fetchInvoice = async () => {
    const res  = await fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setInvoice(data.data);
      setSelectedStatus(data.data.status);
      setPaymentForm((p) => ({ ...p, amount: String(data.data.balanceAmount || data.data.totalAmount || 0) }));
    }
    setIsLoading(false);
  };

  const fetchPayments = async () => {
    const res  = await fetch(`/api/payments?invoiceId=${invoiceId}&limit=100`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) setPayments(data.data?.payments || []);
  };

  const fetchMethods = async () => {
    const res  = await fetch('/api/payment-methods', { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setMethods(data.data || []);
      setPaymentForm((p) => ({ ...p, paymentMethod: p.paymentMethod || data.data?.[0]?.name || '' }));
    }
  };

  const updateStatus = async () => {
    const res  = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ status: selectedStatus }),
    });
    const data = await res.json();
    if (res.ok) { show('Status updated'); setInvoice((p) => p ? { ...p, status: selectedStatus } : p); }
    else show(data.error || 'Could not update status', true);
  };

  const deleteInvoice = async () => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    const res  = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (res.ok) router.push('/admin/invoices');
    else show(data.error || 'Could not delete invoice', true);
  };

  const sendEmail = async () => {
    setSendingEmail(true);
    const res  = await fetch(`/api/invoices/${invoiceId}/email`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    setSendingEmail(false);
    if (res.ok) { show('Invoice emailed to client'); fetchInvoice(); }
    else show(data.error || 'Could not send email', true);
  };

  const downloadPdf = async () => {
    const res = await fetch(`/api/invoices/${invoiceId}/pdf`, { credentials: 'include' });
    if (!res.ok) { show('Could not generate PDF', true); return; }
    const blob = await res.blob();
    const url  = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice?.invoiceNumber}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const submitPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      invoiceId,
      amount: Number(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      paymentDate:   paymentForm.paymentDate,
      notes:         paymentForm.notes,
      proofUrl:      paymentForm.proofUrl,
      status:        paymentForm.status,
    };
    const url    = editingPayment ? `/api/payments/${editingPayment._id}` : '/api/payments';
    const method = editingPayment ? 'PUT' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) });
    const data   = await res.json();
    if (!res.ok) { show(data.error || 'Could not save payment', true); return; }
    show(editingPayment ? 'Payment updated' : 'Payment recorded');
    setEditingPayment(null);
    setShowPaymentForm(false);
    await fetchInvoice();
    await fetchPayments();
  };

  const editPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setPaymentForm({
      amount:        String(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentDate:   new Date(payment.paymentDate).toISOString().split('T')[0],
      notes:         payment.notes || '',
      proofUrl:      payment.proofUrl || '',
      status:        payment.status,
    });
    setShowPaymentForm(true);
  };

  const deletePayment = async (paymentId: string) => {
    if (!window.confirm('Delete this payment record?')) return;
    const res = await fetch(`/api/payments/${paymentId}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { show('Payment deleted'); await fetchInvoice(); await fetchPayments(); }
    else show('Could not delete payment', true);
  };

  /* ── Skeleton ── */
  if (isLoading) {
    return (
      <div className="animate-pulse py-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-48 rounded-lg bg-gray-200" />
              <div className="h-6 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="h-4 w-56 rounded bg-gray-100" />
          </div>
          <div className="flex gap-2">
            {[88, 112, 96, 112, 64].map((w, i) => (
              <div key={i} className="h-9 rounded-md bg-gray-200" style={{ width: w }} />
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
              <div className="h-3 w-20 rounded bg-gray-100" />
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-3">
            <div className="grid grid-cols-4 gap-4">
              {[0,1,2,3].map((i) => <div key={i} className="h-3 rounded bg-gray-200" />)}
            </div>
          </div>
          {[0,1,2].map((i) => (
            <div key={i} className="grid grid-cols-4 gap-4 px-5 py-4">
              {[0,1,2,3].map((j) => <div key={j} className="h-4 rounded bg-gray-100" />)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Invoice not found</div>;
  }

  const canEdit     = invoice.status === 'draft' && invoice.paidAmount === 0;
  const cur         = invoice.currency || 'USD';
  const hasDiscount = (invoice.discountAmount ?? 0) > 0;
  const hasTax      = (invoice.taxAmount ?? 0) > 0;
  const hasNotes    = !!(invoice.notes || invoice.terms);

  return (
    <div className="py-6 space-y-4">

      {/* ── Header ── */}
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber || '—'}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard', home: true },
          { label: 'Invoices', href: '/admin/invoices' },
          { label: invoice.invoiceNumber || 'Invoice' },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={invoice.status} />
            {canEdit && (
              <Link href={`/admin/invoices/${invoiceId}/edit`}
                className="h-9 rounded-md flex items-center border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Edit
              </Link>
            )}
            <button onClick={downloadPdf} type="button"
              className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <span className="hidden sm:inline">Download </span>PDF
            </button>
            <button onClick={sendEmail} disabled={sendingEmail} type="button"
              className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
              {sendingEmail ? 'Sending…' : <><span className="hidden sm:inline">Send </span>Email</>}
            </button>
            <button onClick={() => setShowPaymentForm(true)} type="button"
              className="h-9 rounded-md bg-gray-900 px-3 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
              + Payment
            </button>
            <button onClick={deleteInvoice} type="button"
              className="h-9 rounded-md bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 transition-colors">
              Delete
            </button>
          </div>
        }
      />

      {message && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* ── Info row: Client | Dates | Amounts ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Client */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Client</p>
          <p className="font-semibold text-gray-900">{invoice.clientId?.name || '—'}</p>
          {invoice.clientId?.email && <p className="mt-0.5 text-sm text-gray-500">{invoice.clientId.email}</p>}
          {invoice.companyId?.name && <p className="mt-2 text-xs text-gray-400">{invoice.companyId.name}</p>}
          {invoice.poNumber && (
            <p className="mt-2 text-xs text-gray-500">PO #: <span className="font-medium text-gray-700">{invoice.poNumber}</span></p>
          )}
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Dates</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Invoice Date</span>
              <span className="text-sm font-medium text-gray-800">{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Due Date</span>
              <span className="text-sm font-medium text-gray-800">{new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Currency</span>
              <span className="text-sm font-medium text-gray-800">{cur}</span>
            </div>
          </div>
        </div>

        {/* Amounts */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Amounts</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-sm font-semibold text-gray-900">{fmt(invoice.totalAmount, cur)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Paid</span>
              <span className="text-sm font-semibold text-emerald-700">{fmt(invoice.paidAmount, cur)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-2">
              <span className="text-sm font-medium text-gray-700">Balance</span>
              <span className="text-sm font-bold text-amber-700">{fmt(invoice.balanceAmount, cur)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status update ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Update Status:</span>
          <select className="input w-auto" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
            ))}
          </select>
          <button onClick={updateStatus} disabled={selectedStatus === invoice.status} type="button"
            className="h-9 rounded-md bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-40">
            Apply
          </button>
        </div>
      </div>

      {/* ── Payment form ── */}
      {showPaymentForm && (
        <form onSubmit={submitPayment} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-3">
            <h2 className="text-sm font-semibold text-gray-700">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Amount</label>
              <input name="amount" className="input" type="number" min="0.01" step="0.01" value={paymentForm.amount}
                onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Payment Method</label>
              <select className="input" value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMethod: e.target.value }))} required>
                {methods.map((m) => <option key={m._id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Payment Date</label>
              <input name="paymentDate" className="input" type="date" value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))} required />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Status</label>
              <select className="input" value={paymentForm.status}
                onChange={(e) => setPaymentForm((p) => ({ ...p, status: e.target.value }))}>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Proof URL</label>
              <input name="proofUrl" className="input" value={paymentForm.proofUrl}
                onChange={(e) => setPaymentForm((p) => ({ ...p, proofUrl: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Notes</label>
              <input name="notes" className="input" value={paymentForm.notes}
                onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3 border-t border-gray-100 px-5 py-3">
            <button className="h-9 rounded-md bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-700 transition-colors" type="submit">
              {editingPayment ? 'Save Payment' : 'Record Payment'}
            </button>
            <button type="button" onClick={() => { setShowPaymentForm(false); setEditingPayment(null); }}
              className="h-9 rounded-md border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Line items + Totals ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_480px]">

        {/* Line items */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr] gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400 md:grid">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit Price</span>
            <span className="text-right">Amount</span>
          </div>
          <div className="divide-y divide-gray-100">
            {invoice.lineItems.map((item, idx) => (
              <div key={idx} className="px-5 py-4 md:grid md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center md:gap-3">
                <p className="text-sm font-medium text-gray-800 mb-2 md:mb-0">{item.description}</p>
                <div className="flex items-center justify-between md:block">
                  <span className="text-xs text-gray-400 md:hidden">Qty</span>
                  <span className="text-sm text-gray-600">{item.quantity}</span>
                </div>
                <div className="flex items-center justify-between md:block">
                  <span className="text-xs text-gray-400 md:hidden">Unit Price</span>
                  <span className="text-sm text-gray-600">{fmt(item.unitPrice, cur)}</span>
                </div>
                <div className="flex items-center justify-between md:block">
                  <span className="text-xs text-gray-400 md:hidden">Amount</span>
                  <span className="text-sm font-semibold text-gray-800 md:text-right md:block">{fmt(item.quantity * item.unitPrice, cur)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 h-fit">
          <TotalsRow label="Net" value={fmt((invoice.discountAmount ?? 0) > 0 ? (invoice.subtotal + (invoice.discountAmount ?? 0)) : invoice.subtotal, cur)} />
          {hasDiscount && (
            <TotalsRow
              label={`Discount${invoice.discountType === 'Percent' ? ` (${invoice.discount}%)` : ''}`}
              value={`− ${fmt(invoice.discountAmount ?? 0, cur)}`}
            />
          )}
          <TotalsRow label="Subtotal" value={fmt(invoice.subtotal, cur)} />
          {hasTax && (
            <TotalsRow label={`Tax (${invoice.taxRate}%)`} value={fmt(invoice.taxAmount ?? 0, cur)} />
          )}
          <TotalsRow label="Total" value={fmt(invoice.totalAmount, cur)} bold />
          <TotalsRow label="Paid to Date" value={fmt(invoice.paidAmount, cur)} />
          <TotalsRow label="Balance" value={fmt(invoice.balanceAmount, cur)} />
        </div>
      </div>

      {/* ── Notes / Terms ── */}
      {hasNotes && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex border-b border-gray-200">
            {(['notes', 'terms'] as const).filter((t) => invoice[t]).map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveNoteTab(tab)}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
                  activeNoteTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {tab === 'notes' ? 'Public Notes' : 'Terms'}
              </button>
            ))}
          </div>
          <div
            className="prose prose-sm max-w-none p-5 text-gray-700 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: invoice[activeNoteTab] || '' }}
          />
        </div>
      )}

      {/* ── Payment History ── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">No payments recorded yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((payment) => (
              <div key={payment._id} className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900">{fmt(payment.amount, cur)}</p>
                    <StatusBadge status={payment.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{payment.paymentMethod} · {new Date(payment.paymentDate).toLocaleDateString()}</p>
                  {payment.notes && <p className="mt-1 text-sm text-gray-500 break-words">{payment.notes}</p>}
                  <div className="mt-2 flex gap-3 text-xs">
                    <button className="font-medium text-primary-600 hover:underline" onClick={() => editPayment(payment)} type="button">Edit</button>
                    <button className="font-medium text-red-600 hover:underline" onClick={() => deletePayment(payment._id)} type="button">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
