'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useUser } from './UserContext';
import { paymentService, CardPaymentRequest, MobileMoneyPaymentRequest, PayoutRequest } from '@/lib/paymentService';

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
    channel: 'card' | 'momo';
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
  }) => Promise<{ success: boolean; redirect_url?: string; error?: string }>;
  
  processWalletWithdrawal: (withdrawalData: {
    amount: number;
    channel: 'bank' | 'momo';
    // Bank fields
    account_number?: string;
    account_bank?: string;
    // Momo fields
    recipient_number?: string;
    account_issuer?: string;
    description?: string;
  }) => Promise<{ success: boolean; error?: string; details?: string }>;
  
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
    channel: 'momo' | 'bank';
    recipient_number?: string;
    account_number?: string;
    project_id?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
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
        .from('wallets')
        .insert({
          profile_id: user.id,
          balance: 0.00,
          currency: 'GHS',
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating wallet:', error);
        return;
      }

      setWallet(data);
    } catch (error) {
      console.error('Error creating wallet:', error);
    }
  }, [user, supabase]);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('profile_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        // If wallet doesn't exist, create one
        await createWallet();
        return;
      }

      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, createWallet]);


  const refreshWallet = useCallback(async () => {
    setLoading(true);
    await fetchWallet();
  }, [fetchWallet]);

  const updateBalance = useCallback(async (amount: number, description?: string): Promise<boolean> => {
    if (!user || !wallet) return false;

    try {
      // Get current balance first
      const { data: currentWallet, error: fetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', wallet.id)
        .single();

      if (fetchError) {
        console.error('Error fetching current wallet balance:', fetchError);
        return false;
      }

      const currentBalance = currentWallet.balance || 0;
      const newBalance = currentBalance + amount;

      // Check if sufficient funds for withdrawal
      if (amount < 0 && currentBalance < Math.abs(amount)) {
        console.error('Insufficient funds for withdrawal');
        return false;
      }

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ 
          balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);

      if (updateError) {
        console.error('Error updating wallet balance:', updateError);
        return false;
      }

      // Log to audit table
      const { error: auditError } = await supabase
        .from('wallet_audit_log')
        .insert({
          wallet_id: wallet.id,
          action: amount > 0 ? 'deposit' : 'withdrawal',
          old_balance: currentBalance,
          new_balance: newBalance,
          amount: amount,
          user_id: user.id,
          created_at: new Date().toISOString()
        });

      if (auditError) {
        console.error('Error logging wallet transaction:', auditError);
        // Don't fail the transaction if audit logging fails
      }

      // Refresh wallet data
      await refreshWallet();
      return true;

    } catch (error) {
      console.error('Error updating wallet balance:', error);
      return false;
    }
  }, [user, wallet, supabase, refreshWallet]);

  // Payment API Integration Methods
  const processCardPayment = useCallback(async (cardData: {
    pan: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
    card_holder: string;
    amount: number;
    project_id?: string;
  }) => {
    if (!user || !wallet) {
      return { success: false, error: 'User or wallet not found' };
    }

    try {
      // Validate card number
      if (!paymentService.validateCardNumber(cardData.pan)) {
        return { success: false, error: 'Invalid card number' };
      }

      const fees = paymentService.calculateFees(cardData.amount, 'card');
      const netAmount = cardData.amount - fees;
      const transactionId = paymentService.generateTransactionId();
      const externalId = paymentService.generateExternalId();
      const cardNetwork = paymentService.getCardNetwork(cardData.pan);

      const paymentRequest: CardPaymentRequest = {
        pan: cardData.pan,
        exp_month: cardData.exp_month,
        exp_year: cardData.exp_year,
        cvv: cardData.cvv,
        card_holder: cardData.card_holder,
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || 'User',
        project_id: cardData.project_id || '00000000-0000-0000-0000-000000000000', // Default project for wallet top-up
        amount: cardData.amount,
        unit: 1,
        fees: fees,
        net_amount: netAmount,
        transaction_id: transactionId,
        type: 'Payin',
        status: 'Pending',
        desc: 'Wallet top-up via card',
        processed_at: new Date(),
        r_switch: cardNetwork,
        redirect_url: `${window.location.origin}/payment/callback`,
        external_id: externalId,
        channel: 'card',
        profile_id: user.id
      };

      const response = await paymentService.processCardPayment(paymentRequest);

      if (response.status === 'success') {
        // Update wallet balance
        await updateBalance(cardData.amount, 'Card payment top-up');
        return { success: true };
      } else if (response.status === 'vbv_required') {
        // 3D Secure required
        return { success: false, redirect_url: response.redirect_url };
      } else {
        return { success: false, error: response.reason || 'Payment failed' };
      }
    } catch (error) {
      console.error('Card payment error:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }, [user, wallet, updateBalance]);

  // New Wallet API Methods
  const processWalletTopup = useCallback(async (topupData: {
    amount: number;
    channel: 'card' | 'momo';
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
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Get user data from users table (backend expects this table)
      const { data: userData } = await supabase
        .from('users')
        .select('id, kyc_status, name, email, phone')
        .eq('id', user.id)
        .single();

      if (!userData) {
        return { success: false, error: 'User not found' };
      }

      // Check KYC status - only allow topup if KYC is Completed
      if (!userData.kyc_status || userData.kyc_status !== 'Completed') {
        return { 
          success: false, 
          error: 'KYC verification required. Please complete your identity verification before making wallet transactions.' 
        };
      }

      // Get first available project
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

      if (!projects || projects.length === 0) {
        return { success: false, error: 'No projects available' };
      }

      const walletTopupData = {
        profile_id: userData.id,
        project_id: projects[0].id,
        amount: topupData.amount,
        channel: topupData.channel,
        description: topupData.description || `Wallet topup - ${topupData.channel}`,
        redirect_url: `${window.location.origin}/dashboard`,
        // Send the exact KYC status from users table (backend expects "Completed")
        kyc_status: userData.kyc_status,
        kyc_verified: userData.kyc_status === 'Completed',
        // Include user information from users table
        first_name: userData.name?.split(' ')[0] || '',
        last_name: userData.name?.split(' ').slice(1).join(' ') || '',
        email: userData.email,
        phone_number: userData.phone || '',
        ...(topupData.channel === 'card' ? {
          pan: topupData.pan,
          exp_month: topupData.exp_month,
          exp_year: topupData.exp_year,
          cvv: topupData.cvv,
          card_holder: topupData.card_holder,
          user_email: topupData.user_email
        } : {
          subscriber_number: topupData.subscriber_number,
          network: topupData.network
        })
      };

      const response = await paymentService.processWalletTopup(walletTopupData);

      if (response.status === 'approved') {
        // Refresh wallet balance after successful topup
        await refreshWallet();
        return { success: true };
      } else if (response.redirect_url) {
        // Handle 3D Secure redirect
        return { success: false, redirect_url: response.redirect_url };
      } else {
        return { success: false, error: response.reason || 'Topup failed' };
      }
    } catch (error) {
      console.error('Wallet topup error:', error);
      return { success: false, error: 'Topup processing failed' };
    }
  }, [user, supabase, refreshWallet]);

  const processWalletWithdrawal = useCallback(async (withdrawalData: {
    amount: number;
    channel: 'bank' | 'momo';
    account_number?: string;
    account_bank?: string;
    recipient_number?: string;
    account_issuer?: string;
    description?: string;
  }) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Get user data from users table (backend expects this table)
      const { data: userData } = await supabase
        .from('users')
        .select('id, kyc_status, name, email, phone')
        .eq('id', user.id)
        .single();

      if (!userData) {
        return { success: false, error: 'User not found' };
      }

      // Check KYC status - only allow withdrawal if KYC is Completed
      if (!userData.kyc_status || userData.kyc_status !== 'Completed') {
        return { 
          success: false, 
          error: 'KYC verification required. Please complete your identity verification before making wallet transactions.' 
        };
      }

      // Get first available project
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

      if (!projects || projects.length === 0) {
        return { success: false, error: 'No projects available' };
      }

      const walletWithdrawalData = {
        profile_id: userData.id,
        project_id: projects[0].id,
        amount: withdrawalData.amount,
        channel: withdrawalData.channel,
        description: withdrawalData.description || `Wallet withdrawal - ${withdrawalData.channel}`,
        // Send the exact KYC status from users table (backend expects "Completed")
        kyc_status: userData.kyc_status,
        kyc_verified: userData.kyc_status === 'Completed',
        // Include user information from users table
        first_name: userData.name?.split(' ')[0] || '',
        last_name: userData.name?.split(' ').slice(1).join(' ') || '',
        email: userData.email,
        phone_number: userData.phone || '',
        ...(withdrawalData.channel === 'bank' ? {
          account_number: withdrawalData.account_number,
          account_bank: withdrawalData.account_bank
        } : {
          recipient_number: withdrawalData.recipient_number,
          account_issuer: withdrawalData.account_issuer
        })
      };

      const response = await paymentService.processWalletWithdrawal(walletWithdrawalData);

      if (response.status === 'approved') {
        // Refresh wallet balance after successful withdrawal
        await refreshWallet();
        return { success: true };
      } else {
        // Handle specific error cases
        if (response.description?.toLowerCase().includes('insufficient funds') || 
            response.description?.toLowerCase().includes('merchant float')) {
          return { 
            success: false, 
            error: 'insufficient_funds',
            details: response.description || 'Insufficient funds in merchant account'
          };
        }
        
        return { success: false, error: response.reason || 'Withdrawal failed' };
      }
    } catch (error) {
      console.error('Wallet withdrawal error:', error);
      return { success: false, error: 'Withdrawal processing failed' };
    }
  }, [user, supabase, refreshWallet]);

  // Legacy Payment API Integration Methods
  const processMobileMoneyPayment = useCallback(async (momoData: {
    subscriber_number: string;
    amount: number;
    project_id?: string;
  }) => {
    if (!user || !wallet) {
      return { success: false, error: 'User or wallet not found' };
    }

    try {
      // Validate mobile number
      if (!paymentService.validateMobileNumber(momoData.subscriber_number)) {
        return { success: false, error: 'Invalid mobile number' };
      }

      const fees = paymentService.calculateFees(momoData.amount, 'momo');
      const network = paymentService.getNetworkProvider(momoData.subscriber_number);
      const formattedNumber = paymentService.formatMobileNumber(momoData.subscriber_number);

      const paymentRequest: MobileMoneyPaymentRequest = {
        subscriber_number: formattedNumber,
        network: network,
        user_id: user.id,
        project_id: momoData.project_id || '00000000-0000-0000-0000-000000000000',
        amount: momoData.amount,
        unit: 1,
        description: 'Wallet top-up via mobile money',
        profile_id: user.id
      };

      const response = await paymentService.processMobileMoneyPayment(paymentRequest);

      if (response.status === 'success') {
        // Update wallet balance
        await updateBalance(momoData.amount, 'Mobile money top-up');
        return { success: true };
      } else {
        return { success: false, error: response.reason || 'Payment failed' };
      }
    } catch (error) {
      console.error('Mobile money payment error:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }, [user, wallet, updateBalance]);

  const processPayout = useCallback(async (payoutData: {
    amount: number;
    channel: 'momo' | 'bank';
    recipient_number?: string;
    account_number?: string;
    project_id?: string;
  }) => {
    if (!user || !wallet) {
      return { success: false, error: 'User or wallet not found' };
    }

    // Check if wallet has sufficient balance
    if (wallet.balance < payoutData.amount) {
      return { success: false, error: 'Insufficient wallet balance' };
    }

    try {
      const fees = paymentService.calculateFees(payoutData.amount, 'momo');
      const externalId = paymentService.generateExternalId();

      const payoutRequest: PayoutRequest = {
        user_id: user.id,
        project_id: payoutData.project_id || '00000000-0000-0000-0000-000000000000',
        amount: payoutData.amount,
        unit: 1,
        fees: fees,
        desc: 'Wallet payout',
        channel: payoutData.channel,
        external_id: externalId
      };

      // Add channel-specific details
      if (payoutData.channel === 'momo' && payoutData.recipient_number) {
        payoutRequest.recipient_number = paymentService.formatMobileNumber(payoutData.recipient_number);
        payoutRequest.account_issuer = paymentService.getNetworkProvider(payoutData.recipient_number);
      } else if (payoutData.channel === 'bank' && payoutData.account_number) {
        payoutRequest.account_number = payoutData.account_number;
        payoutRequest.account_bank = '001'; // Default bank code - you might want to make this configurable
      }

      const response = await paymentService.processPayout(payoutRequest);

      if (response.status === 'success') {
        // Deduct from wallet balance
        await updateBalance(-payoutData.amount, 'Payout via ' + payoutData.channel);
        return { success: true };
      } else {
        return { success: false, error: response.reason || 'Payout failed' };
      }
    } catch (error) {
      console.error('Payout error:', error);
      return { success: false, error: 'Payout processing failed' };
    }
  }, [user, wallet, updateBalance]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const value = {
    wallet,
    loading,
    updateBalance,
    refreshWallet,
    createWallet,
    processWalletTopup,
    processWalletWithdrawal,
    processCardPayment,
    processMobileMoneyPayment,
    processPayout
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};
