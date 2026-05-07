import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import { User } from '@/lib/db/models';
import { comparePassword } from '@/lib/auth/password';
import { signToken, signRefreshToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message);
      return NextResponse.json(
        { success: false, error: errors[0] || 'Validation failed' },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate tokens
    const activeTenant = user.tenantId || user.companyId || user.companyIds?.[0];
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      ...(activeTenant ? { tenantId: activeTenant.toString() } : {}),
      ...(user.role === 'admin' && {
        companyIds: user.companyIds?.map((id: any) => id.toString()),
      }),
      ...(user.role === 'client' && {
        clientId: user.clientId?.toString(),
        companyId: user.companyId?.toString(),
      }),
    };

    const token = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Set HTTP-only cookies
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
            tenantId: activeTenant?.toString(),
            companyIds: user.companyIds?.map((id: any) => id.toString()),
            clientId: user.clientId?.toString(),
            companyId: user.companyId?.toString(),
          },
          token,
        },
      },
      { status: 200 }
    );

    // Set secure HTTP-only cookies
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Non-httpOnly cookie so client JS can read the active tenant for UI purposes only
    if (tokenPayload.tenantId) {
      response.cookies.set('activeTenant', tokenPayload.tenantId, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
      });
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
