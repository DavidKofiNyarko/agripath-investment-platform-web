"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getApiBaseDomain } from "@/lib/apiConfig";

const PaymentCallbackContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get parameters from URL
        const trxref = searchParams.get("trxref");
        const reference = searchParams.get("reference");
        const status = searchParams.get("status");

        console.log("Payment callback received:", {
          trxref,
          reference,
          status,
        });

        // We need a reference to verify the payment
        // Use reference from URL, or trxref as fallback
        // This is the Paystack reference (like "wjkyuc51ysxabcq")
        const paystackReference = reference || trxref;

        if (!paystackReference) {
          throw new Error("Missing transaction reference");
        }

        setTransactionId(paystackReference);

        // First, find the transaction in our database using the Paystack reference
        // The backend verification API expects our internal transaction_id format (like "txn225862451")
        let internalTransactionId = null;
        try {
          const findResponse = await fetch("/api/payments/update-transaction", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference: paystackReference,
              status: "pending", // Check mode - just find the transaction
            }),
          });

          const findResult = await findResponse.json();
          if (findResponse.ok && findResult.success && findResult.transaction) {
            internalTransactionId = findResult.transaction.transaction_id;
            console.log("Found transaction with internal ID:", internalTransactionId);
          }
        } catch (findError) {
          console.error("Error finding transaction:", findError);
        }

        // Always verify payment with backend API
        // Don't trust URL status parameters alone
        let verificationSuccess = false;
        let verificationError = null;

        try {
          // Use internal transaction_id if found, otherwise fall back to Paystack reference
          const verificationReference = internalTransactionId || paystackReference;
          console.log("Verifying payment with reference:", verificationReference);

          // Call the backend verification API directly (same as dashboard/investments pages)
          // The backend expects our internal transaction_id format (like "txn225862451")
          const apiBaseUrl = getApiBaseDomain();

          const response = await fetch(
            `${apiBaseUrl}/api/payments/verify/${verificationReference}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            verificationError = errorData.message || `Verification failed with status: ${response.status}`;
            console.warn("Backend verification failed:", verificationError);
            // Don't throw - we'll try to update transaction from database instead
          } else {
            const result = await response.json();
            console.log("Payment verification result:", result);

            // Only mark as success if the backend confirms payment was successful
            if (result.status === "success" || result.success === true) {
              verificationSuccess = true;
            } else {
              verificationError = result.message || "Payment verification failed";
            }
          }
        } catch (verifyError) {
          console.error("Payment verification error:", verifyError);
          verificationError = "Unable to verify payment with backend";
          // Don't throw - we'll try to update transaction from database instead
        }

        // Only update transaction if backend verification succeeded
        // This ensures we only mark transactions as Complete when payment is actually verified
        if (verificationSuccess) {
          // Try to update transaction status from our database
          try {
            const updateResponse = await fetch("/api/payments/update-transaction", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference: paystackReference, // Use Paystack reference to find transaction
                status: "success",
              }),
            });

            const updateResult = await updateResponse.json();
            
            if (updateResponse.ok && updateResult.success) {
              // Transaction was found and updated
              setStatus("success");
              setMessage("Payment completed successfully!");

              // Refresh wallet balance
              try {
                await fetch("/api/wallet/refresh", { method: "POST" });
              } catch (refreshError) {
                console.error("Failed to refresh wallet:", refreshError);
              }

              // Redirect to dashboard after 3 seconds
              setTimeout(() => {
                router.push("/dashboard");
              }, 3000);
            } else {
              // Backend says success but transaction not in our DB
              // This might happen if transaction wasn't created yet
              setStatus("success");
              setMessage("Payment verified successfully! Your wallet will be updated shortly.");
              setTimeout(() => {
                router.push("/dashboard");
              }, 3000);
            }
          } catch (updateError) {
            console.error("Error updating transaction status:", updateError);
            // Backend verification succeeded but update failed
            setStatus("success");
            setMessage("Payment verified successfully! Your wallet will be updated shortly.");
            setTimeout(() => {
              router.push("/dashboard");
            }, 3000);
          }
        } else {
          // Backend verification failed - check if transaction exists in our database
          try {
            const checkResponse = await fetch("/api/payments/update-transaction", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference: paystackReference, // Use Paystack reference to find transaction
                status: "pending", // Don't update status, just check if transaction exists
              }),
            });

            const checkResult = await checkResponse.json();
            
            if (checkResponse.ok && checkResult.success && checkResult.transaction) {
              // Transaction exists but payment not yet verified
              setStatus("loading");
              setMessage(
                "Payment is being processed. The transaction was found but payment verification is pending. Please wait a few moments and refresh, or contact support if payment was completed."
              );
            } else {
              // Transaction not found in our database
              setStatus("error");
              setMessage(
                verificationError ||
                  "Transaction not found. Please contact support if you have completed the payment."
              );
            }
          } catch (checkError) {
            console.error("Error checking transaction:", checkError);
            setStatus("error");
            setMessage(
              verificationError ||
                "Unable to process payment. Please contact support if you have completed the payment."
            );
          }
        }
      } catch (error) {
        console.error("Payment callback error:", error);
        setStatus("error");
        setMessage("An error occurred while processing your payment");
      }
    };

    processCallback();
  }, [searchParams, router]);

  const handleRetry = () => {
    router.push("/dashboard");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="text-center">
            {status === "loading" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 className="h-10 w-10 text-blue-600" />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="h-10 w-10 text-red-600" />
                </div>
              </motion.div>
            )}

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {status === "loading" && "Processing Payment..."}
              {status === "success" && "Payment Successful!"}
              {status === "error" && "Payment Failed"}
            </h1>

            <p className="text-gray-600 mb-6">
              {status === "loading" &&
                "Please wait while we verify your payment..."}
              {status === "success" && message}
              {status === "error" && message}
            </p>

            {transactionId && (
              <p className="text-sm text-gray-500 mb-6">
                Transaction ID:{" "}
                <span className="font-mono">{transactionId}</span>
              </p>
            )}

            {status === "loading" && (
              <div className="text-sm text-gray-500">
                This may take a few moments...
              </div>
            )}

            {status === "success" && (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Redirecting to dashboard in 3 seconds...
                </p>
                <Button
                  onClick={handleGoToDashboard}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3">
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={handleGoToDashboard}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const PaymentCallbackPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex flex-col items-center justify-center text-center">
              <Loader2 className="h-16 w-16 text-blue-600 mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Loading...
              </h2>
              <p className="text-gray-600">
                Please wait while we process your payment...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
};

export default PaymentCallbackPage;
