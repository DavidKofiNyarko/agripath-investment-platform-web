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
  profiles_id: string;
}

export interface MobileMoneyPaymentRequest {
  profile_id: string;
  user_id: string;
  project_id: string;
  subscriber_number: string;
  network: string;
  description: string;
  amount: number;
  unit: number;
}

export interface PaymentResponse {
  status: string;
  transaction_id: string;
  redirect_url?: string;
  code: string;
  reason?: string;
  message?: string;
  error?: string;
  statusCode?: number;
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
  account_issuer?: string;
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

class PaymentService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to production URL
    this.baseUrl = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'https://infra.agripath.co/api/payments';
  }

  /**
   * Process card payment for wallet top-up
   */
  async processCardPayment(paymentData: CardPaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/card/payin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Card payment failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Card payment error:', error);
      throw error;
    }
  }

  /**
   * Process mobile money payment for wallet top-up
   */
  async processMobileMoneyPayment(paymentData: MobileMoneyPaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/momo/payin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Mobile money payment failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Mobile money payment error:', error);
      throw error;
    }
  }

  /**
   * Process individual payout
   */
  async processPayout(payoutData: PayoutRequest): Promise<PayoutResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payoutData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Payout failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payout error:', error);
      throw error;
    }
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId(): string {
    return Date.now().toString().padStart(12, '0');
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
  calculateFees(amount: number, paymentMethod: 'card' | 'momo'): number {
    // Simple fee calculation - you can make this more sophisticated
    if (paymentMethod === 'card') {
      return Math.max(amount * 0.035, 5); // 3.5% or minimum 5 GHS
    } else {
      return Math.max(amount * 0.02, 2); // 2% or minimum 2 GHS
    }
  }

  /**
   * Determine card network based on PAN
   */
  getCardNetwork(pan: string): string {
    const cleanPan = pan.replace(/\s/g, '');
    
    if (cleanPan.startsWith('4')) {
      return 'VIS'; // Visa
    } else if (cleanPan.startsWith('5') || cleanPan.startsWith('2')) {
      return 'MAS'; // Mastercard
    } else {
      return 'VIS'; // Default to Visa
    }
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(pan: string): boolean {
    const cleanPan = pan.replace(/\s/g, '');
    
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
    const cleanNumber = number.replace(/\s/g, '');
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
    const cleanNumber = number.replace(/\s/g, '');
    // Add leading 0 if missing and number is 9 digits
    if (cleanNumber.length === 9 && !cleanNumber.startsWith('0')) {
      return '0' + cleanNumber;
    }
    return cleanNumber;
  }

  /**
   * Get network provider from mobile number
   */
  getNetworkProvider(number: string): string {
    const cleanNumber = number.replace(/\s/g, '');
    
    if (cleanNumber.startsWith('024') || cleanNumber.startsWith('054') || cleanNumber.startsWith('055')) {
      return 'MTN';
    } else if (cleanNumber.startsWith('020') || cleanNumber.startsWith('050')) {
      return 'VDF'; // Vodafone
    } else if (cleanNumber.startsWith('026') || cleanNumber.startsWith('056')) {
      return 'ATL'; // AirtelTigo
    } else {
      return 'MTN'; // Default
    }
  }

  /**
   * Process investment payment via card
   */
  async processInvestmentCardPayment(investmentData: {
    user_id: string;
    project_id: string;
    amount: number;
    unit: number;
    cardDetails: {
      pan: string;
      exp_month: string;
      exp_year: string;
      cvv: string;
      card_holder: string;
    };
    user_email?: string;
    user_name?: string;
    profiles_id?: string;
    description?: string;
  }): Promise<PaymentResponse> {
    try {
      // Debug logging
      console.log('Investment card payment data:', {
        user_email: investmentData.user_email,
        user_name: investmentData.user_name,
        user_id: investmentData.user_id
      });

      // Validate email if provided
      if (investmentData.user_email && !this.validateEmail(investmentData.user_email)) {
        throw new Error('Invalid email address');
      }

      const fees = this.calculateFees(investmentData.amount, 'card');
      const netAmount = investmentData.amount - fees;
      const transactionId = this.generateTransactionId();
      const externalId = this.generateExternalId();
      const cardNetwork = this.getCardNetwork(investmentData.cardDetails.pan);

      const paymentRequest: CardPaymentRequest = {
        pan: investmentData.cardDetails.pan,
        exp_month: investmentData.cardDetails.exp_month,
        exp_year: investmentData.cardDetails.exp_year,
        cvv: investmentData.cardDetails.cvv,
        card_holder: investmentData.cardDetails.card_holder,
        user_id: investmentData.user_id,
        user_email: investmentData.user_email || 'user@example.com', // Provide default email
        user_name: investmentData.user_name || 'Investment User', // Provide default name
        project_id: investmentData.project_id,
        amount: investmentData.amount,
        unit: investmentData.unit,
        fees: fees,
        net_amount: netAmount,
        transaction_id: transactionId,
        type: 'Payin',
        status: 'Pending',
        desc: investmentData.description || 'Investment payment',
        processed_at: new Date(),
        r_switch: cardNetwork,
        redirect_url: `${window.location.origin}/investment/callback`,
        external_id: externalId,
        channel: 'card',
        profiles_id: investmentData.profiles_id || investmentData.user_id
      };

      return await this.processCardPayment(paymentRequest);
    } catch (error) {
      console.error('Investment card payment error:', error);
      throw error;
    }
  }

  /**
   * Process investment payment via mobile money
   * Note: Backend requires both profile_id and user_id (they should be the same profile ID)
   */
  async processInvestmentMobileMoneyPayment(investmentData: {
    user_id: string; // This should be the profile ID from the profile table
    project_id: string;
    amount: number;
    unit: number;
    subscriber_number: string;
    network?: string;
    description?: string;
  }): Promise<PaymentResponse> {
    try {
      const network = investmentData.network || this.getNetworkProvider(investmentData.subscriber_number);
      const formattedNumber = this.formatMobileNumber(investmentData.subscriber_number);

      const paymentRequest: MobileMoneyPaymentRequest = {
        profile_id: investmentData.user_id, // Backend requires profile_id
        user_id: investmentData.user_id,    // Backend also requires user_id
        project_id: investmentData.project_id,
        subscriber_number: formattedNumber,
        network: network,
        description: investmentData.description || 'Investment payment',
        amount: investmentData.amount,
        unit: investmentData.unit
      };

      console.log('Momo Payment Request:', JSON.stringify(paymentRequest, null, 2));
      return await this.processMobileMoneyPayment(paymentRequest);
    } catch (error) {
      console.error('Investment mobile money payment error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
export default paymentService;
