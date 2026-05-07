'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  subtotal: number;
  taxAmount?: number;
  currency: string;
  lineItems: any[];
  invoiceDate: string;
  dueDate: string;
  paymentReference: string;
  companyId: { name: string };
  notes?: string;
}

export default function PortalInvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' });
      const data = await res.json();

      if (data.success) {
        setInvoice(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`, { credentials: 'include' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice?.invoiceNumber}.pdf`;
      a.click();
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      setMessage('Please select a file');
      return;
    }

    setIsSubmitting(true);
    try {
      const mockFileUrl = `/uploads/${Date.now()}-${proofFile.name}`;

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          paymentMethod: 'wise',
          proofUrl: mockFileUrl,
          notes,
        }),
        credentials: 'include',
      });

      const data = await res.json();

      if (data.success) {
        setMessage('Payment proof submitted successfully!');
        setProofFile(null);
        setNotes('');
        setShowPaymentForm(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to submit payment proof');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!invoice) {
    return <div className="text-center py-12">Invoice not found</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="section-title">Invoice #{invoice.invoiceNumber}</h1>
          <p className="section-subtitle">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              invoice.status === 'paid' ? 'bg-status-paid/10 text-status-paid' :
              invoice.status === 'sent' ? 'bg-status-pending/10 text-status-pending' :
              'bg-status-draft/10 text-status-draft'
            }`}>
              {invoice.status.toUpperCase()}
            </span>
          </p>
        </div>
        <button onClick={handleDownloadPDF} className="btn btn-secondary">
          📥 Download PDF
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="card-body">
            <p className="text-gray-600 text-sm">Total Amount</p>
            <p className="text-3xl font-bold mt-2">
              {invoice.currency} {invoice.total.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-gray-600 text-sm">Invoice Date</p>
            <p className="text-lg font-semibold mt-2">
              {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <p className="text-gray-600 text-sm">Due Date</p>
            <p className="text-lg font-semibold mt-2">
              {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="font-semibold">Invoice Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Quantity</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>
                    {invoice.currency} {item.unitPrice.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {invoice.currency} {item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-body border-t pt-6">
          <div className="space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{invoice.currency} {invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.taxAmount ? (
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{invoice.currency} {invoice.taxAmount.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{invoice.currency} {invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Reference */}
      <div className="card mb-6">
        <div className="card-header">
          <h2 className="font-semibold">Payment Instructions</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-2">Payment Reference</p>
            <p className="font-mono font-bold text-lg break-all">{invoice.paymentReference}</p>
            <p className="text-xs text-gray-600 mt-2">
              ℹ️ Please include this reference when making your payment
            </p>
          </div>

          {invoice.status !== 'paid' && (
            <button
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              className="btn btn-primary"
            >
              {showPaymentForm ? 'Cancel' : '✓ Mark as Paid / Upload Proof'}
            </button>
          )}
        </div>
      </div>

      {/* Payment Proof Form */}
      {showPaymentForm && invoice.status !== 'paid' && (
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="font-semibold">Submit Payment Proof</h2>
          </div>
          <form onSubmit={handleSubmitPaymentProof} className="card-body space-y-4">
            <div>
              <label className="label">Upload Payment Screenshot/Proof</label>
              <input
                type="file"
                className="input"
                accept="image/*,application/pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                required
              />
              <p className="text-xs text-gray-600 mt-1">
                Accepted formats: PNG, JPG, PDF (Max 5MB)
              </p>
            </div>

            <div>
              <label className="label">Notes (Optional)</label>
              <textarea
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Add any notes about this payment..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? 'Submitting...' : '📤 Submit Payment Proof'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPaymentForm(false);
                  setProofFile(null);
                  setNotes('');
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
