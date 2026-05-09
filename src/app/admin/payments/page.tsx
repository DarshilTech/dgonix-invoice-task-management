'use client';

import { useState, useEffect } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PageHeader } from '@/components/ui/PageHeader';

interface Payment {
  _id: string;
  invoiceId: { invoiceNumber: string; _id: string };
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  proofUrl?: string;
  paymentDate: string;
  clientId: { name: string };
}

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'failed', label: 'Failed' },
];

const STATUS_BADGE: Record<string, string> = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  failed: 'badge-failed',
};

export default function AdminPaymentsPage() {
  useDocumentTitle('Payments');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    paymentId: string;
    invoiceNumber: string;
    action: 'confirmed' | 'failed' | null;
  }>({ open: false, paymentId: '', invoiceNumber: '', action: null });
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  const fetchPayments = async () => {
    setIsLoading(true);
    const url = `/api/payments${statusFilter ? `?status=${statusFilter}` : ''}`;
    const res = await fetch(url, { credentials: 'include' });
    const data = await res.json();
    if (data.success) setPayments(data.data?.payments || []);
    setIsLoading(false);
  };

  const promptAction = (payment: Payment, action: 'confirmed' | 'failed') => {
    setConfirmModal({ open: true, paymentId: payment._id, invoiceNumber: payment.invoiceId?.invoiceNumber ?? '', action });
  };

  const executeAction = async () => {
    if (!confirmModal.action) return;
    setIsActioning(true);
    await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ paymentId: confirmModal.paymentId, status: confirmModal.action }),
    });
    setIsActioning(false);
    setConfirmModal({ open: false, paymentId: '', invoiceNumber: '', action: null });
    fetchPayments();
  };

  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const confirmedCount = payments.filter(p => p.status === 'confirmed').length;
  const confirmedTotal = payments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 py-6">

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.action === 'confirmed' ? 'Confirm Payment' : 'Reject Payment'}
        description={
          confirmModal.action === 'confirmed'
            ? `Mark payment for invoice ${confirmModal.invoiceNumber} as confirmed? This will update the invoice balance.`
            : `Reject the payment for invoice ${confirmModal.invoiceNumber}? The invoice will remain unpaid.`
        }
        confirmLabel={confirmModal.action === 'confirmed' ? 'Confirm Payment' : 'Reject Payment'}
        onConfirm={executeAction}
        onCancel={() => setConfirmModal({ open: false, paymentId: '', invoiceNumber: '', action: null })}
        loading={isActioning}
        danger={confirmModal.action === 'failed'}
      />

      <PageHeader
        title="Payments"
        subtitle="Review and verify client payment submissions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin/dashboard', home: true },
          { label: 'Payments' },
        ]}
      />

      {/* Summary */}
      {!isLoading && payments.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {pendingCount > 0 && (
            <div className="card flex items-center gap-2.5 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-xs font-medium text-gray-400">Pending review</span>
              <span className="text-sm font-bold text-amber-600">{pendingCount}</span>
            </div>
          )}
          <div className="card flex items-center gap-2.5 px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-gray-400">Confirmed</span>
            <span className="text-sm font-bold text-emerald-600">{confirmedCount}</span>
          </div>
          <div className="card flex items-center gap-2.5 px-4 py-2.5">
            <span className="text-xs font-medium text-gray-400">Confirmed total</span>
            <span className="text-sm font-bold text-gray-900">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(confirmedTotal)}
            </span>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setStatusFilter(s.value)}
            className={`filter-chip ${statusFilter === s.value ? 'filter-chip-active' : 'filter-chip-inactive'}`}
          >
            {s.label}
            {s.value === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-skeleton">
                <div className="h-4 w-24 skeleton" />
                <div className="h-4 w-32 skeleton" />
                <div className="ml-auto h-4 w-20 skeleton" />
                <div className="h-6 w-20 skeleton rounded-full" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-gray-500">No payments found</p>
            {statusFilter && (
              <button className="mt-2 text-sm text-primary-600 hover:underline" onClick={() => setStatusFilter('')} type="button">
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id}>
                      <td className="font-semibold text-gray-900">{p.invoiceId?.invoiceNumber}</td>
                      <td className="text-gray-700">{p.clientId?.name}</td>
                      <td className="font-semibold text-gray-900">
                        {p.currency} {p.amount.toFixed(2)}
                      </td>
                      <td className="capitalize text-gray-600">{p.paymentMethod}</td>
                      <td className="text-gray-500">{new Date(p.paymentDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</td>
                      <td><span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-draft'}`}>{p.status}</span></td>
                      <td>
                        <div className="flex items-center justify-end gap-3">
                          {p.proofUrl && (
                            <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary-600 hover:underline">
                              Proof
                            </a>
                          )}
                          {p.status === 'pending' && (
                            <>
                              <button type="button" onClick={() => promptAction(p, 'confirmed')} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                                Confirm
                              </button>
                              <button type="button" onClick={() => promptAction(p, 'failed')} className="text-sm font-medium text-red-600 hover:text-red-700">
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-50 md:hidden">
              {payments.map((p) => (
                <div key={p._id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{p.invoiceId?.invoiceNumber}</p>
                      <p className="text-sm text-gray-500">{p.clientId?.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{p.paymentMethod} · {new Date(p.paymentDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{p.currency} {p.amount.toFixed(2)}</p>
                      <span className={`badge mt-1 ${STATUS_BADGE[p.status] ?? 'badge-draft'}`}>{p.status}</span>
                    </div>
                  </div>
                  {p.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => promptAction(p, 'confirmed')} className="btn btn-primary btn-sm flex-1">Confirm</button>
                      <button type="button" onClick={() => promptAction(p, 'failed')} className="btn btn-danger btn-sm flex-1">Reject</button>
                    </div>
                  )}
                  {p.proofUrl && (
                    <a href={p.proofUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block text-sm text-primary-600 hover:underline">
                      View proof →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
