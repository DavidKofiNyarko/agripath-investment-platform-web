// Payment Service for AgriPath Payment API Integration
// Handles communication with the backend payment API

export interface CardPaymentRequest {
  // Card Details
  pan: string;
  exp_month: string;
  exp_year: string;
  cvv: string;
  card_holder: string;

  // User Details
  user_id: string;
  user_email: string;
  user_name: string;

  // Project Details
  project_id: string;
  amount: number;
  unit: number;
  fees: number;
  net_amount: number;

  // Transaction Details
  transaction_id: string;
  type: "Payin";
  status: "Pending";
  desc: string;
  processed_at: Date;

  // Payment Gateway Details
  r_switch: string;
  redirect_url: string;
  external_id: string;
  channel: string;
  profile_id: string;
}

export interface MobileMoneyPaymentRequest {
  profile_id: string;
  project_id: string;
  subscriber_number?: string; // Optional - Paystack handles it
  network?: string; // Optional - Paystack handles it
  account_number?: string; // Required by backend - should be subscriber_number for mobile money
  description: string;
  amount: number;
  unit: number;
  user_email: string; // Required field based on API testing
  redirect_url?: string; // Optional - for local testing, defaults to production callback URL
}

export interface PaymentResponse {
  status: string;
  transaction_id: string;
  redirect_url?: string;
  reference?: string;
  details?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
    // Withdrawal-specific fields
    status?: string;
    transfer_code?: string;
    amount?: number;
    currency?: string;
    reason?: string;
    [key: string]: unknown; // Allow additional fields
  };
  // Withdrawal-specific fields (can also be at top level)
  transfer_code?: string;
  methodName?: string;
  payerEmail?: string;
  payerName?: string;
  payerPhone?: string;
  requestId?: string;
  paymentMethod?: string;
  transactionDate?: string;
  currency?: string;
  amount?: number;
  fees?: number;
  metadata?: Record<string, unknown>;
  code?: string;
  reason?: string;
  message?: string;
  error?: string;
  statusCode?: number;
  description?: string;
}

export interface PayoutRequest {
  user_id: string;
  project_id: string;
  amount: number;
  unit: number;
  fees: number;
  desc: string;
  channel: string;
  recipient_number?: string;
  network?: string;
  account_number?: string;
  account_bank?: string;
  external_id: string;
}

export interface PayoutResponse {
  status: string;
  transaction_id: string;
  roi: string;
  payoutAmount: number;
  code: string;
  reason?: string;
}

import { getApiBaseUrl } from "./apiConfig";

class PaymentService {
  private baseUrl: string;

  constructor() {
    // Use getApiBaseUrl to automatically detect localhost vs production
    this.baseUrl = getApiBaseUrl();
  }

  /**
   * Process card payment for wallet top-up
   */
  async processCardPayment(paymentData: {
    profile_id: string;
    project_id: string;
    amount: number;
    unit: number;
    desc: string;
    pan: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
    card_holder: string;
    user_email: string;
    redirect_url: string;
  }): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/card/payin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Card payment failed");
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process mobile money payment for wallet top-up
   */
  async processMobileMoneyPayment(
    paymentData: MobileMoneyPaymentRequest
  ): Promise<PaymentResponse> {
    try {
      // Ensure network is always set and valid (required by backend)
      const requestData: MobileMoneyPaymentRequest = { ...paymentData };

      if (!requestData.network || !requestData.network.trim()) {
        // If subscriber_number is provided, determine network from it
        if (requestData.subscriber_number) {
          requestData.network = this.getNetworkProvider(
            requestData.subscriber_number
          );
        } else {
          // Default to MTN if no subscriber number
          requestData.network = "MTN";
        }
      }

      // Ensure network is uppercase and valid
      const networkUpper = requestData.network.toUpperCase().trim();
      if (["MTN", "VOD", "ATL"].includes(networkUpper)) {
        requestData.network = networkUpper;
      } else {
        // If invalid, default to MTN
        requestData.network = "MTN";
      }

      // Ensure account_number is set (required by backend for transactions table)
      // For mobile money, account_number should be phone_number or subscriber_number
      // Note: phone_number should be passed from the caller if available from profile
      if (!requestData.account_number || !requestData.account_number.trim()) {
        // Priority: 1. subscriber_number (which may be from profile), 2. placeholder
        if (
          requestData.subscriber_number &&
          requestData.subscriber_number.trim() &&
          requestData.subscriber_number !== "0000000000"
        ) {
          requestData.account_number = this.formatMobileNumber(
            requestData.subscriber_number
          );
        } else {
          // Default placeholder if no subscriber number provided
          requestData.account_number = "0000000000";
        }
      }

      const response = await fetch(`${this.baseUrl}/momo/payin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Mobile money payment failed");
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId(): string {
    return `txn${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique external ID
   */
  generateExternalId(): string {
    return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate fees based on amount and payment method
   */
  calculateFees(amount: number, paymentMethod: "card" | "momo"): number {
    // Simple fee calculation - you can make this more sophisticated
    if (paymentMethod === "card") {
      return Math.max(amount * 0.035, 5); // 3.5% or minimum 5 GHS
    } else {
      return Math.max(amount * 0.02, 2); // 2% or minimum 2 GHS
    }
  }

  /**
   * Determine card network based on PAN
   */
  getCardNetwork(pan: string): string {
    const cleanPan = pan.replace(/\s/g, "");

    if (cleanPan.startsWith("4")) {
      return "VIS"; // Visa
    } else if (cleanPan.startsWith("5") || cleanPan.startsWith("2")) {
      return "MAS"; // Mastercard
    } else {
      return "VIS"; // Default to Visa
    }
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(pan: string): boolean {
    const cleanPan = pan.replace(/\s/g, "");

    if (!/^\d{12,19}$/.test(cleanPan)) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleanPan.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanPan.charAt(i));

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validate mobile number format
   */
  validateMobileNumber(number: string): boolean {
    const cleanNumber = number.replace(/\s/g, "");
    return /^0[2-9]\d{8}$/.test(cleanNumber);
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format mobile number for API
   * Ensures Ghana format: 0XXXXXXXXX
   */
  formatMobileNumber(number: string): string {
    const cleanNumber = number.replace(/\s/g, "");
    // Add leading 0 if missing and number is 9 digits
    if (cleanNumber.length === 9 && !cleanNumber.startsWith("0")) {
      return "0" + cleanNumber;
    }
    return cleanNumber;
  }

  /**
   * Get network provider from mobile number
   */
  getNetworkProvider(number: string): string {
    const cleanNumber = number.replace(/\s/g, "");

    if (
      cleanNumber.startsWith("024") ||
      cleanNumber.startsWith("054") ||
      cleanNumber.startsWith("055")
    ) {
      return "MTN";
    } else if (cleanNumber.startsWith("020") || cleanNumber.startsWith("050")) {
      return "VOD"; // Vodafone - updated to match API
    } else if (cleanNumber.startsWith("026") || cleanNumber.startsWith("056")) {
      return "ATL"; // AirtelTigo
    } else {
      return "MTN"; // Default
    }
  }

  /**
   * Process wallet topup via card or mobile money
   */
  async processWalletTopup(topupData: {
    profile_id: string;
    project_id: string;
    amount: number;
    channel: "card" | "momo";
    description?: string;
    redirect_url?: string;
    // KYC fields
    kyc_status?: string;
    kyc_verified?: boolean;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
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
  }): Promise<PaymentResponse> {
    try {
      // For mobile money, backend requires subscriber_number and network
      // Set defaults if not provided - user can still change on Paystack
      const requestData: Record<string, unknown> = { ...topupData };

      if (topupData.channel === "momo") {
        // Set default subscriber_number if not provided (required by backend, user can change on Paystack)
        if (
          !topupData.subscriber_number ||
          !topupData.subscriber_number.trim()
        ) {
          requestData.subscriber_number = "0000000000"; // Placeholder, user will enter on Paystack
        }

        // Ensure network is always set and valid (required by backend)
        if (!topupData.network || !topupData.network.trim()) {
          // If subscriber_number is provided, determine network from it
          if (
            topupData.subscriber_number &&
            topupData.subscriber_number !== "0000000000"
          ) {
            requestData.network = this.getNetworkProvider(
              topupData.subscriber_number
            );
          } else {
            // Default to MTN if no valid subscriber number
            requestData.network = "MTN";
          }
        } else {
          // Validate and normalize network value
          const networkUpper = topupData.network.toUpperCase().trim();
          if (["MTN", "VOD", "ATL"].includes(networkUpper)) {
            requestData.network = networkUpper;
          } else {
            // If invalid, default to MTN
            requestData.network = "MTN";
          }
        }

        // Ensure account_number is set (required by backend for transactions table)
        // For mobile money, use profile phone_number first, then subscriber_number
        if (
          !requestData.account_number ||
          !(requestData.account_number as string).trim()
        ) {
          // Priority: 1. phone_number from profile, 2. subscriber_number, 3. placeholder
          if (
            topupData.phone_number &&
            topupData.phone_number.trim() &&
            topupData.phone_number !== "0000000000"
          ) {
            requestData.account_number = this.formatMobileNumber(
              topupData.phone_number
            );
          } else if (
            topupData.subscriber_number &&
            topupData.subscriber_number.trim() &&
            topupData.subscriber_number !== "0000000000"
          ) {
            requestData.account_number = this.formatMobileNumber(
              topupData.subscriber_number
            );
          } else {
            // Default placeholder if no phone number provided
            requestData.account_number = "0000000000";
          }
        }
      }

      const response = await fetch(`${this.baseUrl}/wallet/topup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Wallet topup failed");
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Process wallet withdrawal via bank or mobile money
   */
  async processWalletWithdrawal(withdrawalData: {
    profile_id: string;
    project_id: string;
    amount: number;
    channel: "bank" | "momo";
    description?: string;
    // KYC fields
    kyc_status?: string;
    kyc_verified?: boolean;
    kyc_documents?: Record<string, string>;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    // Bank fields
    account_number?: string;
    account_bank?: string;
    // Momo fields
    recipient_number?: string;
    network?: string;
    account_issuer?: string;
  }): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/wallet/withdrawal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withdrawalData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Wallet withdrawal failed");
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Submit OTP for withdrawal verification
   */
  async submitWithdrawalOTP(otpData: {
    transactionId: string;
    transferCode: string;
    otp: string;
  }): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/finalize-transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(otpData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "OTP verification failed");
      }

      return responseData;
    } catch (error) {
      throw error;
    }
  }
  async processInvestmentCardPayment(investmentData: {
    profile_id: string;
    project_id: string;
    amount: number;
    unit: number;
    desc: string;
    pan: string;
    exp_month: string;
    exp_year: string;
    cvv: string;
    card_holder: string;
    user_email: string;
    redirect_url: string;
  }): Promise<PaymentResponse> {
    try {
      // Validate email if provided
      if (
        investmentData.user_email &&
        !this.validateEmail(investmentData.user_email)
      ) {
        throw new Error("Invalid email address");
      }

      const fees = this.calculateFees(investmentData.amount, "card");
      const netAmount = investmentData.amount - fees;
      const transactionId = this.generateTransactionId();
      const externalId = this.generateExternalId();
      const cardNetwork = this.getCardNetwork(investmentData.pan);

      // Create the payload matching the API structure
      const paymentRequest = {
        profile_id: investmentData.profile_id,
        project_id: investmentData.project_id,
        amount: investmentData.amount,
        unit: investmentData.unit,
        desc: investmentData.desc,
        pan: investmentData.pan,
        exp_month: investmentData.exp_month,
        exp_year: investmentData.exp_year,
        cvv: investmentData.cvv,
        card_holder: investmentData.card_holder,
        user_email: investmentData.user_email,
        redirect_url: investmentData.redirect_url,
      };

      return await this.processCardPayment(paymentRequest);
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
