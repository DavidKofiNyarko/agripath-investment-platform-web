"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Bell,
  FileText,
  Shield,
  RefreshCw,
  Scale,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const LegalContent = () => {
  const [activeTab, setActiveTab] = useState("terms");
  const searchParams = useSearchParams();

  // Handle URL parameters to set active tab
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["terms", "privacy", "refund", "service"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const legalTabs = [
    { id: "terms", label: "Investment Terms & Conditions", icon: FileText },
    { id: "privacy", label: "Privacy Policy", icon: Shield },
    { id: "refund", label: "Refund Policy", icon: RefreshCw },
    { id: "service", label: "Terms of Service", icon: Scale },
  ];

  const investmentTerms = {
    title: "Investment Terms & Conditions",
    content: `
      <div class="space-y-8">
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            These Investment Terms & Conditions govern your investments in AgriPath agricultural projects. By proceeding with any investment, you acknowledge that you have read, understood, and agree to be bound by these terms.
          </p>
          <p class="text-gray-700 leading-relaxed">
            Please read this policy carefully. By using our services, you consent to the collection, use, and disclosure of your information as described in this policy.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Investment Acknowledgement</h2>
          <p class="text-gray-700 leading-relaxed mb-3">You acknowledge that:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Agricultural investments carry inherent risks including weather, pests, and market fluctuations</li>
            <li>• You have reviewed all project documentation and understand the investment structure</li>
            <li>• Your investment is tied to farming cycles and market conditions</li>
            <li>• Returns are not guaranteed and depend on successful harvest and sales</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Investment Structure & Duration</h2>
          <p class="text-gray-700 leading-relaxed mb-3">Investments are structured as:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Per-unit, per-crop, or per-project investments</li>
            <li>• Linked to specific crop cycles and growing seasons</li>
            <li>• Payouts occur only after harvest and sales completion</li>
            <li>• No withdrawals permitted before cycle completion</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Returns & Payouts</h2>
          <p class="text-gray-700 leading-relaxed mb-3">Returns are calculated based on:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Actual farm yield and market conditions at harvest time</li>
            <li>• Revenue-sharing model after deducting operational costs</li>
            <li>• Payouts processed after harvest sales, subject to processing time</li>
            <li>• No guaranteed minimum returns</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Risk Disclaimer</h2>
          <p class="text-gray-700 leading-relaxed mb-3">Agricultural investments involve significant risks including:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Weather conditions and natural disasters</li>
            <li>• Pest outbreaks and crop diseases</li>
            <li>• Market price fluctuations</li>
            <li>• Operational challenges and yield variations</li>
          </ul>
          <p class="text-gray-700 leading-relaxed mt-4">
            While AgriPath implements risk mitigation strategies, we cannot guarantee fixed returns or protect against all risks.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Refund Policy</h2>
          <p class="text-gray-700 leading-relaxed mb-3">Refund conditions:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Investments are non-refundable once farming cycle begins</li>
            <li>• Refunds only processed if AgriPath cancels project before planting</li>
            <li>• Duplicate transactions may be refunded within 7 days</li>
            <li>• Processing fees may apply to approved refunds</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Investor Responsibilities</h2>
          <p class="text-gray-700 leading-relaxed mb-3">You agree to:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Provide accurate personal and financial information</li>
            <li>• Update information promptly when changes occur</li>
            <li>• Comply with all applicable laws and regulations</li>
            <li>• Not engage in fraudulent or illegal activities</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Data Protection & Privacy</h2>
          <p class="text-gray-700 leading-relaxed mb-3">We collect and process personal data for:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Investment processing and account management</li>
            <li>• Communication about your investments</li>
            <li>• Compliance with regulatory requirements</li>
            <li>• Platform improvement and service delivery</li>
          </ul>
          <p class="text-gray-700 leading-relaxed mt-4">
            Your data is protected according to our Privacy Policy and applicable data protection laws.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Termination & Amendments</h2>
          <p class="text-gray-700 leading-relaxed mb-3">AgriPath reserves the right to:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Modify these terms with 30 days' notice to investors</li>
            <li>• Terminate participation for fraud, misrepresentation, or terms violation</li>
            <li>• Suspend accounts pending investigation of suspicious activity</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
          <p class="text-gray-700 leading-relaxed mb-3">Disputes will be resolved through:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Good faith discussion and negotiation</li>
            <li>• Mediation with mutually agreed mediator</li>
            <li>• Binding arbitration under Ghana's Arbitration Act, 2010</li>
            <li>• Arbitration conducted in English in Accra, Ghana</li>
          </ul>
        </div>
      </div>
    `,
  };

  const privacyPolicy = {
    title: "Privacy Policy",
    content: `
      <div class="space-y-8">
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            AgriPath is committed to protecting your personal data in accordance with Ghana's Data Protection Laws, 2012, Act 843. By using our services, you consent to the collection, use, and disclosure of your information as described in this policy.
          </p>
          <p class="text-gray-700 leading-relaxed">
            Please read this policy carefully. By using our services, you consent to the collection, use, and disclosure of your information as described in this policy.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Information We Collect</h2>
          <p class="text-gray-700 leading-relaxed mb-4">
            We collect several types of information from and about users of our platform, including:
          </p>
          
          <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-3">Personal Data</h3>
            <p class="text-gray-700 leading-relaxed mb-3">
              Personal data refers to any information that identifies you as an individual. We may collect:
            </p>
            <ul class="space-y-2 text-gray-700 leading-relaxed">
              <li>• Contact information (name, email address, phone number)</li>
              <li>• Account credentials (username and password)</li>
              <li>• Financial information (bank account/card details, payment information)</li>
              <li>• Identification documents (passport, ID card, tax identification number)</li>
              <li>• Investment preferences and history</li>
              <li>• Professional information (employment status, job title, company)</li>
            </ul>
          </div>

          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-3">Non-Personal Data</h3>
            <ul class="space-y-2 text-gray-700 leading-relaxed">
              <li>• Usage data and platform interactions</li>
              <li>• Device information (browser type, operating system)</li>
              <li>• IP address and location data</li>
              <li>• Cookies and similar tracking technologies</li>
              <li>• Aggregated or anonymized data</li>
            </ul>
          </div>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Provide and maintain our services</li>
            <li>• Process investment transactions</li>
            <li>• Verify identity and prevent fraud</li>
            <li>• Comply with legal and regulatory requirements</li>
            <li>• Communicate about your account and investments</li>
            <li>• Send marketing communications (with your consent)</li>
            <li>• Improve and personalize the platform</li>
            <li>• Analyze usage patterns and trends</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Data Security</h2>
          <p class="text-gray-700 leading-relaxed mb-3">We implement appropriate technical and organizational measures to protect your data:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Encryption of sensitive information</li>
            <li>• Secure network architecture and firewalls</li>
            <li>• Access controls and authentication procedures</li>
            <li>• Regular security assessments and audits</li>
            <li>• Employee training on data protection</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Your Data Protection Rights</h2>
          <p class="text-gray-700 leading-relaxed mb-3">You have the right to:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Access your personal data</li>
            <li>• Rectify inaccurate data</li>
            <li>• Request erasure of your data</li>
            <li>• Restrict processing of your data</li>
            <li>• Data portability</li>
            <li>• Object to processing</li>
            <li>• Withdraw consent</li>
          </ul>
        </div>
      </div>
    `,
  };

  const refundPolicy = {
    title: "Refund Policy",
    content: `
      <div class="space-y-8">
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p class="text-gray-700 leading-relaxed">
            This Refund Policy outlines the terms and conditions regarding refunds for investments made through the AgriPath platform. We are committed to fair and transparent refund practices while ensuring the sustainability of agricultural projects and investments.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Investment Nature and Risks</h2>
          <p class="text-gray-700 leading-relaxed mb-3">Agricultural investments are financial commitments that:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Support ongoing agricultural operations and development</li>
            <li>• Are subject to natural, market, and operational risks</li>
            <li>• May have long-term maturity periods depending on the project</li>
            <li>• Are not guaranteed to provide returns within specific timeframes</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Cooling-Off Period</h2>
          <p class="text-gray-700 leading-relaxed mb-3">You have a 48-hour cooling-off period to cancel your investment without penalties:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Log into your AgriPath account</li>
            <li>• Navigate to the 'My Investments' section</li>
            <li>• Select the investment you wish to cancel</li>
            <li>• Click on the 'Cancel Investment' option</li>
            <li>• Follow the prompts to complete the cancellation process</li>
          </ul>
          <p class="text-gray-700 leading-relaxed mt-4">Refunds are processed within 5-7 business days.</p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Refunds After the Cooling-Off Period</h2>
          <p class="text-gray-700 leading-relaxed mb-3">After the cooling-off period, investments are generally considered final. However, we may consider refunds in exceptional circumstances based on:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• The nature and stage of the agricultural project</li>
            <li>• Whether funds have already been deployed to the project</li>
            <li>• The specific circumstances of the refund request</li>
            <li>• The impact on other investors and project stakeholders</li>
            <li>• Any applicable regulatory requirements</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Project Cancellation or Significant Changes</h2>
          <p class="text-gray-700 leading-relaxed mb-3">If a project is canceled or undergoes significant changes, we will:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Notify all affected investors promptly</li>
            <li>• Provide detailed information about the cancellation or changes</li>
            <li>• Offer options including:
              <ul class="ml-6 mt-2 space-y-1">
                <li>• Full or partial refund of the investment amount</li>
                <li>• Reallocation to another suitable project</li>
                <li>• Continuation with modified project parameters</li>
              </ul>
            </li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Non-Refundable Items</h2>
          <p class="text-gray-700 leading-relaxed mb-3">The following items are generally non-refundable:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Platform fees and transaction fees</li>
            <li>• Third-party payment processing fees</li>
            <li>• Returns or profits already distributed</li>
            <li>• Investments where funds have been deployed to projects</li>
            <li>• Investments with explicitly non-refundable terms</li>
          </ul>
        </div>
      </div>
    `,
  };

  const termsOfService = {
    title: "Terms of Service",
    content: `
      <div class="space-y-8">
        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Introduction</h2>
          <p class="text-gray-700 leading-relaxed">
            Welcome to AgriPath. By accessing or using our platform, you agree to comply with and be bound by these Terms of Service. AgriPath connects investors with agricultural investment opportunities.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Definitions</h2>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• <strong>AgriPath, we, us, our:</strong> Refers to AgriPath and its affiliates</li>
            <li>• <strong>User, you, your:</strong> Any individual or entity using the Services</li>
            <li>• <strong>Platform:</strong> The AgriPath website, mobile and web applications, and related services</li>
            <li>• <strong>Investment Opportunity:</strong> Agricultural projects available for investment</li>
            <li>• <strong>Content:</strong> All information, text, images, data, links, software, or other materials accessible through the Platform</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Account Registration</h2>
          <p class="text-gray-700 leading-relaxed mb-3">To use our services, you must:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Provide accurate and complete information</li>
            <li>• Maintain and update your information</li>
            <li>• Keep your credentials confidential</li>
            <li>• Be responsible for all account activities</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">User Eligibility</h2>
          <p class="text-gray-700 leading-relaxed mb-3">You must be:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• At least 18 years old</li>
            <li>• Legally capable of entering into contracts</li>
            <li>• Not prohibited by law from using our services</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Platform Services</h2>
          <p class="text-gray-700 leading-relaxed mb-3">Our services include:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Browsing available investment opportunities</li>
            <li>• Making investments in agricultural projects</li>
            <li>• Tracking investment performance</li>
            <li>• Communicating with our team</li>
            <li>• Accessing educational resources</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Investment Terms</h2>
          <p class="text-gray-700 leading-relaxed mb-3">Important investment considerations:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• All investments carry risk and may result in loss</li>
            <li>• Past performance does not guarantee future results</li>
            <li>• AgriPath does not guarantee investment returns</li>
            <li>• You are responsible for evaluating opportunities</li>
            <li>• You must comply with all applicable rules and regulations</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">User Conduct</h2>
          <p class="text-gray-700 leading-relaxed mb-3">You agree not to:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Violate any applicable laws or regulations</li>
            <li>• Infringe on intellectual property rights</li>
            <li>• Interfere with platform operations</li>
            <li>• Post harmful, offensive, or inappropriate content</li>
            <li>• Engage in fraudulent or illegal activities</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
          <p class="text-gray-700 leading-relaxed">
            All content on the Platform is the property of AgriPath or its licensors and is protected by copyright and trademark laws. You may use the content for personal, non-commercial purposes only.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Disclaimer of Warranties</h2>
          <p class="text-gray-700 leading-relaxed">
            The Platform and services are provided "AS IS" and "AS AVAILABLE." We disclaim all warranties, including merchantability and fitness for a particular purpose.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
          <p class="text-gray-700 leading-relaxed">
            AgriPath's liability is limited to the amount you paid in the preceding twelve months. We are not liable for indirect, incidental, special, consequential, or punitive damages.
          </p>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
          <p class="text-gray-700 leading-relaxed mb-3">Disputes will be resolved through:</p>
          <ul class="space-y-2 text-gray-700 leading-relaxed">
            <li>• Informal resolution and negotiation</li>
            <li>• Mediation with a mutually agreed mediator</li>
            <li>• Binding arbitration under Ghana's Arbitration Act, 2010</li>
          </ul>
        </div>

        <div>
          <h2 class="text-xl font-bold text-gray-900 mb-4">Governing Law</h2>
          <p class="text-gray-700 leading-relaxed">
            These terms are governed by the laws of Ghana.
          </p>
        </div>
      </div>
    `,
  };

  const getCurrentContent = () => {
    switch (activeTab) {
      case "terms":
        return investmentTerms;
      case "privacy":
        return privacyPolicy;
      case "refund":
        return refundPolicy;
      case "service":
        return termsOfService;
      default:
        return investmentTerms;
    }
  };

  const currentContent = getCurrentContent();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <Link
              href="/signin"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
              Back
            </Link>
          </div>
          <div className="text-center flex-1 px-2">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">
              Legal Documents
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Terms, Privacy Policy, and Policies
            </p>
          </div>
          <div className="w-16 sm:w-24 flex-shrink-0"></div>{" "}
          {/* Spacer for centering */}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {legalTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "outline"}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 ${
                    activeTab === tab.id
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "text-gray-700 hover:bg-gray-50 border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 lg:p-8">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-8">
                {currentContent.title}
              </h1>

              <div
                className="text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: currentContent.content }}
              />

              {/* Contact Support - Hidden for now */}
              {/* <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {activeTab === "terms" &&
                      "Still have questions about our Investment Terms & Conditions?"}
                    {activeTab === "privacy" &&
                      "Not sure about something in our Privacy Policy?"}
                    {activeTab === "refund" &&
                      "Need clarity on our Refund Policy?"}
                    {activeTab === "service" &&
                      "Confused about our Terms of Service?"}
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2">
                    Contact Support
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    — Our team is here to guide you.
                  </p>
                </div>
              </div> */}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LegalPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading legal documents...</p>
          </div>
        </div>
      }
    >
      <LegalContent />
    </Suspense>
  );
};

export default LegalPage;
