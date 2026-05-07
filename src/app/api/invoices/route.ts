import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Invoice, Company, Client } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { createInvoiceSchema } from '@/lib/validation/invoice';
import { generateInvoiceNumber, generatePaymentReference } from '@/lib/utils/helpers';
import { calculateInvoiceTotals } from '@/services/invoiceService';
import {
  getAccessibleTenantIds,
  requireTenantAccess,
} from '@/services/tenantAccess';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const tenantId = searchParams.get('tenantId') || searchParams.get('companyId') || undefined;
    const search = searchParams.get('search') || '';

    const tenantIds = getAccessibleTenantIds(auth.payload);
    const query: Record<string, any> = {};

    if (tenantId) {
      requireTenantAccess(auth.payload, tenantId);
      query.tenantId = tenantId;
    } else if (auth.payload.role === 'admin') {
      if (tenantIds.length === 0) {
        return NextResponse.json(
          { success: true, data: { invoices: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } } },
          { status: 200 }
        );
      }
      query.tenantId = { $in: tenantIds };
    } else {
      if (tenantIds.length === 0) {
        return NextResponse.json(
          { success: true, data: { invoices: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } } },
          { status: 200 }
        );
      }
      query.tenantId = tenantIds[0];
      query.clientId = auth.payload.clientId;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (clientId && auth.payload.role === 'admin') {
      query.clientId = clientId;
    }

    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('clientId', 'name email')
        .populate('companyId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          invoices,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get invoices error:', error);
    const status = error instanceof Error && error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 403 ? 'Forbidden' : 'Failed to fetch invoices' },
      { status }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validation = createInvoiceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const {
      companyId,
      clientId,
      invoiceDate,
      dueDate,
      lineItems,
      taxRate,
      notes,
      terms,
      currency,
      status,
    } = validation.data;
    const tenantId = validation.data.tenantId || companyId;
    requireTenantAccess(auth.payload, tenantId);

    const company = await Company.findById(tenantId);
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    const client = await Client.findOne({
      _id: clientId,
      tenantId,
    });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const totals = calculateInvoiceTotals(lineItems, taxRate || 0);
    const invoiceCount = await Invoice.countDocuments({ tenantId });
    const invoiceNumber = generateInvoiceNumber(company.invoicePrefix, invoiceCount);
    const paymentReference = generatePaymentReference();

    const invoice = await Invoice.create({
      tenantId,
      companyId: tenantId,
      clientId,
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      paymentReference,
      status,
      lineItems: totals.lineItems,
      subtotal: totals.subtotal,
      taxRate,
      taxAmount: totals.taxAmount,
      total: totals.total,
      totalAmount: totals.totalAmount,
      paidAmount: 0,
      balanceAmount: totals.balanceAmount,
      currency,
      notes,
      terms,
    });

    return NextResponse.json(
      {
        success: true,
        data: invoice,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create invoice error:', error);
    const status = error instanceof Error && error.message === 'Forbidden' ? 403 : 500;
    return NextResponse.json(
      { success: false, error: status === 403 ? 'Forbidden' : 'Failed to create invoice' },
      { status }
    );
  }
}
