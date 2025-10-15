'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { useWallet } from '@/contexts/WalletContext';
import { ArrowUpRight, Loader2, AlertTriangle, Wallet } from 'lucide-react';
import KycRequiredModal from '@/components/kyc-required-modal';

interface WithdrawalFormData {
  amount: string;
  channel: 'bank' | 'momo';
  description: string;
  // Bank fields
  account_number: string;
  account_bank: string;
  // Momo fields
  recipient_number: string;
  account_issuer: string;
}

const WalletWithdrawal: React.FC = () => {
  const { user } = useUser();
  const { profile } = useProfile();
  const { projects } = useProjects();
  const { processWalletWithdrawal, wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'general' | 'insufficient_funds' | 'kyc'>('general');
  const [showKycModal, setShowKycModal] = useState(false);
  
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: '',
    channel: 'bank',
    description: '',
    account_number: '',
    account_bank: '',
    recipient_number: '',
    account_issuer: 'VDF'
  });

  const handleInputChange = (field: keyof WithdrawalFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
    setErrorType('general');
  };

  // Check if withdrawal amount exceeds wallet balance
  const isAmountExceedingBalance = () => {
    if (!wallet?.balance || !formData.amount) return false;
    const withdrawalAmount = parseFloat(formData.amount);
    return withdrawalAmount > wallet.balance;
  };

  // Get validation error message
  const getValidationError = () => {
    if (!formData.amount) return '';
    
    const amount = parseFloat(formData.amount);
    if (amount <= 0) return 'Amount must be greater than 0';
    if (isAmountExceedingBalance()) return 'Amount exceeds available balance';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id || !profile?.id) {
      setError('User not authenticated');
      return;
    }

    if (!projects || projects.length === 0) {
      setError('No projects available');
      return;
    }

    // Validate required fields based on channel
    if (formData.channel === 'bank') {
      if (!formData.account_number || !formData.account_bank) {
        setError('Account number and bank are required for bank transfers');
        return;
      }
    } else if (formData.channel === 'momo') {
      if (!formData.recipient_number || !formData.account_issuer) {
        setError('Recipient number and network provider are required for mobile money');
        return;
      }
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const withdrawalData = {
        amount: parseFloat(formData.amount),
        channel: formData.channel,
        description: formData.description || `Wallet withdrawal - ${formData.channel}`,
        ...(formData.channel === 'bank' ? {
          account_number: formData.account_number,
          account_bank: formData.account_bank
        } : {
          recipient_number: formData.recipient_number,
          account_issuer: formData.account_issuer
        })
      };

      const result = await processWalletWithdrawal(withdrawalData);

      if (result.success) {
        setSuccess('Withdrawal request submitted successfully!');
        
        // Reset form
        setFormData({
          amount: '',
          channel: 'bank',
          description: '',
          account_number: '',
          account_bank: '',
          recipient_number: '',
          account_issuer: 'VDF'
        });
      } else if (result.error?.includes('KYC verification required')) {
        // Show KYC modal instead of error message
        setErrorType('kyc');
        setShowKycModal(true);
      } else if (result.error === 'insufficient_funds') {
        // Handle insufficient funds error specifically
        setErrorType('insufficient_funds');
        setError(result.details || 'Insufficient funds in merchant account. Please try a smaller amount or contact support.');
      } else {
        setErrorType('general');
        setError(result.error || 'Withdrawal failed. Please try again.');
      }

    } catch (err) {
      console.error('Withdrawal error:', err);
      setError(err instanceof Error ? err.message : 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-green-600" />
          Wallet Withdrawal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Wallet Balance Display */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-5 w-5 text-green-600" />
           
          </div>
          <div className="text-2xl font-bold text-green-700">
            {wallet?.currency || 'GHS'} {wallet?.balance?.toLocaleString('en-US', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) || '0.00'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (GHS)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={wallet?.balance || undefined}
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount to withdraw"
              className={isAmountExceedingBalance() ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
              required
            />
            {getValidationError() && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {getValidationError()}
              </p>
            )}
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <Label htmlFor="channel">Withdrawal Method</Label>
            <Select
              value={formData.channel}
              onValueChange={(value: 'bank' | 'momo') => handleInputChange('channel', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select withdrawal method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="momo">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Transfer Fields */}
          {formData.channel === 'bank' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                  placeholder="Enter account number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_bank">Bank</Label>
                <Select
                  value={formData.account_bank}
                  onValueChange={(value) => handleInputChange('account_bank', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADB">ADB Bank</SelectItem>
                    <SelectItem value="GCB">GCB Bank</SelectItem>
                    <SelectItem value="FBN">First Bank of Nigeria</SelectItem>
                    <SelectItem value="UBA">United Bank for Africa</SelectItem>
                    <SelectItem value="ECB">Ecobank</SelectItem>
                    <SelectItem value="SCB">Standard Chartered Bank</SelectItem>
                    <SelectItem value="ABSA">Absa Bank</SelectItem>
                    <SelectItem value="FIDELITY">Fidelity Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Mobile Money Fields */}
          {formData.channel === 'momo' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="recipient_number" className="text-sm font-medium text-gray-700 mb-2 block">
                  Mobile Number
                </Label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-green-500">
                  <div className="flex items-center px-3 py-3 bg-gray-50 border-r border-gray-300">
                    <span className="text-lg mr-2">🇬🇭</span>
                    <span className="text-sm font-medium text-gray-700">+233</span>
                  </div>
                  <Input
                    id="recipient_number"
                    value={formData.recipient_number}
                    onChange={(e) => handleInputChange('recipient_number', e.target.value)}
                    placeholder="024 567 8905"
                    required
                    className="flex-1 border-0 rounded-none focus:ring-0 focus:border-0 py-3 px-3 text-gray-900 placeholder-gray-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_issuer">Network Provider *</Label>
                <Select
                  value={formData.account_issuer}
                  onValueChange={(value) => handleInputChange('account_issuer', value)}
                >
                  <SelectTrigger className={!formData.account_issuer ? 'border-red-300 focus:border-red-500' : ''}>
                    <SelectValue placeholder="Select network provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>MTN</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="VDF">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>Vodafone</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ATL">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Airtel</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="TGO">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Tigo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ZPY">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Zeepay</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="GMY">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>G-money</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!formData.account_issuer && (
                  <p className="text-sm text-red-600">Please select a network provider</p>
                )}
              </div>
            </>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add a description for this withdrawal"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className={`p-4 rounded-lg border ${
              errorType === 'insufficient_funds' 
                ? 'bg-orange-50 border-orange-200' 
                : errorType === 'kyc'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                  errorType === 'insufficient_funds' 
                    ? 'text-orange-600' 
                    : errorType === 'kyc'
                    ? 'text-blue-600'
                    : 'text-red-600'
                }`} />
                <div>
                  <p className={`font-medium ${
                    errorType === 'insufficient_funds' 
                      ? 'text-orange-800' 
                      : errorType === 'kyc'
                      ? 'text-blue-800'
                      : 'text-red-800'
                  }`}>
                    {errorType === 'insufficient_funds' 
                      ? 'Insufficient Funds' 
                      : errorType === 'kyc'
                      ? 'KYC Verification Required'
                      : 'Withdrawal Failed'
                    }
                  </p>
                  <p className={`text-sm mt-1 ${
                    errorType === 'insufficient_funds' 
                      ? 'text-orange-700' 
                      : errorType === 'kyc'
                      ? 'text-blue-700'
                      : 'text-red-700'
                  }`}>
                    {error}
                  </p>
                  {errorType === 'insufficient_funds' && (
                    <p className="text-sm text-orange-600 mt-2">
                      💡 Try withdrawing a smaller amount or contact support for assistance.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || isAmountExceedingBalance() || !!getValidationError()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Withdrawal...
              </>
            ) : (
              'Submit Withdrawal Request'
            )}
          </Button>
        </form>
      </CardContent>
      
      {/* KYC Required Modal */}
      <KycRequiredModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        onCompleteKyc={() => {
          setShowKycModal(false);
          // Navigate to profile setup or KYC page
          window.location.href = '/profile-setup';
        }}
        transactionType="withdrawal"
      />
    </Card>
  );
};

export default WalletWithdrawal;
