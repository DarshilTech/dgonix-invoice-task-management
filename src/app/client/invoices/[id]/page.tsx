'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Invoice = {
  _id: string;
  invoiceNumber: string;
  status: string;
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  currency: string;
  dueDate: string;
  paymentReference: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  companyId: { name: string };
};

export default function ClientInvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    const res = await fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' });
    const data = await res.json();
    if (data.success) setInvoice(data.data);
  };

  const downloadPdf = async () => {
    const res = await fetch(`/api/invoices/${invoiceId}/pdf`, { credentials: 'include' });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${invoice?.invoiceNumber}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const submitProof = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        invoiceId,
        paymentMethod: 'Client proof upload',
        proofUrl,
        notes,
      }),
    });
    const data = await res.json();
    setMessage(
      res.ok ? 'Payment proof uploaded for admin review' : data.error || 'Could not upload proof'
    );
    if (res.ok) {
      setProofUrl('');
      setNotes('');
    }
  };

  if (!invoice) {
    return <div className="text-center text-gray-500">Loading invoice...</div>;
  }

  return (
    <div className="py-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="section-title">Invoice {invoice.invoiceNumber}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="section-subtitle">From {invoice.companyId.name}</p>
        </div>
        <button className="btn btn-secondary" onClick={downloadPdf} type="button">
          Download PDF
        </button>
      </div>

      {message ? (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          {message}
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Total</p>
            <p className="mt-2 text-2xl font-bold">
              {invoice.currency} {invoice.totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Paid</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              {invoice.currency} {invoice.paidAmount.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-sm text-gray-600">Balance</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {invoice.currency} {invoice.balanceAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {invoice.currency} {item.unitPrice.toFixed(2)}
                    </td>
                    <td>
                      {invoice.currency} {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">Payment Instructions</h2>
            </div>
            <div className="card-body">
              <p className="text-sm text-gray-600">Reference</p>
              <p className="mt-2 break-all font-mono text-sm font-bold">
                {invoice.paymentReference}
              </p>
            </div>
          </div>

          {invoice.status !== 'paid' ? (
            <form className="card" onSubmit={submitProof}>
              <div className="card-header">
                <h2 className="font-semibold">Upload Payment Proof</h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Proof URL</label>
                  <input
                    name="proofUrl"
                    className="input"
                    value={proofUrl}
                    onChange={(event) => setProofUrl(event.target.value)}
                    placeholder="/uploads/payment-proof.pdf"
                    required
                  />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                  />
                </div>
                <button className="btn btn-primary w-full" type="submit">
                  Submit Proof
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
