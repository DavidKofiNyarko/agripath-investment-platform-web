"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getApiBaseDomain } from "@/lib/apiConfig";
import { createClient } from "@/app/utils/supabase/client";
import { useWallet } from "@/contexts/WalletContext";

const PaymentCallbackContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshWallet } = useWallet();
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

        // We need a reference to verify the payment
        // Use reference from URL, or trxref as fallback
        // This is the Paystack reference (like "wjkyuc51ysxabcq")
        const paystackReference = reference || trxref;

        if (!paystackReference) {
          throw new Error("Missing transaction reference");
        }

        setTransactionId(paystackReference);

        // First, find the transaction in our database using the Paystack reference
        // The backend verification API REQUIRES our internal transaction_id format (like "txn225862451")
        let internalTransactionId = null;
        try {
          const supabase = createClient();

          // Get current user
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            throw new Error("User not authenticated");
          }

          // Find transaction by external_id (Paystack reference) first
          const { data: transactions, error: findError } = await supabase
            .from("transactions")
            .select("transaction_id, external_id")
            .eq("external_id", paystackReference)
            .eq("profile_id", user.id)
            .limit(1);

          let transaction =
            transactions && transactions.length > 0 ? transactions[0] : null;

          // If not found by external_id, try transaction_id (in case reference is already internal ID)
          if (findError || !transaction) {
            const { data: transactionsByTxnId, error: findError2 } =
              await supabase
                .from("transactions")
                .select("transaction_id, external_id")
                .eq("transaction_id", paystackReference)
                .eq("profile_id", user.id)
                .limit(1);

            if (
              findError2 ||
              !transactionsByTxnId ||
              transactionsByTxnId.length === 0
            ) {
              setStatus("error");
              setMessage(
                "Transaction not found. Please contact support with reference: " +
                  paystackReference
              );
              return;
            }
            transaction = transactionsByTxnId[0];
          }

          internalTransactionId = transaction.transaction_id;

          // Update external_id if it doesn't match (for future lookups)
          if (
            transaction.external_id !== paystackReference &&
            !paystackReference.startsWith("txn")
          ) {
            await supabase
              .from("transactions")
              .update({ external_id: paystackReference })
              .eq("transaction_id", internalTransactionId);
          }
        } catch (findError) {
          setMessage("Unable to find transaction. Please contact support.");
          return;
        }

        // Always verify payment with backend API using internal transaction_id
        // The backend ONLY accepts transaction_id format (txn...), NOT Paystack references
        if (
          !internalTransactionId ||
          !internalTransactionId.startsWith("txn")
        ) {
          setStatus("error");
          setMessage("Invalid transaction ID format. Please contact support.");
          return;
        }

        let verificationSuccess = false;
        let verificationError = null;

        try {
          // MUST use internal transaction_id - backend does not accept Paystack references

          // Call the backend verification API directly (same as dashboard/investments pages)
          // The backend expects our internal transaction_id format (like "txn225862451")
          const apiBaseUrl = getApiBaseDomain();

          const response = await fetch(
            `${apiBaseUrl}/api/payments/verify/${internalTransactionId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            verificationError =
              errorData.message ||
              `Verification failed with status: ${response.status}`;
          } else {
            const result = await response.json();
            // Check both result.success and result.status === "success" to handle different response formats
            const isSuccess =
              result.success === true || result.status === "success";
            if (isSuccess) {
              verificationSuccess = true;
            } else {
              verificationError =
                result.message || "Unable to verify payment with backend";
            }
          }
        } catch (verifyError) {
          verificationError = "Unable to verify payment with backend";
        }

        // Only update transaction if backend verification succeeded
        // This ensures we only mark transactions as Complete when payment is actually verified
        if (verificationSuccess) {
          // Update transaction status in database
          try {
            const supabase = createClient();
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user && internalTransactionId) {
              // Update transaction status to Complete
              const { error: updateError } = await supabase
                .from("transactions")
                .update({
                  status: "Complete",
                  processed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("transaction_id", internalTransactionId)
                .eq("profile_id", user.id);

              if (updateError) {
                // Error updating transaction
              } else {
                setMessage("Payment completed successfully!");

                // Refresh wallet balance using WalletContext
                try {
                  await refreshWallet();
                } catch (refreshError) {
                  // Error refreshing wallet
                }

                setTimeout(() => {
                  router.push("/dashboard");
                }, 3000);
              }
            }
          } catch (updateError) {
            setMessage(
              "Payment verified successfully! Your wallet will be updated shortly."
            );
            setTimeout(() => {
              router.push("/dashboard");
            }, 3000);
          }
        } else {
          // Backend verification failed
          setStatus("error");
          setMessage(
            verificationError ||
              "Payment verification failed. Please contact support if you have completed the payment."
          );
        }
      } catch (error) {
        setMessage("An error occurred while processing your payment");
      }
    };

    processCallback();
  }, [searchParams, router, refreshWallet]);

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
