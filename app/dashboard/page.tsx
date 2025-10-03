'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard-layout';
import { useUser } from '@/contexts/UserContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useWallet } from '@/contexts/WalletContext';
import UserHeader from '@/components/user-header';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { useProjects } from '@/contexts/ProjectsContext';
import { useUpdates } from '@/contexts/UpdatesContext';
import { useTransactions } from '@/contexts/TransactionsContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Upload, 
  Download, 
  EyeOff, 
  Eye,
  ChevronRight,
  Wallet,
  TrendingUp,
  Activity,
  CheckCircle,
  Phone,
  CreditCard,
  Lock,
  Calendar,
  Info,
  X
} from 'lucide-react';
import PinValidationModal from '@/components/pin-validation-modal';
import WalletTestComponent from '@/components/WalletTestComponent';

const DashboardPage = () => {
  const router = useRouter();
  const { loading } = useUser();
  const { loading: profileLoading } = useProfile();
  const { wallet, loading: walletLoading, updateBalance, processCardPayment, processMobileMoneyPayment, processPayout } = useWallet();
  const { metrics, loading: portfolioLoading } = usePortfolio();
  const { projects, loading: projectsLoading } = useProjects();
  const { updates, loading: updatesLoading } = useUpdates();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isTopUpPinModalOpen, setIsTopUpPinModalOpen] = useState(false);
  const [isWithdrawPinModalOpen, setIsWithdrawPinModalOpen] = useState(false);
  const [amount, setAmount] = useState('3,000.00');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [currentStep, setCurrentStep] = useState('amount'); // 'amount', 'payment', 'pin', 'success', 'error'
  const [withdrawStep, setWithdrawStep] = useState('amount'); // 'amount', 'method', 'pin', 'success', 'error'
  const [paymentDetails, setPaymentDetails] = useState({
    networkProvider: '',
    phoneNumber: '',
    cardholderName: 'Amanda',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });
  const [withdrawDetails, setWithdrawDetails] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    networkProvider: '',
    phoneNumber: ''
  });

  const handleTopUp = () => {
    if (currentStep === 'amount') {
      // If payment method is selected, go to PIN confirmation
      if (paymentMethod) {
        setIsTopUpPinModalOpen(true);
      }
    }
  };

  const handleTopUpPinSuccess = async () => {
    setIsTopUpPinModalOpen(false);
    
    try {
      const topUpAmount = parseFloat(amount.replace(/,/g, ''));
      
      // Use payment API based on payment method
      if (paymentMethod === 'card') {
        // For card payments, we'd need card details from the user
        // For now, we'll use a test card
        const result = await processCardPayment({
          pan: '4111111111111111',
          exp_month: '12',
          exp_year: '25',
          cvv: '123',
          card_holder: 'Test User',
          amount: topUpAmount
        });
        
        if (result.success) {
          setCurrentStep('success');
        } else if (result.redirect_url) {
          // Handle 3D Secure redirect
          window.open(result.redirect_url, '_blank');
          setCurrentStep('success'); // Assume success for demo
        } else {
          setCurrentStep('error');
        }
      } else if (paymentMethod === 'momo') {
        // For mobile money, we'd need the user's mobile number
        // For now, we'll use a test number
        const result = await processMobileMoneyPayment({
          subscriber_number: '0241234567',
          amount: topUpAmount
        });
        
        if (result.success) {
          setCurrentStep('success');
        } else {
          setCurrentStep('error');
        }
      } else {
        // Fallback to direct wallet update for other methods
        const success = await updateBalance(topUpAmount, 'Top up via ' + paymentMethod);
        setCurrentStep(success ? 'success' : 'error');
      }
    } catch (error) {
      console.error('Top-up error:', error);
      setCurrentStep('error');
    }
  };

  const handleWithdraw = () => {
    if (withdrawStep === 'amount') {
      // If withdrawal method is selected, go to PIN confirmation
      if (withdrawMethod) {
        setIsWithdrawPinModalOpen(true);
      }
    }
  };

  const handleWithdrawPinSuccess = async () => {
    setIsWithdrawPinModalOpen(false);
    
    try {
      const withdrawAmountValue = parseFloat(withdrawAmount.replace(/,/g, ''));
      
      // Use payment API for payout
      const result = await processPayout({
        amount: withdrawAmountValue,
        channel: withdrawMethod === 'momo' ? 'momo' : 'bank',
        recipient_number: withdrawMethod === 'momo' ? '0241234567' : undefined,
        account_number: withdrawMethod === 'bank' ? '1234567890123' : undefined
      });
      
      if (result.success) {
        setWithdrawStep('success');
      } else {
        setWithdrawStep('error');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setWithdrawStep('error');
    }
  };



  const handleBalanceToggle = () => {
    if (isBalanceVisible) {
      setIsBalanceVisible(false);
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handleBalancePinSuccess = () => {
    setIsBalanceVisible(true);
    setIsPinModalOpen(false);
  };

  const resetTopUp = () => {
    setCurrentStep('amount');
    setPaymentMethod('');
    setIsTopUpOpen(false);
  };

  const resetWithdraw = () => {
    setWithdrawStep('amount');
    setWithdrawMethod('');
    setWithdrawAmount('');
    setIsWithdrawOpen(false);
  };

  if (loading || profileLoading || walletLoading || portfolioLoading || projectsLoading || updatesLoading || transactionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={`space-y-4 sm:space-y-6 px-4 sm:px-0 transition-all duration-300 ${isTopUpOpen || isWithdrawOpen ? 'main-content-blur' : ''}`}>
       
        {/* Header */}
        <UserHeader />

        {/* Dashboard Title */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h2>
        </div>

        {/* Account Balance Card */}
        <Card className="bg-gradient-to-l from-green-700 via-green-700 to-green-800 text-white border-0 shadow-xl">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <p className="text-green-50 text-sm font-semibold mb-2 sm:mb-3 tracking-wide uppercase">Account Balance</p>
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
                    {isBalanceVisible ? (
                      `${wallet?.currency || 'GHS'} ${wallet?.balance?.toLocaleString() || '0.00'}`
                    ) : (
                      '••••••••'
                    )}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-green-100 hover:text-white hover:bg-white/10 flex-shrink-0"
                    onClick={handleBalanceToggle}
                  >
                    {isBalanceVisible ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-green-100 text-xs font-medium">
                  {isBalanceVisible ? 'Balance visible' : 'Balance hidden'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  className="bg-white text-green-700 hover:bg-gray-50 font-medium text-sm sm:text-base py-2 sm:py-2.5"
                  onClick={() => setIsTopUpOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Top Up
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 bg-green-700 font-medium text-sm sm:text-base py-2 sm:py-2.5"
                  onClick={() => setIsWithdrawOpen(true)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Portfolio</h3>
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-gray-900 text-sm sm:text-base"
              onClick={() => router.push('/portfolio')}
            >
              View more
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <div className="p-1 sm:p-1.5 bg-green-100 rounded">
                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Total Invested</span>
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  GHS {metrics?.total_invested?.toLocaleString() || '0.00'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <div className="p-1 sm:p-1.5 bg-green-100 rounded">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Expected Returns</span>
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  GHS {metrics?.expected_returns?.toLocaleString() || '0.00'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <div className="p-1 sm:p-1.5 bg-green-100 rounded">
                    <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Active Projects</span>
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {metrics?.active_projects || 0}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <div className="p-1 sm:p-1.5 bg-green-100 rounded">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Total Units</span>
                </div>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {metrics?.total_units || 0}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Wallet Test Component - Remove this in production */}
      
        {/* Available Investment Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Available Investment</h3>
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-gray-900 text-sm sm:text-base"
              onClick={() => router.push('/investments')}
            >
              View more
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {projects.slice(0, 5).map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <div className="relative">
                  <Image 
                    src={project.cover_image_url || `https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=200&fit=crop`}
                    alt={project.project_name}
                    width={400}
                    height={200}
                    className="w-full h-24 sm:h-32 object-cover"
                  />
                  <Badge className={`absolute top-1 right-1 sm:top-2 sm:right-2 text-xs ${
                    project.status === 'Active' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : project.status === 'Completed'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  }`}>
                    {project.status?.toUpperCase() || 'AVAILABLE'}
                  </Badge>
                </div>
                <CardContent className="p-3 sm:p-4">
                  <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base line-clamp-1">{project.project_name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    GHS {project.unit_price?.toLocaleString()} <span className="text-xs">/Per Unit</span>
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>Return (ROI)</span>
                    <span>Duration</span>
                  </div>
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <span className="text-xs sm:text-sm font-semibold text-orange-600">
                      {project.expected_return_rate}%
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-orange-600">
                      {project.duration_months}M
                    </span>
                  </div>
                  <p className="text-xs text-green-600 font-medium">
                    {project.available_unit || 0} Units Available
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {projects.length === 0 && (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Available</h3>
                  <p className="text-gray-600">Check back later for new investment opportunities.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Recent Transactions</h4>
                <Button 
                  variant="ghost" 
                  className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
                  onClick={() => router.push('/transactions')}
                >
                  View all
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 sm:space-y-4">
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 4).map((transaction) => {
                    const getTransactionIcon = (type: string) => {
                      switch (type) {
                        case 'Payin':
                          return <Upload className="h-4 w-4 text-green-600" />;
                        case 'Payout':
                          return <TrendingUp className="h-4 w-4 text-green-600" />;
                        case 'Refund':
                          return <Download className="h-4 w-4 text-orange-600" />;
                        default:
                          return <Activity className="h-4 w-4 text-gray-600" />;
                      }
                    };

                    const getTransactionColor = (type: string) => {
                      switch (type) {
                        case 'Payin':
                          return 'bg-green-50 border-green-200';
                        case 'Payout':
                          return 'bg-green-50 border-green-200';
                        case 'Refund':
                          return 'bg-orange-50 border-orange-200';
                        default:
                          return 'bg-gray-50 border-gray-200';
                      }
                    };

                    const getAmountColor = (type: string) => {
                      switch (type) {
                        case 'Payin':
                          return 'text-green-600';
                        case 'Payout':
                          return 'text-green-600';
                        case 'Refund':
                          return 'text-orange-600';
                        default:
                          return 'text-gray-600';
                      }
                    };

                    const formatAmount = (amount: number, type: string) => {
                      const prefix = type === 'Payin' ? '+' : '-';
                      return `${prefix}GHS ${amount.toLocaleString()}`;
                    };

                    const formatDate = (dateString: string) => {
                      const date = new Date(dateString);
                      const now = new Date();
                      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
                      
                      if (diffInHours < 1) return 'Just now';
                      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
                      const diffInDays = Math.floor(diffInHours / 24);
                      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
                      return date.toLocaleDateString();
                    };

                    return (
                      <div 
                        key={transaction.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${getTransactionColor(transaction.type)}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transaction.type === 'Payin' ? 'bg-green-100' :
                            transaction.type === 'Payout' ? 'bg-green-100' :
                            transaction.type === 'Refund' ? 'bg-orange-100' :
                            'bg-gray-100'
                          }`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {transaction.type.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.project_name || transaction.description || 'Transaction'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${getAmountColor(transaction.type)}`}>
                            {formatAmount(transaction.amount, transaction.type)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(transaction.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Activity className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">No Recent Transactions</h3>
                  <p className="text-xs text-gray-500 mb-3">Your transaction history will appear here</p>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700 text-xs"
                    onClick={() => router.push('/investments')}
                  >
                    Start Investing
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Updates */}
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Latest Updates</h4>
                <Button 
                  variant="ghost" 
                  className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
                  onClick={() => router.push('/updates')}
                >
                  View more
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 sm:space-y-4">
              {updates.slice(0, 4).map((update) => (
                <div key={update.id} className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Image 
                    src={update.image_url || `https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=60&h=60&fit=crop`}
                    alt={update.title}
                    width={60}
                    height={60}
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-1">{update.title}</h5>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {update.description || update.update_text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 sm:mt-2 flex items-center gap-1">
                      <svg className="w-2 h-2 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(update.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}
              
              {updates.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">No updates available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Up Account Sheet */}
      <Sheet open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetTitle className="sr-only">Top Up Account</SheetTitle>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Top Up Account</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsTopUpOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {/* Amount Entry Step */}
                {currentStep === 'amount' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Enter Amount
                      </Label>
                      <p className="text-sm text-gray-600 mb-3">How much do you want to top up?</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          GHS
                        </span>
                        <Input
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-12 text-lg font-semibold"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-green-600 mt-2">Account balance: GHS 50.70</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Select Payment Method
                      </Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                        <div className="space-y-3">
                          {/* Mobile Money Option */}
                          <div className={`border rounded-lg p-4 ${paymentMethod === 'mobile' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="mobile" id="mobile" />
                              <Label htmlFor="mobile" className="flex-1 cursor-pointer flex items-center">
                                <Phone className="h-5 w-5 text-gray-600 mr-2" />
                                Mobile Money
                              </Label>
                            </div>
                            
                            {paymentMethod === 'mobile' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 space-y-4 overflow-hidden"
                              >
                                <div>
                                  <Label htmlFor="networkProvider" className="text-sm text-gray-600">
                                    Select network provider
                                  </Label>
                                  <Select onValueChange={(value) => setPaymentDetails({...paymentDetails, networkProvider: value})}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Eg. MTN" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="mtn">MTN</SelectItem>
                                      <SelectItem value="vodafone">Vodafone</SelectItem>
                                      <SelectItem value="airteltigo">AirtelTigo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="phoneNumber" className="text-sm text-gray-600">
                                    Phone number
                                  </Label>
                                  <div className="flex mt-1">
                                    <div className="flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md">
                                      <span className="text-sm text-gray-600">🇬🇭 +233</span>
                                    </div>
                                    <Input
                                      id="phoneNumber"
                                      placeholder="Eg. 55 567 8905"
                                      value={paymentDetails.phoneNumber}
                                      onChange={(e) => setPaymentDetails({...paymentDetails, phoneNumber: e.target.value})}
                                      className="rounded-l-none"
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="saveMobile" className="text-sm text-gray-600">
                                    Save this payment method
                                  </Label>
                                  <Switch
                                    id="saveMobile"
                                    checked={savePaymentMethod}
                                    onCheckedChange={setSavePaymentMethod}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </div>

                          {/* Bank Card Option */}
                          <div className={`border rounded-lg p-4 ${paymentMethod === 'card' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="card" id="card" />
                              <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center">
                                <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                                Bank Card
                              </Label>
                            </div>
                            
                            {paymentMethod === 'card' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 space-y-4 overflow-hidden"
                              >
                                <div>
                                  <Label htmlFor="cardholderName" className="text-sm text-gray-600">
                                    Cardholder Name
                                  </Label>
                                  <Input
                                    id="cardholderName"
                                    value={paymentDetails.cardholderName}
                                    onChange={(e) => setPaymentDetails({...paymentDetails, cardholderName: e.target.value})}
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="cardNumber" className="text-sm text-gray-600">
                                    Card number
                                  </Label>
                                  <div className="relative mt-1">
                                    <Input
                                      id="cardNumber"
                                      placeholder="0000 0000 0000 0000"
                                      value={paymentDetails.cardNumber}
                                      onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                                      className="pr-20"
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                      <Lock className="h-4 w-4 text-gray-400" />
                                      <div className="w-8 h-5 bg-red-500 rounded flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">MC</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="expiryDate" className="text-sm text-gray-600">
                                      Expiry Date
                                    </Label>
                                    <div className="relative mt-1">
                                      <Input
                                        id="expiryDate"
                                        placeholder="00/00"
                                        value={paymentDetails.expiryDate}
                                        onChange={(e) => setPaymentDetails({...paymentDetails, expiryDate: e.target.value})}
                                        className="pr-8"
                                      />
                                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor="cvv" className="text-sm text-gray-600">
                                      CVC/CVV
                                    </Label>
                                    <div className="relative mt-1">
                                      <Input
                                        id="cvv"
                                        placeholder="000"
                                        value={paymentDetails.cvv}
                                        onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                                        className="pr-8"
                                      />
                                      <Info className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <Label htmlFor="saveCard" className="text-sm text-gray-600">
                                    Save this payment method
                                  </Label>
                                  <Switch
                                    id="saveCard"
                                    checked={savePaymentMethod}
                                    onCheckedChange={setSavePaymentMethod}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}


                {/* Success Step */}
                {currentStep === 'success' && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="relative"
                    >
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      {/* Confetti animation */}
                      <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][i % 5],
                              left: '50%',
                              top: '50%',
                            }}
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{
                              x: (Math.random() - 0.5) * 200,
                              y: (Math.random() - 0.5) * 200,
                              opacity: 0,
                            }}
                            transition={{ duration: 1, delay: i * 0.05 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Top Up Successful</h3>
                      <p className="text-gray-600">
                        <span className="font-semibold text-orange-600">GHS {amount}</span> has been added to your in app account. 
                        Your new balance is <span className="font-semibold text-orange-600">GHS 3,050.70</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Step */}
                {currentStep === 'error' && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="h-6 w-6 text-white" />
                      </div>
                    </motion.div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
                      <p className="text-gray-600">
                        We couldn&apos;t complete your payment. Try again or use a different account.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-gray-200">
              {currentStep === 'amount' && (
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsTopUpOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleTopUp}
                    disabled={!paymentMethod}
                  >
                    Continue
                  </Button>
                </div>
              )}
              
              
              {(currentStep === 'success' || currentStep === 'error') && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={resetTopUp}
                >
                  {currentStep === 'success' ? 'Done' : 'Try Again'}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Withdraw Account Sheet */}
      <Sheet open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetTitle className="sr-only">Withdraw Account</SheetTitle>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Withdraw Funds</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsWithdrawOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <motion.div
                key={withdrawStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {/* Amount Entry Step */}
                {withdrawStep === 'amount' && (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Enter Amount
                      </Label>
                      <p className="text-sm text-gray-600 mb-3">How much do you want to withdraw?</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          GHS
                        </span>
                        <Input
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="pl-12 text-lg font-semibold"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-green-600 mt-2">Available balance: GHS {metrics?.total_invested?.toLocaleString() || '0.00'}</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-3 block">
                        Select Withdrawal Method
                      </Label>
                      <RadioGroup value={withdrawMethod} onValueChange={setWithdrawMethod}>
                        <div className="space-y-3">
                          {/* Bank Transfer Option */}
                          <div className={`border rounded-lg p-4 ${withdrawMethod === 'bank' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="bank" id="bank" />
                              <Label htmlFor="bank" className="flex-1 cursor-pointer flex items-center">
                                <CreditCard className="h-5 w-5 text-gray-600 mr-2" />
                                Bank Transfer
                              </Label>
                            </div>
                            
                            {withdrawMethod === 'bank' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 space-y-4 overflow-hidden"
                              >
                                <div>
                                  <Label htmlFor="bankName" className="text-sm text-gray-600">
                                    Bank Name
                                  </Label>
                                  <Select onValueChange={(value) => setWithdrawDetails({...withdrawDetails, bankName: value})}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Select bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="gcb">GCB Bank</SelectItem>
                                      <SelectItem value="absa">Absa Bank</SelectItem>
                                      <SelectItem value="ecobank">Ecobank</SelectItem>
                                      <SelectItem value="fidelity">Fidelity Bank</SelectItem>
                                      <SelectItem value="stanbic">Stanbic Bank</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="accountNumber" className="text-sm text-gray-600">
                                    Account Number
                                  </Label>
                                  <Input
                                    id="accountNumber"
                                    placeholder="Enter account number"
                                    value={withdrawDetails.accountNumber}
                                    onChange={(e) => setWithdrawDetails({...withdrawDetails, accountNumber: e.target.value})}
                                    className="mt-1"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="accountName" className="text-sm text-gray-600">
                                    Account Holder Name
                                  </Label>
                                  <Input
                                    id="accountName"
                                    placeholder="Enter account holder name"
                                    value={withdrawDetails.accountName}
                                    onChange={(e) => setWithdrawDetails({...withdrawDetails, accountName: e.target.value})}
                                    className="mt-1"
                                  />
                                </div>
                              </motion.div>
                            )}
                          </div>

                          {/* Mobile Money Option */}
                          <div className={`border rounded-lg p-4 ${withdrawMethod === 'mobile' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="mobile" id="mobile-withdraw" />
                              <Label htmlFor="mobile-withdraw" className="flex-1 cursor-pointer flex items-center">
                                <Phone className="h-5 w-5 text-gray-600 mr-2" />
                                Mobile Money
                              </Label>
                            </div>
                            
                            {withdrawMethod === 'mobile' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 space-y-4 overflow-hidden"
                              >
                                <div>
                                  <Label htmlFor="networkProviderWithdraw" className="text-sm text-gray-600">
                                    Select network provider
                                  </Label>
                                  <Select onValueChange={(value) => setWithdrawDetails({...withdrawDetails, networkProvider: value})}>
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="Eg. MTN" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="mtn">MTN</SelectItem>
                                      <SelectItem value="vodafone">Vodafone</SelectItem>
                                      <SelectItem value="airteltigo">AirtelTigo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="phoneNumberWithdraw" className="text-sm text-gray-600">
                                    Phone number
                                  </Label>
                                  <div className="flex mt-1">
                                    <div className="flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 rounded-l-md">
                                      <span className="text-sm text-gray-600">🇬🇭 +233</span>
                                    </div>
                                    <Input
                                      id="phoneNumberWithdraw"
                                      placeholder="Eg. 55 567 8905"
                                      value={withdrawDetails.phoneNumber}
                                      onChange={(e) => setWithdrawDetails({...withdrawDetails, phoneNumber: e.target.value})}
                                      className="rounded-l-none"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}


                {/* Success Step */}
                {withdrawStep === 'success' && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="relative"
                    >
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      {/* Confetti animation */}
                      <div className="absolute inset-0 pointer-events-none">
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][i % 5],
                              left: '50%',
                              top: '50%',
                            }}
                            initial={{ x: 0, y: 0, opacity: 1 }}
                            animate={{
                              x: (Math.random() - 0.5) * 200,
                              y: (Math.random() - 0.5) * 200,
                              opacity: 0,
                            }}
                            transition={{ duration: 1, delay: i * 0.05 }}
                          />
                        ))}
                      </div>
                    </motion.div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Withdrawal Successful</h3>
                      <p className="text-gray-600">
                        <span className="font-semibold text-orange-600">GHS {withdrawAmount}</span> has been sent to your {withdrawMethod === 'bank' ? 'bank account' : 'mobile money'}. 
                        Your new balance is <span className="font-semibold text-orange-600">GHS {(parseFloat(metrics?.total_invested?.toString() || '0') - parseFloat(withdrawAmount || '0')).toLocaleString()}</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Step */}
                {withdrawStep === 'error' && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="h-6 w-6 text-white" />
                      </div>
                    </motion.div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Withdrawal Failed</h3>
                      <p className="text-gray-600">
                        We couldn&apos;t process your withdrawal. Please check your details and try again.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-gray-200">
              {withdrawStep === 'amount' && (
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsWithdrawOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleWithdraw}
                    disabled={!withdrawMethod || !withdrawAmount}
                  >
                    Continue
                  </Button>
                </div>
              )}
              
              
              {(withdrawStep === 'success' || withdrawStep === 'error') && (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={resetWithdraw}
                >
                  {withdrawStep === 'success' ? 'Done' : 'Try Again'}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Balance PIN Modal */}
      <PinValidationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleBalancePinSuccess}
        title="Enter PIN to View Balance"
        description="Please enter your 4-digit PIN to view your account balance"
        action="View Balance"
      />

      {/* Top Up PIN Modal */}
      <PinValidationModal
        isOpen={isTopUpPinModalOpen}
        onClose={() => setIsTopUpPinModalOpen(false)}
        onSuccess={handleTopUpPinSuccess}
        title="Confirm Top Up"
        description="Enter your 4-digit PIN to confirm this top up transaction"
        action="Confirm Top Up"
      />

      {/* Withdraw PIN Modal */}
      <PinValidationModal
        isOpen={isWithdrawPinModalOpen}
        onClose={() => setIsWithdrawPinModalOpen(false)}
        onSuccess={handleWithdrawPinSuccess}
        title="Confirm Withdrawal"
        description="Enter your 4-digit PIN to confirm this withdrawal transaction"
        action="Confirm Withdrawal"
      />
    </DashboardLayout>
  );
};

export default DashboardPage;