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
import { ArrowUpRight, Loader2 } from 'lucide-react';
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
  const { processWalletWithdrawal } = useWallet();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
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
        setError('Recipient number and network are required for mobile money');
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
        setShowKycModal(true);
      } else {
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (GHS)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount to withdraw"
              required
            />
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
                <Label htmlFor="recipient_number">Mobile Number</Label>
                <Input
                  id="recipient_number"
                  value={formData.recipient_number}
                  onChange={(e) => handleInputChange('recipient_number', e.target.value)}
                  placeholder="0241183886"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account_issuer">Network</Label>
                <Select
                  value={formData.account_issuer}
                  onValueChange={(value) => handleInputChange('account_issuer', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="VDF">Vodafone</SelectItem>
                    <SelectItem value="ATL">AirtelTigo</SelectItem>
                  </SelectContent>
                </Select>
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
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
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base shadow-lg"
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
