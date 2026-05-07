import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Invoice, Company, Client, CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { generateInvoicePDF } from '@/lib/pdf/generateInvoicePDF';
import { sendEmail } from '@/lib/email/transporter';
import { generateInvoiceEmailHTML } from '@/lib/email/templates';
import { formatDate } from '@/lib/utils/helpers';
import { getAccessibleTenantIds } from '@/services/tenantAccess';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const invoice = await Invoice.findOne({
      _id: params.id,
      tenantId: { $in: getAccessibleTenantIds(auth.payload) },
    });

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch company, client, and admin's business config
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

    // Check SMTP configured in CompanyConfig (admin's business settings)
    if (!config?.smtpHost || !config?.smtpUser || !config?.smtpPass) {
      return NextResponse.json(
        { success: false, error: 'Email (SMTP) configuration not set up. Go to Settings → Company to configure.' },
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

    // Generate email HTML
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const emailHTML = generateInvoiceEmailHTML({
      clientName: client.name,
      invoiceNumber: invoice.invoiceNumber,
      total: `${invoice.currency} ${invoice.total.toFixed(2)}`,
      dueDate: formatDate(invoice.dueDate),
      paymentReference: invoice.paymentReference,
      companyName: config?.companyName || company.name,
      companyEmail: config?.companyEmail || company.email,
      invoiceUrl: `${appUrl}/client/invoices/${invoice._id}`,
    });

    const displayName = config?.companyName || company.name;
    // Send email
    await sendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${displayName}`,
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

    // Update invoice status to 'sent'
    invoice.status = 'sent';
    invoice.sentAt = new Date();
    await invoice.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice sent successfully',
        data: invoice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send invoice' }, { status: 500 });
  }
}
