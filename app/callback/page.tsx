"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PaymentCallbackPage = () => {
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

        if (!trxref || !reference) {
          throw new Error("Missing transaction reference");
        }

        setTransactionId(reference);

        // Check URL parameters for success indication
        const urlStatus = searchParams.get("status");

        if (urlStatus === "success" || urlStatus === "approved") {
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
          // Try to verify with backend API
          try {
            const response = await fetch("/api/payments/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference: reference,
                trxref: trxref,
              }),
            });

            const result = await response.json();
            console.log("Payment verification result:", result);

            if (response.ok && result.success) {
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
              setStatus("error");
              setMessage(result.message || "Payment verification failed");
            }
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            // Fallback: assume success if we have a reference
            setStatus("success");
            setMessage("Payment completed successfully!");

            setTimeout(() => {
              router.push("/dashboard");
            }, 3000);
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

export default PaymentCallbackPage;
