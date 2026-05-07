import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Invoice, Company, Client, CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { generateInvoicePDF } from '@/lib/pdf/generateInvoicePDF';
import { getAccessibleTenantIds, getPrimaryTenantId } from '@/services/tenantAccess';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const query: Record<string, any> = { _id: params.id };
    if (auth.payload.role === 'admin') {
      query.tenantId = { $in: getAccessibleTenantIds(auth.payload) };
    } else {
      query.tenantId = getPrimaryTenantId(auth.payload);
      query.clientId = auth.payload.clientId;
    }

    const invoice = await Invoice.findOne(query);

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch related data
    const [company, client, config] = await Promise.all([
      Company.findById(invoice.tenantId),
      Client.findById(invoice.clientId),
      CompanyConfig.findOne({ userId: auth.payload.userId }),
    ]);

    if (!company || !client) {
      return NextResponse.json(
        { success: false, error: 'Invoice data incomplete' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdf = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      paymentReference: invoice.paymentReference,
      company: {
        name: config?.companyName || company.name,
        email: config?.companyEmail || company.email,
        address: config?.address || company.address,
        city: config?.city || company.city,
        state: config?.state || company.state,
        zip: config?.zip || company.zip,
        country: config?.country || company.country,
        logo: config?.logo || company.logo,
        website: config?.website,
        wiseTransferRef: config?.wiseTransferRef || company.wiseTransferRef,
      },
      client: {
        name: client.name,
        email: client.email,
        address: client.address,
        city: client.city,
        state: client.state,
        zip: client.zip,
        country: client.country,
      },
      lineItems: invoice.lineItems,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      balanceAmount: invoice.balanceAmount,
      currency: invoice.currency,
      notes: invoice.notes,
      terms: invoice.terms,
      wiseInstructions: invoice.wiseInstructions,
    });

    // Return PDF with appropriate headers
    const response = new NextResponse(Buffer.from(pdf) as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

    return response;
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate PDF' }, { status: 500 });
  }
}
