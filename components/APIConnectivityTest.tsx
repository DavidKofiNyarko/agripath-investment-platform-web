'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const APIConnectivityTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testAPIConnectivity = async () => {
    addResult('🔄 Testing API connectivity...');
    
    try {
      // Test 1: Check if server is running
      const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'https://infra.agripath.co/api/payments';
      addResult(`📍 Testing URL: ${baseUrl}`);
      
      // Test 2: Simple GET request to check server
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      addResult(`📊 Response Status: ${response.status}`);
      addResult(`📊 Response OK: ${response.ok}`);
      
      if (response.ok) {
        addResult('✅ Server is running and accessible!');
      } else {
        addResult(`⚠️ Server responded with status: ${response.status}`);
      }
      
    } catch (error) {
      addResult(`❌ Connection Error: ${error}`);
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        addResult('🔍 Diagnosis: Backend server is not running or not accessible');
        addResult('💡 Solution: Start the backend server on port 3001');
      }
    }
  };

  const testCardEndpoint = async () => {
    addResult('🔄 Testing card payment endpoint...');
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_PAYMENT_API_URL || 'https://infra.agripath.co/api/payments';
      const response = await fetch(`${baseUrl}/card/payin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Minimal test data
          pan: '4111111111111111',
          exp_month: '12',
          exp_year: '25',
          cvv: '123',
          card_holder: 'Test User',
          user_id: '785e135d-3520-4bb2-9eaa-ae44e4fb93e0',
          user_email: 'test@test.com',
          user_name: 'Test User',
          project_id: 'c9bdea08-0941-4d91-9b3e-9a318e0a8805',
          amount: 100,
          unit: 1,
          fees: 3.5,
          net_amount: 96.5,
          transaction_id: '123456789012',
          type: 'Payin',
          status: 'Pending',
          desc: 'Test payment',
          processed_at: new Date().toISOString(),
          r_switch: 'VIS',
          redirect_url: 'http://localhost:3000/callback',
          external_id: 'ext_123',
          channel: 'card',
          profiles_id: '2ccc4654-c305-4b78-a25c-708a8238c536'
        })
      });
      
      addResult(`📊 Card Endpoint Status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        addResult(`✅ Card endpoint working! Response: ${JSON.stringify(result)}`);
      } else {
        const error = await response.text();
        addResult(`⚠️ Card endpoint error: ${error}`);
      }
      
    } catch (error) {
      addResult(`❌ Card endpoint error: ${error}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Connectivity Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testAPIConnectivity} variant="outline">
            Test API Connectivity
          </Button>
          <Button onClick={testCardEndpoint} variant="outline">
            Test Card Endpoint
          </Button>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Test Results</h3>
          <div className="bg-gray-100 p-3 rounded max-h-60 overflow-y-auto">
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

export default APIConnectivityTest;
