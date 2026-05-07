import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Invoice } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { updateInvoiceSchema } from '@/lib/validation/invoice';
import { calculateInvoiceTotals, refreshInvoicePaymentState } from '@/services/invoiceService';
import { getAccessibleTenantIds } from '@/services/tenantAccess';

function buildInvoiceAccessQuery(
  id: string,
  payload: NonNullable<ReturnType<typeof verifyRequestAuth>['payload']>,
  tenantIds: string[]
) {
  const query: Record<string, any> = { _id: id };

  if (payload.role === 'admin') {
    query.tenantId = { $in: tenantIds };
  } else {
    query.tenantId = tenantIds[0];
    query.clientId = payload.clientId;
  }

  return query;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const tenantIds = getAccessibleTenantIds(auth.payload);
    if (tenantIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const invoice = await Invoice.findOne(buildInvoiceAccessQuery(params.id, auth.payload, tenantIds))
      .populate('clientId')
      .populate('companyId');

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        data: invoice,
      },
      { status: 200 }
    );
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

    const tenantIdsPut = getAccessibleTenantIds(auth.payload);
    const invoice = await Invoice.findOne(buildInvoiceAccessQuery(params.id, auth.payload, tenantIdsPut));

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

    if (data.lineItems) {
      const totals = calculateInvoiceTotals(data.lineItems, data.taxRate ?? invoice.taxRate ?? 0);
      invoice.lineItems = totals.lineItems;
      invoice.subtotal = totals.subtotal;
      invoice.taxAmount = totals.taxAmount;
      invoice.total = totals.total;
      invoice.totalAmount = totals.totalAmount;
      invoice.balanceAmount = Math.max(0, totals.totalAmount - invoice.paidAmount);
    }

    if (data.dueDate) {
      invoice.dueDate = new Date(data.dueDate);
    }

    if (data.invoiceDate) {
      invoice.invoiceDate = new Date(data.invoiceDate);
    }

    if (data.taxRate !== undefined) invoice.taxRate = data.taxRate;
    if (data.notes !== undefined) invoice.notes = data.notes;
    if (data.terms !== undefined) invoice.terms = data.terms;
    if (data.status) invoice.status = data.status;

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

    const tenantIdsDel = getAccessibleTenantIds(auth.payload);
    const invoice = await Invoice.findOne(buildInvoiceAccessQuery(params.id, auth.payload, tenantIdsDel));

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
