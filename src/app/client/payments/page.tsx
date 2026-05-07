'use client';

import { useEffect, useState } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Payment = {
  _id: string;
  invoiceId: { invoiceNumber: string };
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  status: string;
};

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    fetch('/api/payments', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPayments(data.data?.payments || []);
      });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Payments</h1>
        <p className="section-subtitle">Track submitted and confirmed payments</p>
      </div>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <div className="card" key={payment._id}>
            <div className="card-body flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Invoice {payment.invoiceId.invoiceNumber}</p>
                <p className="text-sm text-gray-600">
                  {payment.paymentMethod} · {new Date(payment.paymentDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold">
                  {payment.currency} {payment.amount.toFixed(2)}
                </p>
                <StatusBadge status={payment.status} />
              </div>
            </div>
          </div>
        ))}
        {payments.length === 0 ? (
          <div className="card">
            <div className="card-body text-center text-gray-500">No payments yet</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
