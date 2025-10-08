'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WalletWithdrawal from '@/components/wallet-withdrawal';
import WalletTopup from '@/components/wallet-topup';
import { Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const WalletPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
            <p className="text-gray-600 mt-1">Manage your wallet transactions and balances</p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <Wallet className="w-6 h-6" />
            <span className="text-sm font-medium">AgriPath Wallet</span>
          </div>
        </div>

        {/* Wallet Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">GHS 0.00</div>
              <p className="text-xs text-gray-500 mt-1">Current wallet balance</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Deposits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">GHS 0.00</div>
              <p className="text-xs text-gray-500 mt-1">All-time deposits</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Withdrawals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">GHS 0.00</div>
              <p className="text-xs text-gray-500 mt-1">All-time withdrawals</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={() => setActiveTab('topup')}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Add Money
              </Button>
              <Button
                onClick={() => setActiveTab('withdrawal')}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <ArrowUpRight className="w-4 h-4" />
                Withdraw Money
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="topup">Add Money</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdraw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Start by adding money to your wallet</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="topup">
            <WalletTopup />
          </TabsContent>
          
          <TabsContent value="withdrawal">
            <WalletWithdrawal />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletPage;
