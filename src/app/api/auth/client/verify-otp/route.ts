import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Client, ClientOTP } from '@/lib/db/models';
import { signToken, signRefreshToken } from '@/lib/auth/jwt';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and code are required' }, { status: 400 });
    }

    await connectDB();

    const record = await ClientOTP.findOne({
      email: email.toLowerCase().trim(),
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Code expired or not found. Please request a new one.' },
        { status: 400 }
      );
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await ClientOTP.deleteOne({ _id: record._id });
      return NextResponse.json(
        { success: false, error: 'Too many incorrect attempts. Please request a new code.' },
        { status: 400 }
      );
    }

    if (record.otp !== otp.trim()) {
      await ClientOTP.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
      const remaining = MAX_ATTEMPTS - record.attempts - 1;
      return NextResponse.json(
        { success: false, error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` },
        { status: 400 }
      );
    }

    // OTP valid — delete it and issue JWT
    await ClientOTP.deleteOne({ _id: record._id });

    const client = await Client.findById(record.clientId);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const tokenPayload = {
      userId: client._id.toString(),
      email: client.email,
      role: 'client' as const,
      tenantId: client.tenantId.toString(),
      clientId: client._id.toString(),
      companyId: client.companyId.toString(),
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      data: { clientId: client._id.toString(), name: client.name },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 });
  }
}
