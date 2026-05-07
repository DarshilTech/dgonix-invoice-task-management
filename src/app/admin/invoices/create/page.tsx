'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Company = {
  _id: string;
  name: string;
};

type Client = {
  _id: string;
  name: string;
  email: string;
};

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export default function CreateInvoicePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    companyId: '',
    clientId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 0,
    notes: '',
    terms: '',
    currency: 'USD',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);

  const totals = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = subtotal * ((form.taxRate || 0) / 100);
    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount,
    };
  }, [form.taxRate, lineItems]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (form.companyId) {
      fetchClients(form.companyId);
    }
  }, [form.companyId]);

  const fetchCompanies = async () => {
    const res = await fetch('/api/companies', { credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setCompanies(data.data || []);
      setForm((prev) => ({ ...prev, companyId: data.data?.[0]?._id || '' }));
    }
    setIsLoading(false);
  };

  const fetchClients = async (companyId: string) => {
    const res = await fetch(`/api/clients?companyId=${companyId}&limit=100`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (data.success) {
      setClients(data.data || []);
      setForm((prev) => ({ ...prev, clientId: data.data?.[0]?._id || '' }));
    }
  };

  const updateLineItem = (index: number, patch: Partial<LineItem>) => {
    setLineItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  };

  const submitInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ...form,
        tenantId: form.companyId,
        lineItems,
        taxRate: Number(form.taxRate) || 0,
      }),
    });
    const data = await res.json();
    setIsSaving(false);

    if (!res.ok) {
      setError(data.error || 'Failed to create invoice');
      return;
    }

    router.push(`/admin/invoices/${data.data._id}`);
  };

  if (isLoading) {
    return <div className="text-center text-gray-500">Loading invoice form...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Create Invoice</h1>
        <p className="section-subtitle">Add line items and let the service calculate totals</p>
      </div>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={submitInvoice} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold">Company and Client</h2>
          </div>
          <div className="card-body grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Company</label>
              <select
                className="input"
                value={form.companyId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, companyId: event.target.value }))
                }
                required
              >
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Client</label>
              <select
                className="input"
                value={form.clientId}
                onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
                required
              >
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
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
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, invoiceDate: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label">Due Date</label>
              <input
                className="input"
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="font-semibold">Line Items</h2>
            <button
              className="btn btn-secondary btn-small"
              onClick={() =>
                setLineItems((current) => [
                  ...current,
                  { description: '', quantity: 1, unitPrice: 0 },
                ])
              }
              type="button"
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
                      onChange={(event) =>
                        updateLineItem(index, { description: event.target.value })
                      }
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
                      onChange={(event) =>
                        updateLineItem(index, { quantity: Number(event.target.value) })
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
                      onChange={(event) =>
                        updateLineItem(index, { unitPrice: Number(event.target.value) })
                      }
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Amount</label>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-semibold">
                      {form.currency} {(item.quantity * item.unitPrice).toFixed(2)}
                    </div>
                  </div>
                </div>
                {lineItems.length > 1 ? (
                  <button
                    className="mt-3 text-sm font-medium text-red-700 hover:underline"
                    onClick={() =>
                      setLineItems((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    type="button"
                  >
                    Remove item
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold">Notes and Terms</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Tax Rate</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.taxRate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, taxRate: Number(event.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <label className="label">Terms</label>
                <textarea
                  className="input"
                  value={form.terms}
                  onChange={(event) => setForm((prev) => ({ ...prev, terms: event.target.value }))}
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
                <span className="font-semibold">{form.currency} {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold">{form.currency} {totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
                <span>Total</span>
                <span>{form.currency} {totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn btn-primary" disabled={isSaving} type="submit">
            {isSaving ? 'Creating...' : 'Create Invoice'}
          </button>
          <button className="btn btn-secondary" onClick={() => router.back()} type="button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
