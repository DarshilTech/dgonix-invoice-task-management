import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const config = await CompanyConfig.findOne({ userId: auth.payload.userId }).select('companyName logo');
    if (!config) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        name: config.companyName ?? null,
        logo: config.logo ?? null,
      },
    });
  } catch (error) {
    console.error('Get user company error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch company' }, { status: 500 });
  }
}
