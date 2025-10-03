'use client';

import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { paymentService } from '@/lib/paymentService';

const InvestmentPaymentTestComponent = () => {
  const { user } = useUser();
  const { profile } = useProfile();

  // Test project data
  const testProject = {
    id: 'c9bdea08-0941-4d91-9b3e-9a318e0a8805', // Real project ID from database
    name: 'Goat Farm Investment',
    price: 5000,
    available_units: 100
  };

  // Use backend user data for testing (backend has its own user management)
  const testUserData = {
    user_id: '78ffde61-241e-4074-938c-e240ec53b45a', // Valid backend user ID
    user_email: 'michael@example.com', // Valid backend user email
    profiles_id: '2ccc4654-c305-4b78-a25c-708a8238c536', // Valid profile ID
    user_name: 'Michael' // Valid backend user name
  };

  // Test form states
  const [investmentData, setInvestmentData] = useState({
    quantity: 1,
    paymentMethod: 'card',
    cardDetails: {
      pan: '4111111111111111',
      exp_month: '12',
      exp_year: '25',
      cvv: '123',
      card_holder: 'Test User'
    },
    mobileDetails: {
      subscriber_number: '0241234567',
      provider: 'MTN'
    }
  });

  const [testResults, setTestResults] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const handleInvestmentPayment = async () => {
    if (!user || !profile) {
      addTestResult('❌ User or profile not found');
      return;
    }

    // Validate required user data
    if (!testUserData.user_id || !testUserData.profiles_id) {
      addTestResult('❌ Missing required user data (user_id or profiles_id)');
      return;
    }

    setIsProcessing(true);
    addTestResult('🔄 Processing investment payment...');

    try {
      const totalAmount = testProject.price * investmentData.quantity;
      
      // Debug user info
      console.log('User info:', {
        userEmail: user?.email,
        userName: user?.user_metadata?.full_name,
        profileId: profile?.id
      });
      
      let paymentResult;

      if (investmentData.paymentMethod === 'card') {
        paymentResult = await paymentService.processInvestmentCardPayment({
          user_id: testUserData.user_id, // Use test user ID
          project_id: testProject.id,
          amount: totalAmount,
          unit: investmentData.quantity,
          cardDetails: investmentData.cardDetails,
          user_email: testUserData.user_email, // Use test email
          user_name: testUserData.user_name, // Use test name
          profiles_id: testUserData.profiles_id, // Use test profile ID
          description: `Test investment in ${testProject.name}`
        });
      } else {
        paymentResult = await paymentService.processInvestmentMobileMoneyPayment({
          user_id: testUserData.user_id, // Use test user ID
          project_id: testProject.id,
          amount: totalAmount,
          unit: investmentData.quantity,
          subscriber_number: investmentData.mobileDetails.subscriber_number,
          network: investmentData.mobileDetails.provider,
          user_email: testUserData.user_email, // Use test email
          user_name: testUserData.user_name, // Use test name
          profiles_id: testUserData.profiles_id, // Use test profile ID
          description: `Test investment in ${testProject.name}`
        });
      }

      if (paymentResult.status === 'success') {
        addTestResult(`✅ Investment payment successful! Amount: GHS ${totalAmount}`);
        addTestResult(`📊 Project: ${testProject.name}, Units: ${investmentData.quantity}`);
      } else if (paymentResult.status === 'vbv_required') {
        addTestResult('🔄 3D Secure required - redirecting...');
        if (paymentResult.redirect_url) {
          window.open(paymentResult.redirect_url, '_blank');
        }
      } else {
        addTestResult(`❌ Payment failed: ${paymentResult.reason || 'Unknown error'}`);
      }
    } catch (error) {
      addTestResult(`❌ Investment payment error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Investment Payment Test <Badge variant="secondary">Debug</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info */}
        <div>
          <h3 className="font-semibold mb-2">User Info</h3>
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Profile ID:</strong> {profile?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>

        {/* Test Project Info */}
        <div>
          <h3 className="font-semibold mb-2">Test Project</h3>
          <p><strong>Project:</strong> {testProject.name}</p>
          <p><strong>Unit Price:</strong> GHS {testProject.price.toLocaleString()}</p>
          <p><strong>Available Units:</strong> {testProject.available_units}</p>
        </div>

        {/* Backend User Data */}
        <div>
          <h3 className="font-semibold mb-2">Backend User Data (For Testing)</h3>
          <p><strong>User ID:</strong> {testUserData.user_id}</p>
          <p><strong>Email:</strong> {testUserData.user_email}</p>
          <p><strong>Profile ID:</strong> {testUserData.profiles_id || 'Not available'}</p>
          <p><strong>Name:</strong> {testUserData.user_name}</p>
          <p className="text-sm text-gray-600 mt-2">
            <strong>Note:</strong> Backend uses its own user management system separate from Supabase Auth
          </p>
        </div>

        {/* Investment Form */}
        <div>
          <h3 className="font-semibold mb-2">Investment Details</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={testProject.available_units}
                value={investmentData.quantity}
                onChange={(e) => setInvestmentData(prev => ({ 
                  ...prev, 
                  quantity: Math.max(1, Math.min(testProject.available_units, Number(e.target.value)))
                }))}
              />
            </div>
            <div>
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select 
                value={investmentData.paymentMethod} 
                onValueChange={(value) => setInvestmentData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card Payment</SelectItem>
                  <SelectItem value="mobile">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Card Details */}
          {investmentData.paymentMethod === 'card' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="card-number">Card Number</Label>
                <Input
                  id="card-number"
                  value={investmentData.cardDetails.pan}
                  onChange={(e) => setInvestmentData(prev => ({ 
                    ...prev, 
                    cardDetails: { ...prev.cardDetails, pan: e.target.value }
                  }))}
                  placeholder="4111111111111111"
                />
              </div>
              <div>
                <Label htmlFor="card-holder">Card Holder</Label>
                <Input
                  id="card-holder"
                  value={investmentData.cardDetails.card_holder}
                  onChange={(e) => setInvestmentData(prev => ({ 
                    ...prev, 
                    cardDetails: { ...prev.cardDetails, card_holder: e.target.value }
                  }))}
                  placeholder="Test User"
                />
              </div>
              <div>
                <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                <Input
                  id="expiry"
                  value={`${investmentData.cardDetails.exp_month}/${investmentData.cardDetails.exp_year}`}
                  onChange={(e) => {
                    const [month, year] = e.target.value.split('/');
                    setInvestmentData(prev => ({ 
                      ...prev, 
                      cardDetails: { 
                        ...prev.cardDetails, 
                        exp_month: month || '',
                        exp_year: year || ''
                      }
                    }));
                  }}
                  placeholder="12/25"
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  value={investmentData.cardDetails.cvv}
                  onChange={(e) => setInvestmentData(prev => ({ 
                    ...prev, 
                    cardDetails: { ...prev.cardDetails, cvv: e.target.value }
                  }))}
                  placeholder="123"
                />
              </div>
            </div>
          )}

          {/* Mobile Money Details */}
          {investmentData.paymentMethod === 'mobile' && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="mobile-number">Mobile Number</Label>
                <Input
                  id="mobile-number"
                  value={investmentData.mobileDetails.subscriber_number}
                  onChange={(e) => setInvestmentData(prev => ({ 
                    ...prev, 
                    mobileDetails: { ...prev.mobileDetails, subscriber_number: e.target.value }
                  }))}
                  placeholder="0241234567"
                />
              </div>
              <div>
                <Label htmlFor="provider">Provider</Label>
                <Select 
                  value={investmentData.mobileDetails.provider} 
                  onValueChange={(value) => setInvestmentData(prev => ({ 
                    ...prev, 
                    mobileDetails: { ...prev.mobileDetails, provider: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MTN">MTN</SelectItem>
                    <SelectItem value="VDF">Vodafone</SelectItem>
                    <SelectItem value="ATL">AirtelTigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Investment Summary */}
          <div className="bg-gray-100 p-4 rounded mb-4">
            <h4 className="font-semibold mb-2">Investment Summary</h4>
            <p><strong>Project:</strong> {testProject.name}</p>
            <p><strong>Units:</strong> {investmentData.quantity}</p>
            <p><strong>Unit Price:</strong> GHS {testProject.price.toLocaleString()}</p>
            <p><strong>Total Amount:</strong> GHS {(testProject.price * investmentData.quantity).toLocaleString()}</p>
            <p><strong>Payment Method:</strong> {investmentData.paymentMethod === 'card' ? 'Card Payment' : 'Mobile Money'}</p>
          </div>

          <Button 
            onClick={handleInvestmentPayment} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Test Investment Payment'}
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

export default InvestmentPaymentTestComponent;
