import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, trxref } = body;

    if (!reference || !trxref) {
      return NextResponse.json(
        { success: false, message: "Missing transaction reference" },
        { status: 400 }
      );
    }

    console.log("Verifying payment:", { reference, trxref });

    // Call Paystack verification API
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await paystackResponse.json();

    console.log("Paystack verification response:", paystackData);

    if (!paystackResponse.ok) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 }
      );
    }

    // Check if payment was successful
    if (paystackData.status && paystackData.data.status === "success") {
      // Payment was successful
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
        data: {
          reference: paystackData.data.reference,
          amount: paystackData.data.amount,
          currency: paystackData.data.currency,
          status: paystackData.data.status,
          paid_at: paystackData.data.paid_at,
          customer: paystackData.data.customer,
        },
      });
    } else {
      // Payment was not successful
      return NextResponse.json(
        {
          success: false,
          message:
            paystackData.data.gateway_response || "Payment was not successful",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
