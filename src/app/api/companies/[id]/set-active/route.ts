import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { User } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { canAccessTenant } from '@/services/tenantAccess';
import { signToken, signRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload || auth.payload.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!canAccessTenant(auth.payload, params.id)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      auth.payload.userId,
      { companyId: params.id, tenantId: params.id },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role as 'admin' | 'client',
      tenantId: params.id,
      companyIds: user.companyIds?.map((id: any) => id.toString()),
      companyId: params.id,
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json({ success: true }, { status: 200 });

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

    response.cookies.set('activeTenant', params.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Set active company error:', error);
    return NextResponse.json({ success: false, error: 'Failed to switch company' }, { status: 500 });
  }
}
