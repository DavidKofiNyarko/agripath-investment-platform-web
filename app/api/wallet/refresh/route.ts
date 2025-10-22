import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (walletError) {
      console.error("Error fetching wallet:", walletError);
      return NextResponse.json(
        { success: false, message: "Failed to fetch wallet" },
        { status: 500 }
      );
    }

    // Return current wallet data
    return NextResponse.json({
      success: true,
      wallet: wallet,
    });
  } catch (error) {
    console.error("Wallet refresh error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
