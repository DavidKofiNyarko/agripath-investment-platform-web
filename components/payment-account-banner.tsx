"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useProfile } from "@/contexts/ProfileContext";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, ArrowRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/app/utils/supabase/client";

const PaymentAccountBanner: React.FC = () => {
  const { profile } = useProfile();
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const [accounts, setAccounts] = useState<
    Array<{
      id: string;
      profile_id: string;
      type: "bank" | "momo";
      created_at: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch user accounts
  const fetchAccounts = useCallback(async () => {
    if (!profile) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("payment_accounts")
        .select("*")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) {
        // If table doesn't exist, just return empty array
        if (error.code === "42P01") {
          setAccounts([]);
          return;
        }
        setAccounts([]);
        return;
      }

      setAccounts(data || []);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [profile, supabase]);

  // Load accounts when profile is available
  useEffect(() => {
    if (profile) {
      fetchAccounts();
    }
  }, [profile, fetchAccounts]);

  // Show banner if:
  // - User has a profile
  // - User has no payment accounts
  // - Banner hasn't been dismissed
  const hasAnyAccount = accounts.length > 0;
  const shouldShowBanner =
    !isDismissed && !isLoading && profile && !hasAnyAccount;

  if (!shouldShowBanner) return null;

  const handleAddAccount = () => {
    router.push("/settings?tab=accounts");
    // The settings page will handle opening the add account sheet via URL param
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 w-full bg-blue-50 border-b border-blue-200"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-blue-600 mt-0.5 sm:mt-0" />
              <p className="text-xs sm:text-sm font-medium text-blue-800 flex-1">
                Add your payment account information to enable quick withdrawals
                and payouts. You can add both a bank account and a mobile money
                account.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleAddAccount}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm w-full sm:w-auto"
              >
                Add Account
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 sm:p-1 rounded-md hover:bg-white/50 transition-colors text-blue-600 hover:text-blue-700 flex-shrink-0"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PaymentAccountBanner;

