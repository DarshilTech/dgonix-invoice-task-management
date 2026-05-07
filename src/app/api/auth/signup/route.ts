import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { User } from '@/lib/db/models';
import { hashPassword } from '@/lib/auth/password';
import { signToken, signRefreshToken, type JWTPayload } from '@/lib/auth/jwt';
import { signupSchema } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message);
      return NextResponse.json(
        { success: false, error: errors[0] || 'Validation failed' },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = validation.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      role: 'admin',
      companyIds: [],
      emailVerified: false,
    });

    const tokenPayload: JWTPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: 'admin',
      companyIds: [],
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          token,
        },
      },
      { status: 201 }
    );

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
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
