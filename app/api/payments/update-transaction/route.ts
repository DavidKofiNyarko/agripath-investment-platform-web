import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const body = await request.json();
    const { reference, status } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, message: "Transaction reference is required" },
        { status: 400 }
      );
    }

    // Find the transaction by external_id (Paystack reference) or transaction_id
    // Paystack references are like "ktj1dmin473gq1r" (alphanumeric, no "txn" prefix)
    // Our internal transaction_id format is like "txn345177706"
    
    // First try external_id (Paystack reference) - this is what Paystack returns in callback
    let { data: transaction, error: findError } = await supabase
      .from("transactions")
      .select("id, profile_id, status, type, amount, external_id, transaction_id")
      .eq("external_id", reference)
      .eq("profile_id", user.id)
      .single();

    // If not found by external_id, try transaction_id (our internal format)
    if (findError || !transaction) {
      const { data: transactionByTxnId, error: findError2 } = await supabase
        .from("transactions")
        .select("id, profile_id, status, type, amount, external_id, transaction_id")
        .eq("transaction_id", reference)
        .eq("profile_id", user.id)
        .single();

      if (findError2 || !transactionByTxnId) {
        // If still not found, the reference might be a Paystack reference that wasn't stored
        // This can happen if the backend didn't properly store the Paystack reference
        // Return error - we can't safely match without the reference
        return NextResponse.json(
          { 
            success: false, 
            message: "Transaction not found. The Paystack reference may not have been stored in the database. Please contact support with the reference: " + reference
          },
          { status: 404 }
        );
      } else {
        transaction = transactionByTxnId;
      }
    }
    
    // If we found a transaction but the external_id doesn't match the Paystack reference,
    // update it so future lookups work correctly
    if (transaction && transaction.external_id !== reference && !reference.startsWith("txn")) {
      // This is likely a Paystack reference that wasn't stored
      // Update external_id to match the Paystack reference
      const { error: updateExternalIdError } = await supabase
        .from("transactions")
        .update({ external_id: reference })
        .eq("id", transaction.id);
      
      if (updateExternalIdError) {
        console.error("Error updating external_id:", updateExternalIdError);
        // Don't fail - continue with the transaction update
      }
    }

    // If status is "pending", just return the transaction without updating (check mode)
    if (status === "pending") {
      return NextResponse.json({
        success: true,
        message: "Transaction found",
        transaction,
      });
    }

    // Only update if status is Pending
    if (transaction.status !== "Pending") {
      return NextResponse.json({
        success: true,
        message: "Transaction already processed",
        transaction,
      });
    }

    // Update transaction status to Complete or Failed
    // The database trigger will automatically update the wallet when status changes:
    // - Topups (Payin, momo_topup, card_topup): Adds to wallet when Complete
    // - Withdrawals (Payout, momo_withdrawal, bank_withdrawal): Subtracts from wallet when Complete
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        status: status === "success" ? "Complete" : "Failed",
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.id);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return NextResponse.json(
        { success: false, message: "Failed to update transaction" },
        { status: 500 }
      );
    }

    // Note: The database trigger `update_wallet_on_topup_complete_trigger` will automatically
    // update the wallet balance when transaction status changes from Pending to Complete:
    // - For topups: Adds amount to wallet
    // - For withdrawals: Subtracts amount from wallet (with balance validation)
    // - Reverses changes if status changes from Complete to Failed/Pending

    return NextResponse.json({
      success: true,
      message: "Transaction updated successfully",
    });
  } catch (error) {
    console.error("Update transaction error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

