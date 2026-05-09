import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { User, CompanyConfig } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

const setupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').trim(),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63)
    .regex(/^[a-z0-9-]+$/, 'Subdomain may only contain lowercase letters, numbers, and hyphens')
    .trim(),
  language: z.string().default('en'),
  currency: z.string().default('USD'),
});

export async function POST(request: NextRequest) {
  const auth = verifyRequestAuth(request);
  if (!auth.isValid || !auth.payload) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validation = setupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.errors[0]?.message }, { status: 400 });
    }

    const { companyName, subdomain, language, currency } = validation.data;

    await connectDB();

    const user = await User.findById(auth.payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check subdomain uniqueness (skip if this user already owns it)
    const existingConfig = await CompanyConfig.findOne({ userId: user._id });
    if (existingConfig?.subdomain !== subdomain) {
      const taken = await CompanyConfig.findOne({ subdomain, userId: { $ne: user._id } });
      if (taken) {
        return NextResponse.json({ success: false, error: 'Subdomain is already taken' }, { status: 400 });
      }
    }

    // Upsert CompanyConfig — userId is the single source of truth
    await CompanyConfig.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          companyName,
          companyEmail: user.email,
          fromEmail: user.email,
          invoicePrefix: 'INV',
          subdomain,
          language,
          currency,
        },
      },
      { upsert: true, new: true }
    );

    // Use user._id as tenantId — no separate Company document needed
    const tenantId = user._id;
    user.tenantId = tenantId as typeof user.tenantId;
    user.companyId = tenantId as typeof user.companyId;
    user.companyIds = [tenantId as (typeof user.companyIds)[0]];
    await user.save();

    return NextResponse.json({
      success: true,
      data: { tenantId: tenantId.toString(), companyName, subdomain },
    });
  } catch (error) {
    console.error('Onboarding setup error:', error);
    return NextResponse.json({ success: false, error: 'Setup failed' }, { status: 500 });
  }
}
