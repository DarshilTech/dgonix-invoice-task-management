import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Invoice, Client, CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { generateInvoicePDF } from '@/lib/pdf/generateInvoicePDF';
import { sendEmail } from '@/lib/email/transporter';
import { generateInvoiceEmailHTML } from '@/lib/email/templates';
import { getAccessibleTenantIds } from '@/services/tenantAccess';
import { formatDate } from '@/lib/utils/helpers';

export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const tenantIds = getAccessibleTenantIds(auth.payload);
    const invoice = await Invoice.findOne({
      _id: params.id,
      tenantId: { $in: tenantIds },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const [client, config] = await Promise.all([
      Client.findById(invoice.clientId),
      CompanyConfig.findOne({ userId: auth.payload.userId }),
    ]);

    if (!client) {
      return NextResponse.json({ success: false, error: 'Invoice data incomplete' }, { status: 400 });
    }

    if (!config?.smtpHost || !config?.smtpUser || !config?.smtpPass) {
      return NextResponse.json(
        { success: false, error: 'Email (SMTP) configuration not set up. Go to Settings → Company to configure.' },
        { status: 400 }
      );
    }

    const pdf = await generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      paymentReference: invoice.paymentReference,
      company: {
        name: config?.companyName || '',
        email: config?.companyEmail || '',
        address: config?.address,
        city: config?.city,
        state: config?.state,
        zip: config?.zip,
        country: config?.country,
        logo: config?.logo,
        wiseTransferRef: config?.wiseTransferRef,
      },
      client: {
        name: client.name,
        email: client.email,
        address: client.billingStreet,
        city: client.billingCity,
        state: client.billingState,
        zip: client.billingPostalCode,
        country: client.billingCountry,
      },
      lineItems: invoice.lineItems,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      discountType: invoice.discountType,
      discountAmount: invoice.discountAmount,
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const companyName = config?.companyName || '';
    const emailHTML = generateInvoiceEmailHTML({
      clientName: client.name,
      invoiceNumber: invoice.invoiceNumber,
      total: `${invoice.currency} ${invoice.total.toFixed(2)}`,
      dueDate: formatDate(invoice.dueDate),
      paymentReference: invoice.paymentReference,
      companyName,
      companyEmail: config?.companyEmail || '',
      invoiceUrl: `${appUrl}/client/invoices/${invoice._id}`,
    });

    await sendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${companyName}`,
      html: emailHTML,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdf,
          contentType: 'application/pdf',
        },
      ],
      smtpConfig: {
        host: config.smtpHost,
        port: config.smtpPort || 587,
        user: config.smtpUser,
        pass: config.smtpPass,
        from: config.senderName
          ? `"${config.senderName}" <${config.fromEmail ?? config.smtpUser}>`
          : (config.fromEmail ?? config.smtpUser ?? ''),
      },
    });

    invoice.status = 'sent';
    invoice.sentAt = new Date();
    await invoice.save();

    return NextResponse.json(
      { success: true, message: 'Invoice sent successfully', data: invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send invoice' }, { status: 500 });
  }
}
