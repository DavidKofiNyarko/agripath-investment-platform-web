'use client';

import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const WalletTestComponent = () => {
  const { 
    wallet, 
    loading, 
    updateBalance, 
    refreshWallet,
    processCardPayment,
    processMobileMoneyPayment,
    processPayout
  } = useWallet();
  const { user } = useUser();

  // Test form states
  const [cardData, setCardData] = useState({
    pan: '4111111111111111',
    exp_month: '12',
    exp_year: '25',
    cvv: '123',
    card_holder: 'Test User',
    amount: 100
  });

  const [momoData, setMomoData] = useState({
    subscriber_number: '0241234567',
    amount: 50
  });

  const [payoutData, setPayoutData] = useState({
    amount: 25,
    channel: 'momo' as 'momo' | 'bank',
    recipient_number: '0241234567'
  });

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleTestDeposit = async () => {
    const success = await updateBalance(100, 'Test deposit');
    if (success) {
      addTestResult('✅ Test deposit successful!');
    } else {
      addTestResult('❌ Test deposit failed!');
    }
  };

  const handleTestWithdrawal = async () => {
    const success = await updateBalance(-50, 'Test withdrawal');
    if (success) {
      addTestResult('✅ Test withdrawal successful!');
    } else {
      addTestResult('❌ Test withdrawal failed!');
    }
  };

  const handleTestCardPayment = async () => {
    try {
      const result = await processCardPayment(cardData);
      if (result.success) {
        addTestResult('✅ Card payment successful!');
      } else if (result.redirect_url) {
        addTestResult('🔄 3D Secure required - redirecting...');
        // In a real app, you'd redirect to the URL
        window.open(result.redirect_url, '_blank');
      } else {
        addTestResult(`❌ Card payment failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Card payment error: ${error}`);
    }
  };

  const handleTestMomoPayment = async () => {
    try {
      const result = await processMobileMoneyPayment(momoData);
      if (result.success) {
        addTestResult('✅ Mobile money payment successful!');
      } else {
        addTestResult(`❌ Mobile money payment failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Mobile money payment error: ${error}`);
    }
  };

  const handleTestPayout = async () => {
    try {
      const result = await processPayout(payoutData);
      if (result.success) {
        addTestResult('✅ Payout successful!');
      } else {
        addTestResult(`❌ Payout failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Payout error: ${error}`);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Wallet Test Component <Badge variant="secondary">Debug</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading wallet data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Wallet Test Component <Badge variant="secondary">Debug</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info */}
        <div>
          <h3 className="font-semibold mb-2">User Info</h3>
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>

        {/* Wallet Info */}
        <div>
          <h3 className="font-semibold mb-2">Wallet Info</h3>
          {wallet ? (
            <div>
              <p><strong>Wallet ID:</strong> {wallet.id}</p>
              <p><strong>Balance:</strong> {wallet.currency} {wallet.balance?.toLocaleString()}</p>
              <p><strong>Status:</strong> {wallet.status}</p>
              <p><strong>Created:</strong> {new Date(wallet.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <p>No wallet found</p>
          )}
        </div>

        {/* Basic Wallet Tests */}
        <div>
          <h3 className="font-semibold mb-2">Basic Wallet Tests</h3>
          <div className="flex gap-2">
            <Button onClick={handleTestDeposit} variant="outline">
              Test Deposit (+100)
            </Button>
            <Button onClick={handleTestWithdrawal} variant="outline">
              Test Withdrawal (-50)
            </Button>
            <Button onClick={refreshWallet} variant="outline">
              Refresh Wallet
            </Button>
          </div>
        </div>

        {/* Card Payment Test */}
        <div>
          <h3 className="font-semibold mb-2">Card Payment Test</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label htmlFor="pan">Card Number</Label>
              <Input
                id="pan"
                value={cardData.pan}
                onChange={(e) => setCardData(prev => ({ ...prev, pan: e.target.value }))}
                placeholder="4111111111111111"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={cardData.amount}
                onChange={(e) => setCardData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="100"
              />
            </div>
          </div>
          <Button onClick={handleTestCardPayment} variant="outline">
            Test Card Payment
          </Button>
        </div>

        {/* Mobile Money Test */}
        <div>
          <h3 className="font-semibold mb-2">Mobile Money Test</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label htmlFor="momo-number">Mobile Number</Label>
              <Input
                id="momo-number"
                value={momoData.subscriber_number}
                onChange={(e) => setMomoData(prev => ({ ...prev, subscriber_number: e.target.value }))}
                placeholder="0241234567"
              />
            </div>
            <div>
              <Label htmlFor="momo-amount">Amount</Label>
              <Input
                id="momo-amount"
                type="number"
                value={momoData.amount}
                onChange={(e) => setMomoData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="50"
              />
            </div>
          </div>
          <Button onClick={handleTestMomoPayment} variant="outline">
            Test Mobile Money Payment
          </Button>
        </div>

        {/* Payout Test */}
        <div>
          <h3 className="font-semibold mb-2">Payout Test</h3>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <Label htmlFor="payout-amount">Amount</Label>
              <Input
                id="payout-amount"
                type="number"
                value={payoutData.amount}
                onChange={(e) => setPayoutData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="25"
              />
            </div>
            <div>
              <Label htmlFor="payout-number">Recipient Number</Label>
              <Input
                id="payout-number"
                value={payoutData.recipient_number}
                onChange={(e) => setPayoutData(prev => ({ ...prev, recipient_number: e.target.value }))}
                placeholder="0241234567"
              />
            </div>
          </div>
          <Button onClick={handleTestPayout} variant="outline">
            Test Payout
          </Button>
        </div>

        {/* Test Results */}
        <div>
          <h3 className="font-semibold mb-2">Test Results</h3>
          <div className="bg-gray-100 p-3 rounded max-h-40 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet</p>
            ) : (
              testResults.map((result, index) => (
                <p key={index} className="text-sm">{result}</p>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WalletTestComponent;