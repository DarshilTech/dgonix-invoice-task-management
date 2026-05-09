import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { User, Company, CompanyConfig } from '@/lib/db/models';
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
    const invoicePrefix = "INV";

    await connectDB();

    const user = await User.findById(auth.payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Update or create the Company record
    let company;
    const existingCompany = user.companyId
      ? await Company.findOne({ _id: user.companyId, ownerId: user._id })
      : null;

    if (existingCompany) {
      existingCompany.name = companyName;
      existingCompany.subdomain = subdomain;
      existingCompany.language = language;
      existingCompany.currency = currency;
      existingCompany.invoicePrefix = invoicePrefix;
      company = await existingCompany.save();
    } else {
      // Check subdomain uniqueness only when creating a new company
      const taken = await Company.findOne({ subdomain });
      if (taken) {
        return NextResponse.json({ success: false, error: 'Subdomain is already taken' }, { status: 400 });
      }

      company = await Company.create({
        ownerId: user._id,
        name: companyName,
        email: user.email,
        fromEmail: user.email,
        subdomain,
        language,
        currency,
        invoicePrefix,
      });
    }

    // Keep CompanyConfig in sync (used by settings page and PDF generation)
    await CompanyConfig.findOneAndUpdate(
      { userId: user._id },
      { $set: { companyName, fromEmail: user.email, invoicePrefix } },
      { upsert: true, new: true }
    );

    // Link company to user
    user.tenantId = company._id as typeof user.tenantId;
    user.companyId = company._id as typeof user.companyId;
    user.companyIds = [company._id as (typeof user.companyIds)[0]];
    await user.save();

    return NextResponse.json({
      success: true,
      data: { tenantId: company._id.toString(), companyName, subdomain },
    });
  } catch (error) {
    console.error('Onboarding setup error:', error);
    return NextResponse.json({ success: false, error: 'Setup failed' }, { status: 500 });
  }
}
