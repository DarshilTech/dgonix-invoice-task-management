import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Invoice, Company } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { updateInvoiceSchema } from '@/lib/validation/invoice';
import { calculateInvoiceTotals, refreshInvoicePaymentState } from '@/services/invoiceService';

async function getOwnedCompanyIds(userId: string) {
  const companies = await Company.find({ ownerId: userId }).select('_id');
  return companies.map((c) => c._id);
}

async function findInvoiceForUser(
  id: string,
  payload: NonNullable<ReturnType<typeof verifyRequestAuth>['payload']>
) {
  if (payload.role === 'admin') {
    const companyIds = await getOwnedCompanyIds(payload.userId);
    return Invoice.findOne({ _id: id, tenantId: { $in: companyIds } });
  }
  return Invoice.findOne({ _id: id, tenantId: payload.tenantId, clientId: payload.clientId });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const invoice = await findInvoiceForUser(params.id, auth.payload);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    await invoice.populate('clientId');
    await invoice.populate('companyId');

    return NextResponse.json({ success: true, data: invoice }, { status: 200 });
  } catch (error) {
    console.error('Get invoice error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const invoice = await findInvoiceForUser(params.id, auth.payload);

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status !== 'draft' && invoice.paidAmount > 0) {
      return NextResponse.json(
        { success: false, error: 'Invoices with payments cannot be edited' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateInvoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = validation.data;

    const effectiveDiscount     = data.discount     ?? invoice.discount     ?? 0;
    const effectiveDiscountType = data.discountType ?? invoice.discountType ?? 'Amount';
    const effectiveTaxRate      = data.taxRate      ?? invoice.taxRate      ?? 0;

    if (data.lineItems || data.discount !== undefined || data.discountType !== undefined || data.taxRate !== undefined) {
      const items  = data.lineItems ?? invoice.lineItems;
      const totals = calculateInvoiceTotals(items, effectiveTaxRate, effectiveDiscount, effectiveDiscountType as 'Amount' | 'Percent');
      invoice.lineItems      = totals.lineItems;
      invoice.discountAmount = totals.discountAmount;
      invoice.subtotal       = totals.subtotal;
      invoice.taxAmount      = totals.taxAmount;
      invoice.total          = totals.total;
      invoice.totalAmount    = totals.totalAmount;
      invoice.balanceAmount  = Math.max(0, totals.totalAmount - invoice.paidAmount);
    }

    if (data.invoiceDate)          invoice.invoiceDate  = new Date(data.invoiceDate);
    if (data.dueDate)              invoice.dueDate      = new Date(data.dueDate);
    if (data.taxRate !== undefined)      invoice.taxRate      = data.taxRate;
    if (data.discount !== undefined)     invoice.discount     = data.discount;
    if (data.discountType !== undefined) invoice.discountType = data.discountType;
    if (data.partial !== undefined)      invoice.partial      = data.partial;
    if (data.poNumber !== undefined)     invoice.poNumber     = data.poNumber;
    if (data.notes !== undefined)        invoice.notes        = data.notes;
    if (data.terms !== undefined)        invoice.terms        = data.terms;
    if (data.status)                     invoice.status       = data.status;

    await invoice.save();
    await refreshInvoicePaymentState(invoice._id, invoice.tenantId);

    return NextResponse.json(
      {
        success: true,
        data: invoice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update invoice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const invoice = await findInvoiceForUser(params.id, auth.payload);

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.paidAmount > 0) {
      return NextResponse.json(
        { success: false, error: 'Invoices with payments cannot be deleted' },
        { status: 400 }
      );
    }

    await Invoice.deleteOne({ _id: params.id });

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
