import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Client, ClientOTP, User, CompanyConfig } from '@/lib/db/models';
import { sendEmail } from '@/lib/email/transporter';
import { generateClientOTPEmailHTML } from '@/lib/email/templates';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    const client = await Client.findOne({ email: email.toLowerCase().trim(), status: 'active' });

    // Always respond success — don't reveal whether email exists
    if (!client) {
      return NextResponse.json({ success: true });
    }

    // Delete any existing OTP for this email
    await ClientOTP.deleteMany({ email: email.toLowerCase().trim() });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await ClientOTP.create({
      email: email.toLowerCase().trim(),
      otp,
      clientId: client._id,
      tenantId: client.tenantId,
      expiresAt,
    });

    // Find SMTP config for this company
    const admin = await User.findOne({ role: 'admin', companyIds: client.tenantId });
    const config = admin ? await CompanyConfig.findOne({ userId: admin._id }) : null;

    const hasSmtp = config?.smtpHost && config?.smtpUser && config?.smtpPass;
    const fromAddress = config?.senderName
      ? `"${config.senderName}" <${config.fromEmail ?? config.smtpUser}>`
      : (config?.fromEmail ?? config?.smtpUser ?? process.env.SMTP_FROM ?? '');

    const companyDisplayName = config?.companyName || 'Invoice Portal';
    const html = generateClientOTPEmailHTML({ otp, companyName: companyDisplayName });

    if (hasSmtp) {
      await sendEmail({
        to: client.email,
        subject: 'Your invoice portal login code',
        html,
        smtpConfig: {
          host: config!.smtpHost!,
          port: config!.smtpPort ?? 587,
          user: config!.smtpUser!,
          pass: config!.smtpPass!,
          from: fromAddress,
        },
      });
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendEmail({
        to: client.email,
        subject: 'Your invoice portal login code',
        html,
        from: process.env.SMTP_FROM,
      });
    } else {
      // Dev fallback — log OTP to console
      console.log(`[DEV] OTP for ${client.email}: ${otp}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Request OTP error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send code' }, { status: 500 });
  }
}
