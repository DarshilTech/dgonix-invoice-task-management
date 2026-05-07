import mongoose from 'mongoose';
import { Invoice, Payment, PaymentMethod } from '@/lib/db/models';
import type { JWTPayload } from '@/lib/auth/jwt';
import type { CreatePaymentInput, UpdatePaymentInput } from '@/lib/validation/payment';
import { getPrimaryTenantId } from '@/services/tenantAccess';
import {
  getConfirmedPaidAmount,
  refreshInvoicePaymentState,
  roundMoney,
} from '@/services/invoiceService';

export class ServiceError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function findAccessibleInvoice(auth: JWTPayload, invoiceId: string) {
  const tenantId = getPrimaryTenantId(auth);
  const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });

  if (!invoice) {
    throw new ServiceError('Invoice not found', 404);
  }

  if (auth.role === 'client' && invoice.clientId.toString() !== auth.clientId) {
    throw new ServiceError('Forbidden', 403);
  }

  return invoice;
}

async function assertPaymentMethod(tenantId: string, paymentMethodId?: string) {
  if (!paymentMethodId) return null;

  const method = await PaymentMethod.findOne({
    _id: paymentMethodId,
    tenantId,
    isActive: true,
  });

  if (!method) {
    throw new ServiceError('Payment method not found', 404);
  }

  return method;
}

export async function createPaymentForInvoice(auth: JWTPayload, input: CreatePaymentInput) {
  const invoice = await findAccessibleInvoice(auth, input.invoiceId);
  const tenantId = invoice.tenantId.toString();
  const method = await assertPaymentMethod(tenantId, input.paymentMethodId);
  const status = auth.role === 'admin' ? input.status || 'confirmed' : 'pending';
  const balanceAmount = invoice.balanceAmount ?? invoice.totalAmount ?? invoice.total;
  const amount = roundMoney(auth.role === 'client' ? balanceAmount : input.amount || balanceAmount);

  if (amount <= 0) {
    throw new ServiceError('Payment amount must be positive');
  }

  if (amount > balanceAmount + 0.01) {
    throw new ServiceError('Payment amount cannot exceed the remaining balance');
  }

  const payment = await Payment.create({
    tenantId: invoice.tenantId,
    companyId: invoice.tenantId,
    invoiceId: invoice._id,
    clientId: invoice.clientId,
    amount,
    currency: invoice.currency,
    paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
    paymentMethod: method?.name || input.paymentMethod,
    paymentMethodId: method?._id,
    proofUrl: input.proofUrl,
    proofType: input.proofType,
    referenceNumber: input.referenceNumber,
    notes: input.notes,
    status,
    createdBy: new mongoose.Types.ObjectId(auth.userId),
    verifiedBy: status === 'confirmed' ? new mongoose.Types.ObjectId(auth.userId) : undefined,
    verifiedAt: status === 'confirmed' ? new Date() : undefined,
  });

  if (payment.status === 'confirmed') {
    await refreshInvoicePaymentState(invoice._id, invoice.tenantId);
  }

  return payment.populate([
    { path: 'invoiceId', select: 'invoiceNumber totalAmount paidAmount balanceAmount status' },
    { path: 'clientId', select: 'name email' },
  ]);
}

export async function updatePayment(
  auth: JWTPayload,
  paymentId: string,
  input: UpdatePaymentInput
) {
  const tenantId = getPrimaryTenantId(auth);
  const payment = await Payment.findOne({ _id: paymentId, tenantId });

  if (!payment) {
    throw new ServiceError('Payment not found', 404);
  }

  if (auth.role === 'client') {
    if (payment.clientId.toString() !== auth.clientId || payment.status !== 'pending') {
      throw new ServiceError('Forbidden', 403);
    }

    payment.proofUrl = input.proofUrl ?? payment.proofUrl;
    payment.proofType = input.proofType ?? payment.proofType;
    payment.notes = input.notes ?? payment.notes;
    await payment.save();
    return payment;
  }

  const method = await assertPaymentMethod(tenantId, input.paymentMethodId);
  const nextAmount = input.amount ? roundMoney(input.amount) : payment.amount;
  const confirmedBeforeThisPayment = await getConfirmedPaidAmount(
    payment.invoiceId,
    payment.tenantId,
    payment._id.toString()
  );
  const invoice = await Invoice.findOne({ _id: payment.invoiceId, tenantId });

  if (!invoice) {
    throw new ServiceError('Invoice not found', 404);
  }

  const maxAllowed = roundMoney(
    (invoice.totalAmount ?? invoice.total) - confirmedBeforeThisPayment
  );
  if ((input.status || payment.status) === 'confirmed' && nextAmount > maxAllowed + 0.01) {
    throw new ServiceError('Payment amount cannot exceed the remaining balance');
  }

  payment.amount = nextAmount;
  payment.paymentDate = input.paymentDate ? new Date(input.paymentDate) : payment.paymentDate;
  payment.paymentMethod = method?.name || input.paymentMethod || payment.paymentMethod;
  payment.paymentMethodId = method?._id || payment.paymentMethodId;
  payment.proofUrl = input.proofUrl ?? payment.proofUrl;
  payment.proofType = input.proofType ?? payment.proofType;
  payment.referenceNumber = input.referenceNumber ?? payment.referenceNumber;
  payment.notes = input.notes ?? payment.notes;

  if (input.status && input.status !== payment.status) {
    payment.status = input.status;
    if (input.status === 'confirmed') {
      payment.verifiedBy = new mongoose.Types.ObjectId(auth.userId);
      payment.verifiedAt = new Date();
    }
  }

  await payment.save();
  await refreshInvoicePaymentState(payment.invoiceId, payment.tenantId);
  return payment;
}

export async function deletePayment(auth: JWTPayload, paymentId: string) {
  if (auth.role !== 'admin') {
    throw new ServiceError('Only admins can delete payments', 403);
  }

  const tenantId = getPrimaryTenantId(auth);
  const payment = await Payment.findOne({ _id: paymentId, tenantId });
  if (!payment) {
    throw new ServiceError('Payment not found', 404);
  }

  const invoiceId = payment.invoiceId;
  const paymentTenantId = payment.tenantId;
  await Payment.deleteOne({ _id: payment._id });
  await refreshInvoicePaymentState(invoiceId, paymentTenantId);
}
