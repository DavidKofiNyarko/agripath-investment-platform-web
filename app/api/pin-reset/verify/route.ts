import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';
import { hashPin, generateRandomPin, isValidPinFormat } from '@/lib/pin-security';

export async function POST(request: NextRequest) {
  try {
    const { token, newPin } = await request.json();

    if (!token || !newPin) {
      return NextResponse.json(
        { error: 'Token and new PIN are required' },
        { status: 400 }
      );
    }

    if (!isValidPinFormat(newPin)) {
      return NextResponse.json(
        { error: 'PIN must be a 4-digit number' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify reset token
    const { data: resetToken, error: tokenError } = await supabase
      .from('pin_reset_tokens')
      .select('profile_id, expires_at, used')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(resetToken.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Hash the new PIN
    const hashedPin = await hashPin(newPin);

    // Update user's PIN
    const { error: updateError } = await supabase
      .from('profile')
      .update({ pin: hashedPin })
      .eq('id', resetToken.profile_id);

    if (updateError) {
      console.error('Error updating PIN:', updateError);
      return NextResponse.json(
        { error: 'Failed to update PIN' },
        { status: 500 }
      );
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('pin_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    if (markUsedError) {
      console.error('Error marking token as used:', markUsedError);
      // Don't fail the request, PIN was updated successfully
    }

    return NextResponse.json(
      { message: 'PIN has been reset successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('PIN reset verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
