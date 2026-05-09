import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { CompanyConfig } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  const subdomain = request.nextUrl.searchParams.get('subdomain')?.toLowerCase().trim();

  if (!subdomain) {
    return NextResponse.json({ available: false, error: 'Subdomain is required' }, { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(subdomain) || subdomain.length < 3) {
    return NextResponse.json({ available: false });
  }

  try {
    await connectDB();
    const existing = await CompanyConfig.findOne({ subdomain });
    return NextResponse.json({ available: !existing });
  } catch (error) {
    console.error('Subdomain check error:', error);
    return NextResponse.json({ available: false, error: 'Check failed' }, { status: 500 });
  }
}
