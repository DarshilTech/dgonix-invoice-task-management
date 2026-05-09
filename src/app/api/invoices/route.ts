import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Invoice, Company, Client, CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { createInvoiceSchema } from '@/lib/validation/invoice';
import { generatePaymentReference } from '@/lib/utils/helpers';
import { calculateInvoiceTotals } from '@/services/invoiceService';

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
    const companyId = searchParams.get('tenantId') || searchParams.get('companyId') || undefined;
    const search = searchParams.get('search') || '';

    const query: Record<string, unknown> = {};

    if (auth.payload.role === 'admin') {
      if (companyId) {
        const company = await Company.findOne({ _id: companyId, ownerId: auth.payload.userId });
        if (!company) {
          return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
        }
        query.tenantId = companyId;
      } else {
        const ownedCompanies = await Company.find({ ownerId: auth.payload.userId }).select('_id');
        if (ownedCompanies.length === 0) {
          return NextResponse.json(
            { success: true, data: { invoices: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } } },
            { status: 200 }
          );
        }
        query.tenantId = { $in: ownedCompanies.map((c) => c._id) };
      }
    } else {
      query.tenantId = auth.payload.tenantId;
      query.clientId = auth.payload.clientId;
    }

    if (status && status !== 'all') query.status = status;
    if (clientId && auth.payload.role === 'admin') query.clientId = clientId;
    if (search) query.invoiceNumber = { $regex: search, $options: 'i' };

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
          pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch invoices' }, { status: 500 });
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
      clientId, invoiceDate, dueDate, lineItems, taxRate, notes, terms, currency, status,
      discount, discountType, partial, poNumber, invoiceNumber: customInvoiceNumber,
    } = validation.data;

    // Auto-find the user's company if no tenantId supplied
    const rawTenantId = validation.data.tenantId || validation.data.companyId;
    const company = rawTenantId
      ? await Company.findOne({ _id: rawTenantId, ownerId: auth.payload.userId }).lean() as { _id: unknown; invoicePrefix?: string } | null
      : await Company.findOne({ ownerId: auth.payload.userId }).lean() as { _id: unknown; invoicePrefix?: string } | null;

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    const tenantId = String(company._id);

    const client = await Client.findOne({ _id: clientId, tenantId });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const config = await CompanyConfig.findOne({ userId: auth.payload.userId }).lean() as { invoicePrefix?: string } | null;
    const prefix = config?.invoicePrefix?.trim() || (company as any).invoicePrefix?.trim() || 'INV';

    // Derive next sequence from actual invoices — always starts at 1 for new companies
    const lastInvoice = await Invoice.findOne({ tenantId })
      .sort({ createdAt: -1 })
      .select('invoiceNumber')
      .lean() as { invoiceNumber?: string } | null;

    const existingMaxSeq = (() => {
      if (!lastInvoice?.invoiceNumber) return 0;
      const parts = String(lastInvoice.invoiceNumber).split('-');
      return parseInt(parts[parts.length - 1], 10) || 0;
    })();

    const seq = existingMaxSeq + 1;

    // Keep Company.invoiceSequence in sync
    await Company.updateOne({ _id: tenantId }, { $set: { invoiceSequence: seq } });

    // Use custom number if provided, otherwise auto-generate
    const invoiceNumber = customInvoiceNumber?.trim()
      ? customInvoiceNumber.trim()
      : `${prefix}-${String(seq).padStart(6, '0')}`;
    const paymentReference = generatePaymentReference();
    const totals = calculateInvoiceTotals(lineItems, taxRate || 0, discount || 0, discountType || 'Amount');

    const invoice = await Invoice.create({
      tenantId,
      companyId: tenantId,
      clientId,
      invoiceNumber,
      invoiceDate: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      paymentReference,
      status,
      lineItems:      totals.lineItems,
      discount:       discount || 0,
      discountType:   discountType || 'Amount',
      discountAmount: totals.discountAmount,
      partial:        partial || 0,
      poNumber:       poNumber || '',
      subtotal:       totals.subtotal,
      taxRate,
      taxAmount:      totals.taxAmount,
      total:          totals.total,
      totalAmount:    totals.totalAmount,
      paidAmount:     0,
      balanceAmount:  totals.balanceAmount,
      currency,
      notes,
      terms,
    });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create invoice' }, { status: 500 });
  }
}
