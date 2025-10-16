'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { 
  Bell, 
  FileText,
  Shield,
  RefreshCw,
  Scale,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const LegalContent = () => {
  const [activeTab, setActiveTab] = useState('terms');
  const searchParams = useSearchParams();

  // Handle URL parameters to set active tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['terms', 'privacy', 'refund', 'service'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const legalTabs = [
    { id: 'terms', label: 'Investment Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy Policy', icon: Shield },
    { id: 'refund', label: 'Refund Policy', icon: RefreshCw },
    { id: 'service', label: 'Terms of Service', icon: Scale }
  ];

  const investmentTerms = {
    title: "Investment Terms & Conditions",
    content: `
      <h2>Introduction</h2>
      <p>These Investment Terms & Conditions govern your investments in AgriPath agricultural projects. By proceeding with any investment, you acknowledge that you have read, understood, and agree to be bound by these terms.</p>

      <h2>1. Investment Acknowledgement</h2>
      <p>You acknowledge that:</p>
      <ul>
        <li>Agricultural investments carry inherent risks including weather, pests, and market fluctuations</li>
        <li>You have reviewed all project documentation and understand the investment structure</li>
        <li>Your investment is tied to farming cycles and market conditions</li>
        <li>Returns are not guaranteed and depend on successful harvest and sales</li>
      </ul>

      <h2>2. Investment Structure & Duration</h2>
      <p>Investments are structured as:</p>
      <ul>
        <li>Per-unit, per-crop, or per-project investments</li>
        <li>Linked to specific crop cycles and growing seasons</li>
        <li>Payouts occur only after harvest and sales completion</li>
        <li>No withdrawals permitted before cycle completion</li>
      </ul>

      <h2>3. Returns & Payouts</h2>
      <p>Returns are calculated based on:</p>
      <ul>
        <li>Actual farm yield and market conditions at harvest time</li>
        <li>Revenue-sharing model after deducting operational costs</li>
        <li>Payouts processed after harvest sales, subject to processing time</li>
        <li>No guaranteed minimum returns</li>
      </ul>

      <h2>4. Risk Disclaimer</h2>
      <p>Agricultural investments involve significant risks including:</p>
      <ul>
        <li>Weather conditions and natural disasters</li>
        <li>Pest outbreaks and crop diseases</li>
        <li>Market price fluctuations</li>
        <li>Operational challenges and yield variations</li>
      </ul>
      <p>While AgriPath implements risk mitigation strategies, we cannot guarantee fixed returns or protect against all risks.</p>

      <h2>5. Refund Policy</h2>
      <p>Refund conditions:</p>
      <ul>
        <li>Investments are non-refundable once farming cycle begins</li>
        <li>Refunds only processed if AgriPath cancels project before planting</li>
        <li>Duplicate transactions may be refunded within 7 days</li>
        <li>Processing fees may apply to approved refunds</li>
      </ul>

      <h2>6. Investor Responsibilities</h2>
      <p>You agree to:</p>
      <ul>
        <li>Provide accurate personal and financial information</li>
        <li>Update information promptly when changes occur</li>
        <li>Comply with all applicable laws and regulations</li>
        <li>Not engage in fraudulent or illegal activities</li>
      </ul>

      <h2>7. Data Protection & Privacy</h2>
      <p>We collect and process personal data for:</p>
      <ul>
        <li>Investment processing and account management</li>
        <li>Communication about your investments</li>
        <li>Compliance with regulatory requirements</li>
        <li>Platform improvement and service delivery</li>
      </ul>
      <p>Your data is protected according to our Privacy Policy and applicable data protection laws.</p>

      <h2>8. Termination & Amendments</h2>
      <p>AgriPath reserves the right to:</p>
      <ul>
        <li>Modify these terms with 30 days' notice to investors</li>
        <li>Terminate participation for fraud, misrepresentation, or terms violation</li>
        <li>Suspend accounts pending investigation of suspicious activity</li>
      </ul>

      <h2>9. Dispute Resolution</h2>
      <p>Disputes will be resolved through:</p>
      <ul>
        <li>Good faith discussion and negotiation</li>
        <li>Mediation with mutually agreed mediator</li>
        <li>Binding arbitration under Ghana's Arbitration Act, 2010</li>
        <li>Arbitration conducted in English in Accra, Ghana</li>
      </ul>
    `
  };

  const privacyPolicy = {
    title: "Privacy Policy",
    content: `
      <h2>Introduction</h2>
      <p>AgriPath is committed to protecting your personal data in accordance with Ghana's Data Protection Laws, 2012, Act 843. By using our services, you consent to the collection, use, and disclosure of your information as described in this policy.</p>

      <h2>Information We Collect</h2>
      <h3>Personal Data</h3>
      <ul>
        <li>Contact information (name, email, phone number)</li>
        <li>Account credentials (username, password)</li>
        <li>Financial information (bank account details, payment information)</li>
        <li>Identification documents (passport, ID card, tax ID)</li>
        <li>Investment preferences and history</li>
        <li>Professional information (employment status, job title, company)</li>
      </ul>

      <h3>Non-Personal Data</h3>
      <ul>
        <li>Usage data and platform interactions</li>
        <li>Device information (browser type, operating system)</li>
        <li>IP address and location data</li>
        <li>Cookies and similar tracking technologies</li>
        <li>Aggregated or anonymized data</li>
      </ul>

      <h2>How We Use Your Information</h2>
      <ul>
        <li>Provide and maintain our services</li>
        <li>Process investment transactions</li>
        <li>Verify identity and prevent fraud</li>
        <li>Comply with legal and regulatory requirements</li>
        <li>Communicate about your account and investments</li>
        <li>Send marketing communications (with your consent)</li>
        <li>Improve and personalize the platform</li>
        <li>Analyze usage patterns and trends</li>
      </ul>

      <h2>Data Security</h2>
      <p>We implement appropriate technical and organizational measures to protect your data:</p>
      <ul>
        <li>Encryption of sensitive information</li>
        <li>Secure network architecture and firewalls</li>
        <li>Access controls and authentication procedures</li>
        <li>Regular security assessments and audits</li>
        <li>Employee training on data protection</li>
      </ul>

      <h2>Your Data Protection Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Rectify inaccurate data</li>
        <li>Request erasure of your data</li>
        <li>Restrict processing of your data</li>
        <li>Data portability</li>
        <li>Object to processing</li>
        <li>Withdraw consent</li>
      </ul>
    `
  };

  const refundPolicy = {
    title: "Refund Policy",
    content: `
      <h2>Introduction</h2>
      <p>This Refund Policy outlines the terms and conditions regarding refunds for investments made through the AgriPath platform. We are committed to fair and transparent refund practices while ensuring the sustainability of agricultural projects and investments.</p>

      <h2>Investment Nature and Risks</h2>
      <p>Agricultural investments are financial commitments that:</p>
      <ul>
        <li>Support ongoing agricultural operations and development</li>
        <li>Are subject to natural, market, and operational risks</li>
        <li>May have long-term maturity periods depending on the project</li>
        <li>Are not guaranteed to provide returns within specific timeframes</li>
      </ul>

      <h2>Cooling-Off Period</h2>
      <p>You have a 48-hour cooling-off period to cancel your investment without penalties:</p>
      <ul>
        <li>Log into your AgriPath account</li>
        <li>Navigate to the 'My Investments' section</li>
        <li>Select the investment you wish to cancel</li>
        <li>Click on the 'Cancel Investment' option</li>
        <li>Follow the prompts to complete the cancellation process</li>
      </ul>
      <p>Refunds are processed within 5-7 business days.</p>

      <h2>Refunds After the Cooling-Off Period</h2>
      <p>After the cooling-off period, investments are generally considered final. However, we may consider refunds in exceptional circumstances based on:</p>
      <ul>
        <li>The nature and stage of the agricultural project</li>
        <li>Whether funds have already been deployed to the project</li>
        <li>The specific circumstances of the refund request</li>
        <li>The impact on other investors and project stakeholders</li>
        <li>Any applicable regulatory requirements</li>
      </ul>

      <h2>Project Cancellation or Significant Changes</h2>
      <p>If a project is canceled or undergoes significant changes, we will:</p>
      <ul>
        <li>Notify all affected investors promptly</li>
        <li>Provide detailed information about the cancellation or changes</li>
        <li>Offer options including:
          <ul>
            <li>Full or partial refund of the investment amount</li>
            <li>Reallocation to another suitable project</li>
            <li>Continuation with modified project parameters</li>
          </ul>
        </li>
      </ul>

      <h2>Non-Refundable Items</h2>
      <p>The following items are generally non-refundable:</p>
      <ul>
        <li>Platform fees and transaction fees</li>
        <li>Third-party payment processing fees</li>
        <li>Returns or profits already distributed</li>
        <li>Investments where funds have been deployed to projects</li>
        <li>Investments with explicitly non-refundable terms</li>
      </ul>
    `
  };

  const termsOfService = {
    title: "Terms of Service",
    content: `
      <h2>Introduction</h2>
      <p>Welcome to AgriPath. By accessing or using our platform, you agree to comply with and be bound by these Terms of Service. AgriPath connects investors with agricultural investment opportunities.</p>

      <h2>Definitions</h2>
      <ul>
        <li><strong>AgriPath, we, us, our:</strong> Refers to AgriPath and its affiliates</li>
        <li><strong>User, you, your:</strong> Any individual or entity using the Services</li>
        <li><strong>Platform:</strong> The AgriPath website, mobile and web applications, and related services</li>
        <li><strong>Investment Opportunity:</strong> Agricultural projects available for investment</li>
        <li><strong>Content:</strong> All information, text, images, data, links, software, or other materials accessible through the Platform</li>
      </ul>

      <h2>Account Registration</h2>
      <p>To use our services, you must:</p>
      <ul>
        <li>Provide accurate and complete information</li>
        <li>Maintain and update your information</li>
        <li>Keep your credentials confidential</li>
        <li>Be responsible for all account activities</li>
      </ul>

      <h2>User Eligibility</h2>
      <p>You must be:</p>
      <ul>
        <li>At least 18 years old</li>
        <li>Legally capable of entering into contracts</li>
        <li>Not prohibited by law from using our services</li>
      </ul>

      <h2>Platform Services</h2>
      <p>Our services include:</p>
      <ul>
        <li>Browsing available investment opportunities</li>
        <li>Making investments in agricultural projects</li>
        <li>Tracking investment performance</li>
        <li>Communicating with our team</li>
        <li>Accessing educational resources</li>
      </ul>

      <h2>Investment Terms</h2>
      <p>Important investment considerations:</p>
      <ul>
        <li>All investments carry risk and may result in loss</li>
        <li>Past performance does not guarantee future results</li>
        <li>AgriPath does not guarantee investment returns</li>
        <li>You are responsible for evaluating opportunities</li>
        <li>You must comply with all applicable rules and regulations</li>
      </ul>

      <h2>User Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Violate any applicable laws or regulations</li>
        <li>Infringe on intellectual property rights</li>
        <li>Interfere with platform operations</li>
        <li>Post harmful, offensive, or inappropriate content</li>
        <li>Engage in fraudulent or illegal activities</li>
      </ul>

      <h2>Intellectual Property</h2>
      <p>All content on the Platform is the property of AgriPath or its licensors and is protected by copyright and trademark laws. You may use the content for personal, non-commercial purposes only.</p>

      <h2>Disclaimer of Warranties</h2>
      <p>The Platform and services are provided "AS IS" and "AS AVAILABLE." We disclaim all warranties, including merchantability and fitness for a particular purpose.</p>

      <h2>Limitation of Liability</h2>
      <p>AgriPath's liability is limited to the amount you paid in the preceding twelve months. We are not liable for indirect, incidental, special, consequential, or punitive damages.</p>

      <h2>Dispute Resolution</h2>
      <p>Disputes will be resolved through:</p>
      <ul>
        <li>Informal resolution and negotiation</li>
        <li>Mediation with a mutually agreed mediator</li>
        <li>Binding arbitration under Ghana's Arbitration Act, 2010</li>
      </ul>

      <h2>Governing Law</h2>
      <p>These terms are governed by the laws of Ghana.</p>
    `
  };

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'terms':
        return investmentTerms;
      case 'privacy':
        return privacyPolicy;
      case 'refund':
        return refundPolicy;
      case 'service':
        return termsOfService;
      default:
        return investmentTerms;
    }
  };

  const currentContent = getCurrentContent();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-4">
            <Link 
              href="/signin" 
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Legal Documents</h1>
            <p className="text-sm text-gray-600">Terms, Privacy Policy, and Policies</p>
          </div>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {legalTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 ${
                    activeTab === tab.id 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Card className="shadow-sm">
          <CardContent className="p-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-8">
                {currentContent.title}
              </h1>
              
              <div 
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentContent.content }}
              />

              {/* Contact Support */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {activeTab === 'terms' && "Still have questions about our Investment Terms & Conditions?"}
                    {activeTab === 'privacy' && "Not sure about something in our Privacy Policy?"}
                    {activeTab === 'refund' && "Need clarity on our Refund Policy?"}
                    {activeTab === 'service' && "Confused about our Terms of Service?"}
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    Contact Support
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    — Our team is here to guide you.
                  </p>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const LegalPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading legal documents...</p>
        </div>
      </div>
    }>
      <LegalContent />
    </Suspense>
  );
};

export default LegalPage;