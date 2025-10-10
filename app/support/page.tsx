'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import { Badge } from '@/components/ui/badge'; // Unused import
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  MessageCircle
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const SupportPage = () => {
  const [activeCategory, setActiveCategory] = useState('general');
  const [expandedItems, setExpandedItems] = useState<string[]>(['what-is-agripath']);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'investments', label: 'Investments' },
    { id: 'payments', label: 'Payments & Payouts' },
    { id: 'withdrawals', label: 'Withdrawals' },
    { id: 'account', label: 'Account & Security' }
  ];

  const faqData: { [key: string]: FAQItem[] } = {
    general: [
      {
        id: 'what-is-agripath',
        question: 'What is AgriPath, and how does it work?',
        answer: 'AgriPath is an agricultural investment platform that allows investors to fund various crop production projects and earn returns based on harvest sales. We connect investors with carefully selected farming projects, providing transparency and regular updates throughout the growing season.'
      },
      {
        id: 'how-to-invest',
        question: 'How do I start investing with AgriPath?',
        answer: 'To start investing, simply create an account, complete the KYC verification process, add a payment method, and browse available investment opportunities. Each project shows expected returns, duration, and risk factors to help you make informed decisions.'
      },
      {
        id: 'minimum-investment',
        question: 'What\'s the minimum investment amount?',
        answer: 'The minimum investment amount varies by project, but typically starts from GHS 100. Each investment opportunity clearly displays the minimum and maximum investment amounts allowed.'
      },
      {
        id: 'investment-risks',
        question: 'What are the risks involved in agricultural investments?',
        answer: 'Agricultural investments carry inherent risks including weather conditions, pest outbreaks, market price fluctuations, and crop yield variations. We work with experienced farmers and implement risk mitigation strategies, but returns are not guaranteed.'
      }
    ],
    investments: [
      {
        id: 'how-returns-work',
        question: 'How are returns calculated?',
        answer: 'Returns are calculated based on the actual harvest yield and market prices at the time of sale. We use a revenue-sharing model where investors receive a percentage of the net profits from the harvest sales.'
      },
      {
        id: 'investment-duration',
        question: 'How long do investments typically last?',
        answer: 'Investment duration varies by crop type and growing season. Most projects range from 3-12 months, with some longer-term investments lasting up to 18 months. Each project clearly states its expected duration.'
      },
      {
        id: 'project-selection',
        question: 'How are farming projects selected?',
        answer: 'We carefully vet all farming projects based on farmer experience, land quality, market demand, and risk assessment. Our agricultural experts evaluate each project before making it available to investors.'
      }
    ],
    payments: [
      {
        id: 'payout-methods',
        question: 'How are payouts made?',
        answer: 'Payouts are made through your registered payment method, including mobile money, bank transfers, or card refunds. You can update your payment preferences in your account settings.'
      },
      {
        id: 'payout-timeline',
        question: 'When will I receive my payouts?',
        answer: 'Payouts are processed after harvest and sales are completed, typically within 2-4 weeks after the harvest period. You\'ll receive notifications when payouts are ready.'
      },
      {
        id: 'payment-security',
        question: 'Is my payment information secure?',
        answer: 'Yes, we use bank-level encryption and security measures to protect your payment information. We never store your full card details and use secure payment processors for all transactions.'
      }
    ],
    withdrawals: [
      {
        id: 'withdrawal-process',
        question: 'How do I withdraw my funds?',
        answer: 'You can request withdrawals through your account dashboard. Select the amount you wish to withdraw, choose your preferred payment method, and confirm the transaction with your PIN.'
      },
      {
        id: 'withdrawal-fees',
        question: 'Are there any withdrawal fees?',
        answer: 'Withdrawal fees vary by payment method. Mobile money withdrawals typically have lower fees, while bank transfers may have higher processing fees. All fees are clearly displayed before confirmation.'
      },
      {
        id: 'withdrawal-limits',
        question: 'Are there withdrawal limits?',
        answer: 'Yes, there are daily and monthly withdrawal limits based on your account verification level. These limits are designed to protect your account and comply with regulatory requirements.'
      }
    ],
    account: [
      {
        id: 'account-verification',
        question: 'How do I verify my account?',
        answer: 'Complete the KYC process by providing a valid ID document, proof of address, and personal information. Verification typically takes 1-3 business days and is required for higher investment limits.'
      },
      {
        id: 'password-reset',
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email. You can also change your password in your account settings.'
      },
      {
        id: 'account-security',
        question: 'How can I secure my account?',
        answer: 'Enable two-factor authentication, use a strong password, never share your login credentials, and log out from shared devices. We also recommend setting up transaction PINs for additional security.'
      }
    ]
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredFAQs = faqData[activeCategory].filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Get Support</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Thursday, 18 September 2025 • 05:53 PM GMT
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - FAQ */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Frequently Asked Questions (FAQ)
                  </h2>

                  {/* Search Bar */}
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search FAQs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category Tabs */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={activeCategory === category.id ? 'default' : 'outline'}
                        onClick={() => setActiveCategory(category.id)}
                        className={`px-4 py-2 ${
                          activeCategory === category.id
                            ? 'bg-green-600 text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {category.label}
                      </Button>
                    ))}
                  </div>

                  {/* FAQ Items */}
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredFAQs.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                          className="border border-gray-200 rounded-lg"
                        >
                          <button
                            onClick={() => toggleExpanded(item.id)}
                            className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-gray-900">
                              {item.question}
                            </span>
                            {expandedItems.includes(item.id) ? (
                              <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                          </button>
                          <AnimatePresence>
                            {expandedItems.includes(item.id) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 text-gray-600 leading-relaxed">
                                  {item.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Contact Information */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Contact Us!
                  </h2>

                  <div className="space-y-6">
                    {/* Email Support */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">info@agripath.co</p>
                          <p className="text-sm text-gray-600">support@agripath.co</p>
                        </div>
                      </div>
                    </div>

                    {/* Call Us */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Call Us</h3>
                        <p className="text-sm text-gray-600">+233 50 676 6433</p>
                      </div>
                    </div>

                    {/* Office Address */}
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Office Address</h3>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">AgriPath HQ, Accra, Ghana</p>
                          <p className="text-sm text-gray-600">Farm, Akuse Ghana</p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Support Button */}
                    {/* <div className="pt-4">
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat with Support
                      </Button>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SupportPage;