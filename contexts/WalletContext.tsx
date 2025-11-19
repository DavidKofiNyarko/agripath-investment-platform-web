"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useUser } from "./UserContext";
import {
  paymentService,
  CardPaymentRequest,
  MobileMoneyPaymentRequest,
  PayoutRequest,
} from "@/lib/paymentService";

interface Wallet {
  id: string;
  profile_id: string;
  balance: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface WalletContextType {
  wallet: Wallet | null;
  loading: boolean;
  updateBalance: (amount: number, description?: string) => Promise<boolean>;
  refreshWallet: () => Promise<void>;
  createWallet: () => Promise<void>;

  // New Wallet API Methods
  processWalletTopup: (topupData: {
    amount: number;
    channel: "card" | "momo";
    // Card fields
    pan?: string;
    exp_month?: string;
    exp_year?: string;
    cvv?: string;
    card_holder?: string;
    user_email?: string;
    // Momo fields
    subscriber_number?: string;
    network?: string;
    description?: string;
  }) => Promise<{
    success: boolean;
    redirect_url?: string;
    transaction_id?: string;
    error?: string;
  }>;

  processWalletWithdrawal: (withdrawalData: {
    amount: number;
    channel: "bank" | "momo";
    // Bank fields
    account_number?: string;
    account_bank?: string;
    // Momo fields
    recipient_number?: string;
    network?: string;
    description?: string;
  }) => Promise<{
    success: boolean;
    pending?: boolean;
    transactionId?: string;
    transferCode?: string;
    error?: string;
    details?: string;
    message?: string;
  }>;

  submitWithdrawalOTP: (otpData: {
    transactionId: string;
    transferCode: string;
    otp: string;
  }) => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;

  // Legacy Payment API Integration Methods (kept for backward compatibility)
  processCardPayment: (cardData: {
    pan: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
    card_holder: string;
    amount: number;
    project_id?: string;
  }) => Promise<{ success: boolean; redirect_url?: string; error?: string }>;

  processMobileMoneyPayment: (momoData: {
    subscriber_number: string;
    amount: number;
    project_id?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  processPayout: (payoutData: {
    amount: number;
    channel: "momo" | "bank";
    recipient_number?: string;
    account_number?: string;
    project_id?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const supabase = createClient();

  const createWallet = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("wallets")
        .insert({
          profile_id: user.id,
          balance: 0.0,
          currency: "GHS",
          status: "active",
        })
        .select()
        .single();

      if (error) {
        // Error creating wallet
        return;
      }

      if (data) {
      setWallet(data);
      }
    } catch (error) {
      // Error creating wallet
    }
  }, [user, supabase]);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("profile_id", user.id)
        .single();

      if (error) {
        setWallet(null);
        setLoading(false);
        return;
      }

      if (data) {
      setWallet(data);
      }
    } catch (error) {
      setWallet(null);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const refreshWallet = useCallback(async () => {
    setLoading(true);
    await fetchWallet();
  }, [fetchWallet]);

  const updateBalance = useCallback(
    async (amount: number, description?: string): Promise<boolean> => {
      if (!user || !wallet) return false;

      try {
        // Get current balance first
        const { data: currentWallet, error: fetchError } = await supabase
          .from("wallets")
          .select("balance")
          .eq("id", wallet.id)
          .single();

        if (fetchError || !currentWallet) {
          return false;
        }

        // Calculate new balance
        const newBalance = (currentWallet.balance || 0) + amount;

        // Update wallet balance
        const { error: updateError } = await supabase
          .from("wallets")
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", wallet.id);

        if (updateError) {
          return false;
        }

        // Update local state
        setWallet((prev) => (prev ? { ...prev, balance: newBalance } : null));
        return true;
      } catch (error) {
        return false;
      }
    },
    [user, wallet, supabase]
  );

  // Payment API Integration Methods
  const processCardPayment = useCallback(
    async (cardData: {
      pan: string;
      exp_month: string;
      exp_year: string;
      cvv: string;
      card_holder: string;
      amount: number;
      project_id?: string;
    }) => {
      if (!user || !wallet) {
        return { success: false, error: "User or wallet not found" };
      }

      try {
        // Validate card number
        if (!(paymentService as any).validateCardNumber(cardData.pan)) {
          return { success: false, error: "Invalid card number" };
        }

        const fees = (paymentService as any).calculateFees(
          cardData.amount,
          "card"
        );
        const netAmount = cardData.amount - fees;
        const transactionId = `txn${Date.now()}${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const externalId = (paymentService as any).generateExternalId();
        const cardNetwork = (paymentService as any).getCardNetwork(
          cardData.pan
        );

        const paymentRequest: CardPaymentRequest = {
          pan: cardData.pan,
          exp_month: cardData.exp_month,
          exp_year: cardData.exp_year,
          cvv: cardData.cvv,
          card_holder: cardData.card_holder,
          user_id: user.id,
          user_email: user.email || "",
          user_name: user.user_metadata?.full_name || "User",
          project_id:
            cardData.project_id || "00000000-0000-0000-0000-000000000000", // Default project for wallet top-up
          amount: cardData.amount,
          unit: 1,
          fees: fees,
          net_amount: netAmount,
          transaction_id: transactionId,
          type: "Payin",
          status: "Pending",
          desc: "Wallet top-up via card",
          processed_at: new Date(),
          r_switch: cardNetwork,
          redirect_url: `${window.location.origin}/payment/callback`,
          external_id: externalId,
          channel: "card",
          profile_id: user.id,
        };

        const response = await paymentService.processCardPayment(
          paymentRequest
        );

        if (response.status === "success") {
          // Wallet balance is updated by backend API when transaction is completed
          // No need to update balance here - backend handles it
          return { success: true };
        } else if (response.status === "vbv_required") {
          // 3D Secure required
          return { success: false, redirect_url: response.redirect_url };
        } else {
          return { success: false, error: response.reason || "Payment failed" };
        }
      } catch (error) {
        return {
          success: false,
          error: "An error occurred during payment processing",
        };
      }
    },
    [user, wallet]
  );

  // New Wallet API Methods
  const processWalletTopup = useCallback(
    async (topupData: {
      amount: number;
      channel: "card" | "momo";
      pan?: string;
      exp_month?: string;
      exp_year?: string;
      cvv?: string;
      card_holder?: string;
      user_email?: string;
      subscriber_number?: string;
      network?: string;
      description?: string;
    }) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        // Get user data from profile table (backend expects this table)
        const { data: userData } = await supabase
          .from("profile")
          .select(
            "id, user_id, kyc_status, first_name, last_name, email, phone_number"
          )
          .eq("user_id", user.id)
          .single();

        if (!userData) {
          return { success: false, error: "User not found" };
        }

        // Check KYC status - only allow topup if KYC is verified
        if (!userData.kyc_status || userData.kyc_status !== "verified") {
          return {
            success: false,
            error:
              "KYC verification required. Please complete your identity verification before making wallet transactions.",
          };
        }

        // Prepare wallet topup data based on channel
        const walletTopupData: {
          profile_id: string;
          project_id: string;
          amount: number;
          channel: "card" | "momo";
          description: string;
          kyc_status: string;
          kyc_verified: boolean;
          first_name: string;
          last_name: string;
          email: string;
          phone_number: string;
          pan?: string;
          exp_month?: string;
          exp_year?: string;
          cvv?: string;
          card_holder?: string;
          user_email?: string;
          subscriber_number?: string;
          network?: string;
        } = {
          profile_id: userData.id,
          project_id: "16beb80e-cb97-44b0-ab8e-13542a6add60", // Default project ID for wallet operations
          amount: topupData.amount,
          channel: topupData.channel,
          description:
            topupData.description || `Wallet top-up via ${topupData.channel}`,
          kyc_status: userData.kyc_status,
          kyc_verified: userData.kyc_status === "verified",
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email,
          phone_number: userData.phone_number || "",
        };

        if (topupData.channel === "card") {
          if (
            !topupData.pan ||
            !topupData.exp_month ||
            !topupData.exp_year ||
            !topupData.cvv
          ) {
            return { success: false, error: "Missing card details" };
          }
          walletTopupData.pan = topupData.pan;
          walletTopupData.exp_month = topupData.exp_month;
          walletTopupData.exp_year = topupData.exp_year;
          walletTopupData.cvv = topupData.cvv;
          walletTopupData.card_holder = topupData.card_holder || "";
          walletTopupData.user_email = topupData.user_email || userData.email;
        } else if (topupData.channel === "momo") {
          // For mobile money, network is required by backend
          // Use profile phone_number first, then subscriber_number
          const phoneNumberToUse = userData.phone_number && userData.phone_number.trim() && userData.phone_number !== "0000000000"
            ? userData.phone_number
            : (topupData.subscriber_number && topupData.subscriber_number.trim() && topupData.subscriber_number !== "0000000000"
              ? topupData.subscriber_number
              : "0000000000");

          walletTopupData.subscriber_number = phoneNumberToUse;
          
          // Get network from phone number if not provided
          walletTopupData.network = topupData.network || 
            (paymentService as any).getNetworkProvider(phoneNumberToUse) || 
            "MTN";

          // Set account_number: use profile phone_number first, then subscriber_number
          walletTopupData.account_number = userData.phone_number && userData.phone_number.trim() && userData.phone_number !== "0000000000"
            ? (paymentService as any).formatMobileNumber(userData.phone_number)
            : (topupData.subscriber_number && topupData.subscriber_number.trim() && topupData.subscriber_number !== "0000000000"
              ? (paymentService as any).formatMobileNumber(topupData.subscriber_number)
              : "0000000000");
        }

        const response = await (paymentService as any).processWalletTopup(
          walletTopupData
        );

        if (response.status === "success" || response.status === "approved") {
          // Refresh wallet balance after successful topup
          await refreshWallet();
          return { success: true };
        } else if (response.status === "pending" && response.redirect_url) {
          // Handle pending payment with redirect (like Paystack checkout)
          return {
            success: false,
            redirect_url: response.redirect_url,
            transaction_id: response.transaction_id || "",
          };
        } else if (response.redirect_url) {
          // Handle other redirects (3D Secure, etc.)
          return {
            success: false,
            redirect_url: response.redirect_url,
            transaction_id: response.transaction_id || "",
          };
        } else {
          return { success: false, error: response.reason || "Topup failed" };
        }
      } catch (error) {
        return {
          success: false,
          error: "An error occurred during topup processing",
        };
      }
    },
    [user, supabase, refreshWallet]
  );

  const processWalletWithdrawal = useCallback(
    async (withdrawalData: {
      amount: number;
      channel: "bank" | "momo";
      account_number?: string;
      account_bank?: string;
      recipient_number?: string;
      network?: string;
      description?: string;
    }) => {
      if (!user) {
        return { success: false, error: "User not authenticated" };
      }

      try {
        // Get user data from profile table (backend expects this table)
        const { data: userData } = await supabase
          .from("profile")
          .select(
            "id, user_id, kyc_status, first_name, last_name, email, phone_number"
          )
          .eq("user_id", user.id)
          .single();

        if (!userData) {
          return { success: false, error: "User not found" };
        }

        // Check KYC status - only allow withdrawal if KYC is verified
        if (!userData.kyc_status || userData.kyc_status !== "verified") {
          return {
            success: false,
            error:
              "KYC verification required. Please complete your identity verification before making wallet transactions.",
          };
        }

        const walletWithdrawalData = {
          profile_id: userData.id,
          project_id: "16beb80e-cb97-44b0-ab8e-13542a6add60", // Default project ID for wallet operations
          amount: withdrawalData.amount,
          channel: withdrawalData.channel,
          description:
            withdrawalData.description ||
            `Wallet withdrawal - ${withdrawalData.channel}`,
          // Send the exact KYC status from profile table (backend expects "verified")
          kyc_status: userData.kyc_status,
          kyc_verified: userData.kyc_status === "verified",
          // Include user information from profile table
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email,
          phone_number: userData.phone_number || "",
          ...(withdrawalData.channel === "bank"
            ? {
                account_number: withdrawalData.account_number,
                account_bank: withdrawalData.account_bank,
              }
            : {
                recipient_number: withdrawalData.recipient_number,
                network: withdrawalData.network, // API expects network field
                account_issuer: withdrawalData.network, // Also include account_issuer
              }),
        };

        const response = await (paymentService as any).processWalletWithdrawal(
          walletWithdrawalData
        );

        if (response.status === "approved") {
          // Refresh wallet balance after successful withdrawal
          await refreshWallet();
          return {
            success: true,
            transactionId: response.transaction_id || response.reference,
          };
        } else if (
          response.status === "Pending" ||
          response.details?.status === "otp"
        ) {
          // Withdrawal submitted successfully, awaiting OTP verification
          return {
            success: true,
            pending: true,
            transactionId: response.transaction_id || response.reference,
            transferCode:
              response.details?.transfer_code || response.transfer_code,
            message:
              "Withdrawal submitted successfully. Please check your phone for OTP verification.",
          };
        } else {
          // Handle specific error cases
          if (
            response.description
              ?.toLowerCase()
              .includes("insufficient funds") ||
            response.description?.toLowerCase().includes("merchant float")
          ) {
            return {
              success: false,
              error: "insufficient_funds",
              details:
                response.description ||
                "Insufficient funds in merchant account",
            };
          }

          return {
            success: false,
            error: response.reason || "Withdrawal failed",
          };
        }
      } catch (error) {
        return {
          success: false,
          error: "An error occurred during withdrawal processing",
        };
      }
    },
    [user, supabase, refreshWallet]
  );

  const submitWithdrawalOTP = useCallback(
    async (otpData: {
      transactionId: string;
      transferCode: string;
      otp: string;
    }) => {
      if (!user) {
        return { success: false, error: "User not found" };
      }

      try {
        const response = await (paymentService as any).submitWithdrawalOTP(
          otpData
        );

        if (response.status === "approved" || response.status === "success") {
          // Refresh wallet balance after successful OTP verification
          await refreshWallet();
          return {
            success: true,
            message: "OTP verified successfully. Withdrawal processed.",
          };
        } else {
          return {
            success: false,
            error:
              response.reason || response.message || "OTP verification failed",
          };
        }
      } catch (error) {
        return {
          success: false,
          error: "An error occurred during OTP verification",
        };
      }
    },
    [user, refreshWallet]
  );

  // Legacy Payment API Integration Methods
  const processMobileMoneyPayment = useCallback(
    async (momoData: {
      subscriber_number: string;
      amount: number;
      project_id?: string;
    }) => {
      if (!user || !wallet) {
        return { success: false, error: "User or wallet not found" };
      }

      try {
        // Validate mobile number
        if (
          !(paymentService as any).validateMobileNumber(
            momoData.subscriber_number
          )
        ) {
          return { success: false, error: "Invalid mobile number" };
        }

        const fees = (paymentService as any).calculateFees(
          momoData.amount,
          "momo"
        );
        const network = (paymentService as any).getNetworkProvider(
          momoData.subscriber_number
        );
        const formattedNumber = (paymentService as any).formatMobileNumber(
          momoData.subscriber_number
        );

        const paymentRequest: MobileMoneyPaymentRequest = {
          profile_id: user.id,
          project_id:
            momoData.project_id || "16beb80e-cb97-44b0-ab8e-13542a6add60", // Default project ID for wallet operations
          subscriber_number: formattedNumber,
          network: network,
          amount: momoData.amount,
          unit: 1,
          description: "Wallet top-up via mobile money",
          user_email: user.email || "",
        };

        const response = await paymentService.processMobileMoneyPayment(
          paymentRequest
        );

        if (response.status === "success") {
          // Wallet balance is updated by backend API when transaction is completed
          // No need to update balance here - backend handles it
          return { success: true };
        } else {
          return { success: false, error: response.reason || "Payment failed" };
        }
      } catch (error) {
        return {
          success: false,
          error: "An error occurred during payment processing",
        };
      }
    },
    [user, wallet]
  );

  const processPayout = useCallback(
    async (payoutData: {
      amount: number;
      channel: "momo" | "bank";
      recipient_number?: string;
      account_number?: string;
      project_id?: string;
    }) => {
      if (!user || !wallet) {
        return { success: false, error: "User or wallet not found" };
      }

      // Check if wallet has sufficient balance
      if (wallet.balance < payoutData.amount) {
        return { success: false, error: "Insufficient wallet balance" };
      }

      try {
        const fees = (paymentService as any).calculateFees(
          payoutData.amount,
          "momo"
        );
        const externalId = (paymentService as any).generateExternalId();

        const payoutRequest: PayoutRequest = {
          user_id: user.id,
          project_id:
            payoutData.project_id || "16beb80e-cb97-44b0-ab8e-13542a6add60", // Default project ID for wallet operations
          amount: payoutData.amount,
          unit: 1,
          fees: fees,
          desc: "Wallet payout",
          channel: payoutData.channel,
          external_id: externalId,
        };

        // Add channel-specific details
        if (payoutData.channel === "momo" && payoutData.recipient_number) {
          payoutRequest.recipient_number = (
            paymentService as any
          ).formatMobileNumber(payoutData.recipient_number);
          payoutRequest.network = (paymentService as any).getNetworkProvider(
            payoutData.recipient_number
          );
        } else if (payoutData.channel === "bank" && payoutData.account_number) {
          payoutRequest.account_number = payoutData.account_number;
          payoutRequest.account_bank = "001"; // Default bank code - you might want to make this configurable
        }

        const response = await (paymentService as any).processPayout(
          payoutRequest
        );

        if (response.status === "success") {
          // Wallet balance is updated by backend API when transaction is completed
          // No need to update balance here - backend handles it
          return { success: true };
        } else {
          return { success: false, error: response.reason || "Payout failed" };
        }
      } catch (error) {
        return {
          success: false,
          error: "An error occurred during payout processing",
        };
      }
    },
    [user, wallet]
  );

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Real-time subscription for wallet balance updates
  useEffect(() => {
    if (!user || !wallet) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(`wallet-changes-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "wallets",
            filter: `profile_id=eq.${user.id}`, // Only listen to user's wallet
          },
          (payload) => {
            if (payload.new) {
            const updatedWallet = payload.new as Wallet;
            setWallet(updatedWallet);
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Successfully subscribed
          } else if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            // Handle channel errors - could implement fallback polling here if needed
          }
        });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    } catch (error) {
      // Error setting up real-time subscription
    }
  }, [user, wallet, supabase]);

  const value = {
    wallet,
    loading,
    updateBalance,
    refreshWallet,
    createWallet,
    processWalletTopup,
    processWalletWithdrawal,
    submitWithdrawalOTP,
    processCardPayment,
    processMobileMoneyPayment,
    processPayout,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
