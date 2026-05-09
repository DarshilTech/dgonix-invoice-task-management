import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db/connect';
import { User } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { sendEmail } from '@/lib/email/transporter';
import { generateVerificationEmailHTML } from '@/lib/email/templates';

export async function POST(request: NextRequest) {
  const auth = verifyRequestAuth(request);
  if (!auth.isValid || !auth.payload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();

    const user = await User.findById(auth.payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: false, error: 'Email already verified' }, { status: 400 });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpiry = emailVerificationExpiry;
    await user.save();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verifyLink = `${appUrl}/verify-email?token=${emailVerificationToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Account Confirmation – Invoxa',
      html: generateVerificationEmailHTML({ verifyLink, appName: 'Invoxa' }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ success: false, error: 'Failed to resend email' }, { status: 500 });
  }
}
