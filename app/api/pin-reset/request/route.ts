import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { generateResetToken } from '@/lib/pin-security';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user exists with this email
    const { data: profile, error: profileError } = await supabase
      .from('profile')
      .select('id, email, first_name, last_name')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'If an account with this email exists, a reset code has been sent.' },
        { status: 200 }
      );
    }

    // Generate reset token
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
      console.error('Error storing reset token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to process reset request' },
        { status: 500 }
      );
    }

    // Send email with reset code
    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-pin?token=${resetToken}`,
        data: {
          reset_token: resetToken,
          user_name: `${profile.first_name} ${profile.last_name}`.trim()
        }
      }
    });

    if (emailError) {
      console.error('Error sending reset email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send reset email' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'If an account with this email exists, a reset code has been sent.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('PIN reset request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
