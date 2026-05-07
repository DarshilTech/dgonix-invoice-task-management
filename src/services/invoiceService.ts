import mongoose from 'mongoose';
import { Invoice, Payment, type LineItem } from '@/lib/db/models';

type LineItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  tax?: number;
};

export function roundMoney(amount: number) {
  return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
}

export function calculateInvoiceTotals(lineItems: LineItemInput[], taxRate = 0) {
  let subtotal = 0;
  let taxAmount = 0;

  const processedLineItems: LineItem[] = lineItems.map((item) => {
    const itemSubtotal = roundMoney(item.quantity * item.unitPrice);
    const itemTax = roundMoney(item.tax ?? itemSubtotal * (taxRate / 100));
    subtotal = roundMoney(subtotal + itemSubtotal);
    taxAmount = roundMoney(taxAmount + itemTax);

    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      tax: itemTax,
      total: roundMoney(itemSubtotal + itemTax),
    };
  });

  const totalAmount = roundMoney(subtotal + taxAmount);

  return {
    lineItems: processedLineItems,
    subtotal,
    taxAmount,
    total: totalAmount,
    totalAmount,
    balanceAmount: totalAmount,
  };
}

export async function getConfirmedPaidAmount(
  invoiceId: string | mongoose.Types.ObjectId,
  tenantId: string | mongoose.Types.ObjectId,
  excludePaymentId?: string
) {
  const match: Record<string, unknown> = {
    invoiceId: new mongoose.Types.ObjectId(invoiceId.toString()),
    tenantId: new mongoose.Types.ObjectId(tenantId.toString()),
    status: 'confirmed',
  };

  if (excludePaymentId) {
    match._id = { $ne: new mongoose.Types.ObjectId(excludePaymentId) };
  }

  const [result] = await Payment.aggregate([
    { $match: match },
    { $group: { _id: '$invoiceId', paidAmount: { $sum: '$amount' } } },
  ]);

  return roundMoney(result?.paidAmount || 0);
}

export async function refreshInvoicePaymentState(
  invoiceId: string | mongoose.Types.ObjectId,
  tenantId: string | mongoose.Types.ObjectId
) {
  const invoice = await Invoice.findOne({ _id: invoiceId, tenantId });
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const paidAmount = await getConfirmedPaidAmount(invoice._id, invoice.tenantId);
  const totalAmount = invoice.totalAmount ?? invoice.total;
  const balanceAmount = Math.max(0, roundMoney(totalAmount - paidAmount));

  let status = invoice.status;
  if (paidAmount <= 0) {
    status = invoice.status === 'draft' ? 'draft' : 'sent';
  } else if (paidAmount < totalAmount) {
    status = 'partially_paid';
  } else {
    status = 'paid';
  }

  invoice.paidAmount = paidAmount;
  invoice.balanceAmount = balanceAmount;
  invoice.status = status;
  invoice.paidAt = status === 'paid' ? invoice.paidAt || new Date() : undefined;

  await invoice.save();
  return invoice;
}
