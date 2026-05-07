import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { User } from '@/lib/db/models';
import { verifyRequestAuth } from '@/lib/auth/middleware';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(auth.payload.userId).select('firstName lastName email role');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = verifyRequestAuth(request);
    if (!auth.isValid || !auth.payload) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    if (validation.data.email) {
      const existing = await User.findOne({
        email: validation.data.email.toLowerCase(),
        _id: { $ne: auth.payload.userId },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another account' },
          { status: 409 }
        );
      }
    }

    const update: Record<string, string> = {};
    if (validation.data.firstName) update.firstName = validation.data.firstName;
    if (validation.data.lastName) update.lastName = validation.data.lastName;
    if (validation.data.email) update.email = validation.data.email.toLowerCase();

    const user = await User.findByIdAndUpdate(auth.payload.userId, update, { new: true }).select(
      'firstName lastName email role'
    );

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
