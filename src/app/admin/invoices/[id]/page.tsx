'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Invoice = {
  _id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  taxAmount?: number;
  total: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  dueDate: string;
  invoiceDate: string;
  paymentReference: string;
  notes?: string;
  terms?: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  clientId: { _id: string; name: string; email: string };
  companyId: { name: string };
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

type PaymentMethod = {
  _id: string;
  name: string;
};

const STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

export default function AdminInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    proofUrl: '',
    status: 'confirmed',
  });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    fetchInvoice();
    fetchPayments();
    fetchMethods();
  }, [invoiceId]);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const show = (text: string, error = false) => {
    setIsError(error);
    setMessage(text);
  };

  const fetchInvoice = async () => {
    const res = await fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setInvoice(data.data);
      setSelectedStatus(data.data.status);
      setPaymentForm((prev) => ({
        ...prev,
        amount: String(data.data.balanceAmount || data.data.totalAmount || 0),
      }));
    }
  };

  const fetchPayments = async () => {
    const res = await fetch(`/api/payments?invoiceId=${invoiceId}&limit=100`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (data.success) setPayments(data.data?.payments || []);
  };

  const fetchMethods = async () => {
    const res = await fetch('/api/payment-methods', { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setMethods(data.data || []);
      setPaymentForm((prev) => ({
        ...prev,
        paymentMethod: prev.paymentMethod || data.data?.[0]?.name || '',
      }));
    }
  };

  const updateStatus = async () => {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: selectedStatus }),
    });
    const data = await res.json();
    if (res.ok) {
      show('Status updated');
      setInvoice((prev) => (prev ? { ...prev, status: selectedStatus } : prev));
    } else {
      show(data.error || 'Could not update status', true);
    }
  };

  const deleteInvoice = async () => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/admin/invoices');
    } else {
      show(data.error || 'Could not delete invoice', true);
    }
  };

  const sendEmail = async () => {
    setSendingEmail(true);
    const res = await fetch(`/api/invoices/${invoiceId}/email`, {
      method: 'POST',
      credentials: 'include',
    });
    const data = await res.json();
    setSendingEmail(false);
    if (res.ok) {
      show('Invoice emailed to client');
      fetchInvoice();
    } else {
      show(data.error || 'Could not send email', true);
    }
  };

  const downloadPdf = async () => {
    const res = await fetch(`/api/invoices/${invoiceId}/pdf`, { credentials: 'include' });
    if (!res.ok) {
      show('Could not generate PDF', true);
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice?.invoiceNumber}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const submitPayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      invoiceId,
      amount: Number(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      paymentDate: paymentForm.paymentDate,
      notes: paymentForm.notes,
      proofUrl: paymentForm.proofUrl,
      status: paymentForm.status,
    };
    const url = editingPayment ? `/api/payments/${editingPayment._id}` : '/api/payments';
    const method = editingPayment ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
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
      amount: String(payment.amount),
      paymentMethod: payment.paymentMethod,
      paymentDate: new Date(payment.paymentDate).toISOString().split('T')[0],
      notes: payment.notes || '',
      proofUrl: payment.proofUrl || '',
      status: payment.status,
    });
    setShowPaymentForm(true);
  };

  const deletePayment = async (paymentId: string) => {
    if (!window.confirm('Delete this payment record?')) return;
    const res = await fetch(`/api/payments/${paymentId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      show('Payment deleted');
      await fetchInvoice();
      await fetchPayments();
    } else {
      show('Could not delete payment', true);
    }
  };

  if (!invoice) {
    return <div className="text-center text-gray-500">Loading invoice...</div>;
  }

  const isDraft = invoice.status === 'draft';
  const canEdit = isDraft && invoice.paidAmount === 0;

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="section-title">Invoice {invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="section-subtitle">
            {invoice.clientId.name} · due {new Date(invoice.dueDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link href={`/admin/invoices/${invoiceId}/edit`} className="btn btn-secondary">
              Edit Invoice
            </Link>
          )}
          <button className="btn btn-secondary" onClick={downloadPdf} type="button">
            Download PDF
          </button>
          <button
            className="btn btn-secondary"
            onClick={sendEmail}
            disabled={sendingEmail}
            type="button"
          >
            {sendingEmail ? 'Sending...' : 'Send Email'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowPaymentForm(true)}
            type="button"
          >
            Add Payment
          </button>
          <button className="btn btn-danger btn-small" onClick={deleteInvoice} type="button">
            Delete
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            isError
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      {/* Metrics */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="mt-2 text-2xl font-bold">
              {invoice.currency} {invoice.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Paid Amount</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {invoice.currency} {invoice.paidAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Remaining Balance</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {invoice.currency} {invoice.balanceAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Status Update */}
      <div className="card mb-6">
        <div className="card-body flex flex-wrap items-center gap-4">
          <p className="text-sm font-medium text-gray-700">Update Status:</p>
          <select
            className="input w-auto"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary btn-small"
            onClick={updateStatus}
            disabled={selectedStatus === invoice.status}
            type="button"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <form onSubmit={submitPayment} className="card mb-6">
          <div className="card-header">
            <h2 className="font-semibold">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Amount</label>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select
                className="input"
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paymentMethod: e.target.value }))}
                required
              >
                {methods.map((m) => (
                  <option key={m._id} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Payment Date</label>
              <input
                className="input"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm((p) => ({ ...p, paymentDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={paymentForm.status}
                onChange={(e) => setPaymentForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="label">Proof URL</label>
              <input
                className="input"
                value={paymentForm.proofUrl}
                onChange={(e) => setPaymentForm((p) => ({ ...p, proofUrl: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <input
                className="input"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="card-body flex gap-3 border-t border-gray-200">
            <button className="btn btn-primary" type="submit">
              {editingPayment ? 'Save Payment' : 'Record Payment'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { setShowPaymentForm(false); setEditingPayment(null); }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Line Items */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{invoice.currency} {item.unitPrice.toFixed(2)}</td>
                    <td>{invoice.currency} {item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-6 py-2 text-right text-sm font-medium text-gray-600">
                    Subtotal
                  </td>
                  <td className="px-6 py-2 font-medium">
                    {invoice.currency} {invoice.subtotal.toFixed(2)}
                  </td>
                </tr>
                {(invoice.taxAmount ?? 0) > 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-2 text-right text-sm font-medium text-gray-600">
                      Tax
                    </td>
                    <td className="px-6 py-2 font-medium">
                      {invoice.currency} {(invoice.taxAmount ?? 0).toFixed(2)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={3} className="px-6 py-2 text-right font-semibold">Total</td>
                  <td className="px-6 py-2 font-bold">
                    {invoice.currency} {invoice.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {(invoice.notes || invoice.terms) && (
            <div className="card-body border-t border-gray-100 grid gap-3 md:grid-cols-2">
              {invoice.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Notes</p>
                  <p className="mt-1 text-sm text-gray-700">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Terms</p>
                  <p className="mt-1 text-sm text-gray-700">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="card h-fit">
          <div className="card-header">
            <h2 className="font-semibold">Payment History</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <div className="p-4" key={payment._id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {invoice.currency} {payment.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">{payment.paymentMethod}</p>
                  </div>
                  <StatusBadge status={payment.status} />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(payment.paymentDate).toLocaleDateString()}
                </p>
                {payment.notes && (
                  <p className="mt-1 text-sm text-gray-600">{payment.notes}</p>
                )}
                <div className="mt-3 flex gap-3 text-sm">
                  <button
                    className="text-blue-700 hover:underline"
                    onClick={() => editPayment(payment)}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-700 hover:underline"
                    onClick={() => deletePayment(payment._id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-gray-500">
                No payments recorded yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
