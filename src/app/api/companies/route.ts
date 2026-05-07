import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { Company, User } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { companySchema } from '@/lib/validation/company';
import { getAccessibleTenantIds } from '@/services/tenantAccess';
import { signToken, signRefreshToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);

    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const ids = getAccessibleTenantIds(auth.payload);
    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const companies = await Company.find({ _id: { $in: ids } });

    return NextResponse.json({ success: true, data: companies }, { status: 200 });
  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
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
    const validation = companySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const company = await Company.create({
      ...validation.data,
      fromEmail: validation.data.fromEmail || validation.data.email,
    });

    // Fetch current user to check if this is their first company
    const user = await User.findById(auth.payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const isFirstCompany = !user.companyIds || user.companyIds.length === 0;

    await User.findByIdAndUpdate(auth.payload.userId, {
      $addToSet: { companyIds: company._id },
      ...(isFirstCompany ? { tenantId: company._id, companyId: company._id } : {}),
    });

    const response = NextResponse.json({ success: true, data: company }, { status: 201 });

    if (isFirstCompany) {
      // Re-issue JWT so this company becomes the active tenant immediately
      const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role as 'admin' | 'client',
        tenantId: company._id.toString(),
        companyIds: [company._id.toString()],
        companyId: company._id.toString(),
      };

      const token = signToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);

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

      response.cookies.set('activeTenant', company._id.toString(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
