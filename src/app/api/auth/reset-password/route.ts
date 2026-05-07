import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { User } from '@/lib/db/models';
import { resetPasswordSchema } from '@/lib/validation/auth';
import { generatePasswordResetToken } from '@/lib/utils/helpers';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message);
      return NextResponse.json(
        { success: false, error: errors[0] || 'Validation failed' },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, a password reset link will be sent',
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // TODO: Send email with reset link
    // const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${resetToken}`;
    console.log(`Reset token for ${email}: ${resetToken}`);

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
