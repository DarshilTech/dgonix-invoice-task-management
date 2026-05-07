'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

type Invoice = {
  _id: string;
  invoiceNumber: string;
  status: string;
  paidAmount: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  taxRate: number;
  notes: string;
  terms: string;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  clientId: { _id: string; name: string };
  companyId: { _id: string; name: string };
};

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    invoiceDate: '',
    dueDate: '',
    taxRate: 0,
    notes: '',
    terms: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = subtotal * ((form.taxRate || 0) / 100);
    return { subtotal, taxAmount, total: subtotal + taxAmount };
  }, [form.taxRate, lineItems]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/invoices/${invoiceId}`, { credentials: 'include' });
      const data = await res.json();
      if (!data.success) {
        setError('Invoice not found');
        setIsLoading(false);
        return;
      }
      const inv: Invoice = data.data;
      setInvoice(inv);
      setForm({
        invoiceDate: new Date(inv.invoiceDate).toISOString().split('T')[0],
        dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
        taxRate: inv.taxRate || 0,
        notes: inv.notes || '',
        terms: inv.terms || '',
      });
      setLineItems(
        inv.lineItems.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        }))
      );
      setIsLoading(false);
    };
    load();
  }, [invoiceId]);

  const updateLineItem = (index: number, patch: Partial<LineItem>) => {
    setLineItems((cur) => cur.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...form, lineItems, taxRate: Number(form.taxRate) }),
    });
    const data = await res.json();
    setIsSaving(false);
    if (!res.ok) {
      setError(data.error || 'Failed to save invoice');
      return;
    }
    router.push(`/admin/invoices/${invoiceId}`);
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading invoice...</div>;
  }

  if (!invoice) {
    return (
      <div className="card">
        <div className="card-body text-center text-red-600">{error || 'Invoice not found'}</div>
      </div>
    );
  }

  const canEdit = invoice.status === 'draft' && invoice.paidAmount === 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Edit Invoice {invoice.invoiceNumber}</h1>
        <p className="section-subtitle">
          {invoice.clientId.name} · {invoice.companyId.name}
        </p>
      </div>

      {!canEdit && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This invoice cannot be edited — it has payments recorded or is no longer in Draft status.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={!canEdit}>
          {/* Dates */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="font-semibold">Dates</h2>
            </div>
            <div className="card-body grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Invoice Date</label>
                <input
                  className="input"
                  type="date"
                  value={form.invoiceDate}
                  onChange={(e) => setForm((p) => ({ ...p, invoiceDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input
                  className="input"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card mb-6">
            <div className="card-header flex items-center justify-between">
              <h2 className="font-semibold">Line Items</h2>
              <button
                className="btn btn-secondary btn-small"
                onClick={() =>
                  setLineItems((cur) => [...cur, { description: '', quantity: 1, unitPrice: 0 }])
                }
                type="button"
                disabled={!canEdit}
              >
                Add Item
              </button>
            </div>
            <div className="card-body space-y-4">
              {lineItems.map((item, index) => (
                <div className="rounded-lg border border-gray-200 p-4" key={index}>
                  <div className="grid gap-3 md:grid-cols-5">
                    <div className="md:col-span-2">
                      <label className="label">Description</label>
                      <input
                        className="input"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, { description: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Quantity</label>
                      <input
                        className="input"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, { quantity: Number(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Unit Price</label>
                      <input
                        className="input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(index, { unitPrice: Number(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Amount</label>
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-semibold">
                        {invoice.currency} {(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {lineItems.length > 1 && canEdit && (
                    <button
                      className="mt-3 text-sm font-medium text-red-700 hover:underline"
                      onClick={() =>
                        setLineItems((cur) => cur.filter((_, i) => i !== index))
                      }
                      type="button"
                    >
                      Remove item
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes, Terms, Tax */}
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="card">
              <div className="card-header">
                <h2 className="font-semibold">Notes and Terms</h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="label">Tax Rate (%)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.taxRate}
                    onChange={(e) => setForm((p) => ({ ...p, taxRate: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    className="input"
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="label">Terms</label>
                  <textarea
                    className="input"
                    value={form.terms}
                    onChange={(e) => setForm((p) => ({ ...p, terms: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="card h-fit">
              <div className="card-header">
                <h2 className="font-semibold">Totals</h2>
              </div>
              <div className="card-body space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">
                    {invoice.currency} {totals.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">
                    {invoice.currency} {totals.taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {invoice.currency} {totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex gap-3">
          {canEdit && (
            <button className="btn btn-primary" disabled={isSaving} type="submit">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => router.push(`/admin/invoices/${invoiceId}`)}
            type="button"
          >
            {canEdit ? 'Cancel' : 'Back'}
          </button>
        </div>
      </form>
    </div>
  );
}
