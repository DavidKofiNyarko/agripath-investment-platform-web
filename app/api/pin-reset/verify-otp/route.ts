import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { generateResetToken } from '@/lib/pin-security';

export async function POST(request: NextRequest) {
  try {
    const { otp } = await request.json();

    if (!otp) {
      return NextResponse.json(
        { error: 'OTP code is required' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'OTP must be a 6-digit number' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get authenticated user from session
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser || !authUser.email) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const email = authUser.email;

    // Verify OTP with Supabase Auth
    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: 'email'
    });

    if (verifyError || !authData.user) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP code. Please try again.' },
        { status: 400 }
      );
    }

    // Get user profile and check if PIN is set
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('id, email, pin')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check if user has a PIN set (if pin is null or empty, they haven't set one)
    if (!profile.pin) {
      return NextResponse.json(
        { error: 'No PIN found. Please set up a PIN first.' },
        { status: 400 }
      );
    }

    // Generate reset token for PIN reset
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token in database
    const { error: tokenError } = await supabase
      .from('pin_reset_tokens')
      .insert({
        profile_id: profile.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        used: false
      });

    if (tokenError) {
      return NextResponse.json(
        { error: 'Failed to generate reset token' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'OTP verified successfully',
        resetToken: resetToken // Return token for PIN reset
      },
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

