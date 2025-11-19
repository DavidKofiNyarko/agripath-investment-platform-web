import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user from session
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "Authentication required. Please log in." },
        { status: 401 }
      );
    }

    const email = authUser.email;

    if (!email) {
      return NextResponse.json(
        { error: "Email not found in your account" },
        { status: 400 }
      );
    }

    // Check if user exists with this email and has a PIN set
    const { data: profile, error: profileError } = await supabase
      .from("profile")
      .select("id, email, first_name, last_name, pin")
      .eq("email", email)
      .single();

    if (profileError || !profile) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        {
          message:
            "If an account with this email exists, a reset code has been sent to your email.",
        },
        { status: 200 }
      );
    }

    // Check if user has a PIN set (if pin is null or empty, they haven't set one)
    if (!profile.pin) {
      // Don't reveal this for security - return generic message
      return NextResponse.json(
        {
          message:
            "If an account with this email exists, a reset code has been sent to your email.",
        },
        { status: 200 }
      );
    }

    // Send OTP via email using Supabase Auth
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false, // Don't create user if doesn't exist
        data: {
          purpose: "pin_reset",
          user_name: `${profile.first_name} ${profile.last_name}`.trim(),
        },
      },
    });

    if (otpError) {
      // Log error but don't reveal to user for security
      console.error("OTP send error:", otpError);
      // Still return success message for security
    }

    return NextResponse.json(
      {
        message:
          "If an account with this email exists, a reset code has been sent to your email.",
        email: email, // Return email for client-side use
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
