"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { useUser } from "@/contexts/UserContext";
import { useProfile } from "@/contexts/ProfileContext";
import { useWallet } from "@/contexts/WalletContext";
import UserHeader from "@/components/user-header";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { useProjects } from "@/contexts/ProjectsContext";
import { useUpdates } from "@/contexts/UpdatesContext";
import { useTransactions } from "@/contexts/TransactionsContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Upload,
  Download,
  EyeSlash,
  Eye,
  CaretRight,
  Wallet,
  TrendUp,
  ChartLine,
  CheckCircle,
  Phone,
  CreditCard,
  Lock,
  Calendar,
  Info,
  X,
  Buildings,
} from "@phosphor-icons/react";
import PinValidationModal from "@/components/pin-validation-modal";
import Loading from "@/components/ui/loading";
import WalletTestComponent from "@/components/WalletTestComponent";
import ProfileSetupFlow from "@/components/profile-setup-flow";

// --- ViewMoreButton custom component ---
const ViewMoreButton = ({
  onClick,
  label = "View more",
  className = "",
  ...props
}: {
  onClick?: () => void;
  label?: string;
  className?: string;
  [x: string]: any;
}) => {
  return (
    <div
      onClick={onClick}
      className={`px-3 py-2 bg-white rounded-lg outline outline-[0.50px] outline-offset-[-0.50px] outline-AG=Green inline-flex justify-center items-center gap-2.5 cursor-pointer select-none active:opacity-90 ${className}`}
      {...props}
      tabIndex={0}
      role="button"
    >
      <div className="justify-start text-[rgba(5,20,52,0.9)] text-sm font-normal  leading-tight">
        {label}
      </div>
      <div className="w-4 h-4 relative flex items-center justify-center">
        {/* Arrow icon */}
        <CaretRight className="h-4 w-4 absolute left-0 top-0 text-black" />
      </div>
    </div>
  );
};
// -- End ViewMoreButton ---

const DashboardPage = () => {
  const router = useRouter();
  const { user, loading } = useUser();
  const { profile, loading: profileLoading, isProfileComplete } = useProfile();
  const {
    wallet,
    loading: walletLoading,
    updateBalance,
    processWalletTopup,
    processWalletWithdrawal,
  } = useWallet();
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
  const [amount, setAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [currentStep, setCurrentStep] = useState("amount");
  const [withdrawStep, setWithdrawStep] = useState("amount");
  const [isWithdrawProcessing, setIsWithdrawProcessing] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [withdrawAmountError, setWithdrawAmountError] = useState("");
  const [paymentDetails, setPaymentDetails] = useState({
    networkProvider: "",
    phoneNumber: "",
    cardholderName: "Amanda",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });
  const [withdrawDetails, setWithdrawDetails] = useState({
    bankName: "",
    bankCode: "",
    accountNumber: "",
    accountName: "",
    networkProvider: "",
    phoneNumber: "",
  });
  const [withdrawResult, setWithdrawResult] = useState<any>(null);

  // Amount validation functions
  const formatAmount = (value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, "");

    // Ensure only one decimal point
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts.slice(1).join("");
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + "." + parts[1].substring(0, 2);
    }

    return numericValue;
  };

  const formatAmountWithCommas = (value: string) => {
    if (!value || value === "") return "";

    const numericValue = formatAmount(value);
    const parts = numericValue.split(".");

    // Add commas to the integer part
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Combine with decimal part if it exists
    return parts[1] ? `${integerPart}.${parts[1]}` : integerPart;
  };

  const validateAmount = (value: string) => {
    if (!value || value.trim() === "") {
      return "Amount is required";
    }

    const numericValue = value.replace(/,/g, "");
    const amount = parseFloat(numericValue);

    if (isNaN(amount)) {
      return "Please enter a valid number";
    }

    if (amount <= 0) {
      return "Amount must be greater than 0";
    }

    if (amount < 1) {
      return "Minimum amount is GHS 1.00";
    }

    if (amount > 100000) {
      return "Maximum amount is GHS 100,000.00";
    }

    return "";
  };

  const handleAmountChange = (value: string) => {
    const formattedValue = formatAmountWithCommas(value);
    setAmount(formattedValue);

    const error = validateAmount(formattedValue);
    setAmountError(error);
  };

  const handleWithdrawAmountChange = (value: string) => {
    const formattedValue = formatAmountWithCommas(value);
    setWithdrawAmount(formattedValue);

    const error = validateAmount(formattedValue);
    setWithdrawAmountError(error);
  };

  const handleTopUp = () => {
    if (currentStep === "amount") {
      // Validate amount first
      const amountValidationError = validateAmount(amount);
      if (amountValidationError) {
        setAmountError(amountValidationError);
        return;
      }

      if (paymentMethod) {
        setIsTopUpPinModalOpen(true);
      }
    }
  };

  const handleTopUpPinSuccess = async () => {
    setIsTopUpPinModalOpen(false);
    setCurrentStep("loading");
    try {
      const topUpAmount = parseFloat(amount.replace(/,/g, ""));
      if (paymentMethod === "card") {
        const result = await processWalletTopup({
          amount: topUpAmount,
          channel: "card",
          pan: paymentDetails.cardNumber,
          exp_month: paymentDetails.expiryDate.split("/")[0],
          exp_year: paymentDetails.expiryDate.split("/")[1],
          cvv: paymentDetails.cvv,
          card_holder: paymentDetails.cardholderName,
          user_email: user?.email || "test@example.com",
          description: "Dashboard topup via card",
        });
        if (result.success) {
          setTimeout(() => {
            setCurrentStep("success");
          }, 1000);
        } else if (result.redirect_url) {
          window.open(result.redirect_url, "_blank");
          setTimeout(() => {
            setCurrentStep("success");
          }, 1000);
        } else {
          setCurrentStep("error");
        }
      } else if (paymentMethod === "mobile") {
        const result = await processWalletTopup({
          amount: topUpAmount,
          channel: "momo",
          subscriber_number: paymentDetails.phoneNumber,
          network: paymentDetails.networkProvider,
          user_email: user?.email || "test@example.com",
          description: "Dashboard topup via mobile money",
        });
        if (result.success) {
          setTimeout(() => {
            setCurrentStep("success");
          }, 1000);
        } else if (result.redirect_url) {
          window.open(result.redirect_url, "_blank");
          setTimeout(() => {
            setCurrentStep("success");
          }, 1000);
        } else {
          setCurrentStep("error");
        }
      } else {
        const success = await updateBalance(
          topUpAmount,
          "Top up via " + paymentMethod
        );
        if (success) {
          setTimeout(() => {
            setCurrentStep("success");
          }, 1000);
        } else {
          setCurrentStep("error");
        }
      }
    } catch (error) {
      setCurrentStep("error");
    }
  };

  const handleWithdraw = () => {
    if (withdrawStep === "amount") {
      // Validate withdraw amount first
      const withdrawAmountValidationError = validateAmount(withdrawAmount);
      if (withdrawAmountValidationError) {
        setWithdrawAmountError(withdrawAmountValidationError);
        return;
      }

      if (withdrawMethod) {
        setIsWithdrawPinModalOpen(true);
      }
    }
  };

  const handleWithdrawPinSuccess = async () => {
    setIsWithdrawPinModalOpen(false);
    setIsWithdrawProcessing(true);
    setWithdrawStep("loading");

    try {
      const withdrawAmountValue = parseFloat(withdrawAmount.replace(/,/g, ""));
      const result = await processWalletWithdrawal({
        amount: withdrawAmountValue,
        channel: withdrawMethod === "mobile" ? "momo" : "bank",
        ...(withdrawMethod === "mobile"
          ? {
              recipient_number: withdrawDetails.phoneNumber,
              network: withdrawDetails.networkProvider,
            }
          : {
              account_number: withdrawDetails.accountNumber,
              account_bank: withdrawDetails.bankCode,
            }),
        description: "Dashboard withdrawal",
      });

      // Simulate processing delay
      setTimeout(() => {
        setIsWithdrawProcessing(false);
        if (result.success) {
          setWithdrawResult(result);
          setWithdrawStep("success");
        } else {
          setWithdrawStep("error");
        }
      }, 2000);
    } catch (error) {
      setTimeout(() => {
        setIsWithdrawProcessing(false);
        setWithdrawStep("error");
      }, 2000);
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
    setCurrentStep("amount");
    setAmount("");
    setPaymentMethod("");
    setIsTopUpOpen(false);
  };

  const resetWithdraw = () => {
    setWithdrawStep("amount");
    setWithdrawMethod("");
    setWithdrawAmount("");
    setIsWithdrawOpen(false);
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    }
  }, [user, loading, router]);

  if (
    loading ||
    profileLoading ||
    walletLoading ||
    portfolioLoading ||
    projectsLoading ||
    updatesLoading ||
    transactionsLoading
  ) {
    return (
      <DashboardLayout>
        <Loading size="lg" className="min-h-screen" />
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      {!profile && (
        <>
          <div className="pointer-events-none fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <ProfileSetupFlow
            onCompleted={() => {
              /* context will re-render */
            }}
          />
        </>
      )}
      <div
        className={`space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-6 transition-all duration-300 ${
          isTopUpOpen || isWithdrawOpen ? "main-content-blur" : ""
        }`}
      >
        {/* Header */}
        <UserHeader />

        {/* Dashboard Title */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard
          </h2>
        </div>

        {/* Account Balance Card */}
        <Card className="flex flex-col justify-between items-end self-stretch rounded-[12px] bg-green-800/90 text-white border-0 shadow-xl p-4 sm:p-6 lg:p-8">
          <CardContent className="p-0 flex flex-col sm:flex-row justify-between items-end self-stretch gap-4 sm:gap-6">
            <div className="flex-1 w-full sm:w-auto">
              <p className="text-lg sm:text-xl lg:text-[24px] leading-tight font-normal text-[#F7F7F7] mb-3 sm:mb-4 lg:mb-6 tracking-wide">
                Account Balance
              </p>
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3">
                <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-black tracking-tight">
                  {isBalanceVisible ? (
                    <>
                      <span
                        style={{
                          color: "rgba(247, 247, 247, 0.70)",
                          textAlign: "center",
                          fontFamily: "Inter, sans-serif",
                          fontSize: "clamp(24px, 4vw, 40px)",
                          fontStyle: "normal",
                          fontWeight: 600,
                          lineHeight: "125%",
                        }}
                      >
                        GH&#8373;
                      </span>
                      <span>
                        {" "}
                        {wallet?.balance?.toLocaleString() || "0.00"}
                      </span>
                    </>
                  ) : (
                    "••••••••"
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-green-100 hover:text-white hover:bg-white/10 flex-shrink-0"
                  onClick={handleBalanceToggle}
                >
                  {isBalanceVisible ? (
                    <EyeSlash className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-green-100 text-xs font-medium">
                {isBalanceVisible ? "Balance visible" : "Balance hidden"}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end self-stretch sm:justify-between gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto">
                <div
                  className="self-stretch px-4 sm:px-5 py-1.5 bg-white rounded-[20px] border-r border-green-800 inline-flex justify-center items-center gap-1 cursor-pointer"
                  onClick={() => setIsTopUpOpen(true)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 relative overflow-hidden flex items-center justify-center">
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 absolute left-[3px] top-[2.25px] text-green-800" />
                  </div>
                  <div className="text-right justify-start text-green-800 text-sm sm:text-base font-bold leading-snug">
                    Top Up
                  </div>
                </div>
                <div
                  className="self-stretch px-4 sm:px-5 py-1.5 rounded-[20px] outline outline-offset-[-2px] outline-white inline-flex justify-center items-center gap-1 cursor-pointer"
                  onClick={() => setIsWithdrawOpen(true)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 relative overflow-hidden flex items-center justify-center">
                    <Download className="w-3 h-3 sm:w-4 sm:h-4 absolute left-[3px] top-[2.25px] text-white" />
                  </div>
                  <div className="text-right justify-start text-white text-sm sm:text-base font-bold leading-snug">
                    Withdraw
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Portfolio
            </h3>
            {/* Custom View More Button for Portfolio */}
            <ViewMoreButton
              onClick={() => router.push("/portfolio")}
              label="View more"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-0">
                <div className="self-stretch px-4 sm:px-6 pt-4 sm:pt-6 pb-2 inline-flex justify-between items-center">
                  <div className="flex-1 flex justify-start items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 relative overflow-hidden">
                      <Wallet className="w-4 h-3 sm:w-5 sm:h-4 left-[3px] top-[3px] absolute text-green-800" />
                    </div>
                    <div className="flex justify-center items-center gap-2.5">
                      <div className="justify-start text-Zinc-950 text-xs sm:text-sm font-medium">
                        Total Invested
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="justify-start text-Zinc-950 text-xl sm:text-2xl font-extrabold tracking-tight">
                    GHS {metrics?.total_invested?.toLocaleString() || "0.00"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="self-stretch px-4 sm:px-6 pt-4 sm:pt-6 pb-2 inline-flex justify-between items-center">
                  <div className="flex-1 flex justify-start items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 relative overflow-hidden">
                      <TrendUp className="w-4 h-3 sm:w-5 sm:h-4 left-[3px] top-[3px] absolute text-green-800" />
                    </div>
                    <div className="flex justify-center items-center gap-2.5">
                      <div className="justify-start text-Zinc-950 text-xs sm:text-sm font-medium">
                        Expected Returns
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="justify-start text-Zinc-950 text-xl sm:text-2xl font-extrabold tracking-tight">
                    GHS {metrics?.expected_returns?.toLocaleString() || "0.00"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="self-stretch px-4 sm:px-6 pt-4 sm:pt-6 pb-2 inline-flex justify-between items-center">
                  <div className="flex-1 flex justify-start items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 relative overflow-hidden">
                      <ChartLine className="w-4 h-3 sm:w-5 sm:h-4 left-[3px] top-[3px] absolute text-green-800" />
                    </div>
                    <div className="flex justify-center items-center gap-2.5">
                      <div className="justify-start text-Zinc-950 text-xs sm:text-sm font-medium">
                        Active Projects
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="justify-start text-Zinc-950 text-xl sm:text-2xl font-extrabold tracking-tight">
                    {metrics?.active_projects || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="self-stretch px-4 sm:px-6 pt-4 sm:pt-6 pb-2 inline-flex justify-between items-center">
                  <div className="flex-1 flex justify-start items-center gap-2">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 relative overflow-hidden">
                      <CheckCircle className="w-4 h-3 sm:w-5 sm:h-4 left-[3px] top-[3px] absolute text-green-800" />
                    </div>
                    <div className="flex justify-center items-center gap-2.5">
                      <div className="justify-start text-Zinc-950 text-xs sm:text-sm font-medium">
                        Total Units
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="justify-start text-Zinc-950 text-xl sm:text-2xl font-extrabold  tracking-tight">
                    {metrics?.total_units || 0}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Available Investment Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Available Investment
            </h3>
            <ViewMoreButton
              onClick={() => router.push("/investments")}
              label="View more"
            />
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {projects.slice(0, 5).map((project) => (
              <Card
                key={project.id}
                className="p-3 sm:p-4 bg-white rounded-2xl inline-flex justify-start items-start gap-3 w-60 sm:w-64 md:w-72 lg:w-80 flex-shrink-0"
              >
                <div className="w-full inline-flex flex-col justify-start items-start gap-3">
                  <div className="w-full h-28 sm:h-32 md:h-36 lg:h-40 relative rounded-2xl overflow-hidden">
                    <Image
                      src={
                        project.cover_image_url ||
                        `https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&h=200&fit=crop`
                      }
                      alt={project.project_name}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    <div className="px-2 py-1 sm:py-1.5 right-2 top-2 absolute bg-green-800 rounded-xl inline-flex justify-center items-center gap-1">
                      <div className="px-1 flex justify-start items-start gap-2.5">
                        <div className="text-center justify-start text-white text-xs font-semibold uppercase tracking-wide">
                          {project.status?.toUpperCase() || "AVAILABLE"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="self-stretch pt-2 sm:pt-3 flex flex-col justify-start items-start gap-3 sm:gap-4">
                    <div className="self-stretch flex flex-col justify-start items-start gap-3 sm:gap-4">
                      <div className="self-stretch flex flex-col justify-center items-start gap-1">
                        <div className="justify-start text-green-950 text-base sm:text-lg font-extrabold tracking-tight line-clamp-1">
                          {project.project_name}
                        </div>
                        <div className="self-stretch inline-flex justify-center items-center gap-1">
                          <div className="flex-1 flex justify-start items-center gap-1">
                            <div className="justify-center text-zinc-900 text-sm sm:text-base font-bold">
                              GHS {project.unit_price?.toLocaleString()}
                            </div>
                            <div className="justify-center text-green-800 text-xs font-bold leading-none tracking-tight">
                              /Per Unit
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="self-stretch inline-flex justify-between items-center">
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
                          <div className="text-center justify-center text-neutral-800 text-xs font-semibold">
                            Return (ROI)
                          </div>
                          <div className="self-stretch justify-center text-orange-500 text-sm font-bold leading-none tracking-tight">
                            {project.expected_return_rate}-
                            {project.max_expected_return_rate}%
                          </div>
                        </div>
                        <div className="flex-1 inline-flex flex-col justify-start items-start gap-1">
                          <div className="self-stretch text-right justify-center text-neutral-800 text-xs font-semibold">
                            Duration
                          </div>
                          <div className="self-stretch text-right justify-center text-orange-500 text-sm font-bold leading-none tracking-tight">
                            {project.duration_months} Months
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="justify-center text-green-800 text-sm font-semibold leading-none">
                      {(project.available_unit || 0) > 0
                        ? `${project.available_unit} Units Available`
                        : "Sold Out"}
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {projects.length === 0 && (
              <div className="w-full flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ChartLine className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Projects Available
                  </h3>
                  <p className="text-gray-600">
                    Check back later for new investment opportunities.
                  </p>
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
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                  Recent Transactions
                </h4>
                <ViewMoreButton
                  label="View all"
                  onClick={() => router.push("/transactions")}
                  className="!py-1.5 !px-2.5"
                />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 sm:space-y-4">
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 4).map((transaction) => {
                    const getTransactionIcon = (type: string) => {
                      switch (type) {
                        case "Payin":
                          return <Upload className="h-4 w-4 text-green-600" />;
                        case "Payout":
                          return <TrendUp className="h-4 w-4 text-green-600" />;
                        case "Refund":
                          return (
                            <Download className="h-4 w-4 text-orange-600" />
                          );
                        default:
                          return (
                            <ChartLine className="h-4 w-4 text-gray-600" />
                          );
                      }
                    };

                    const getTransactionColor = (type: string) => {
                      switch (type) {
                        case "Payin":
                          return "bg-green-50 border-green-200";
                        case "Payout":
                          return "bg-green-50 border-green-200";
                        case "Refund":
                          return "bg-orange-50 border-orange-200";
                        default:
                          return "bg-gray-50 border-gray-200";
                      }
                    };

                    const getAmountColor = (type: string) => {
                      switch (type) {
                        case "Payin":
                          return "text-green-600";
                        case "Payout":
                          return "text-green-600";
                        case "Refund":
                          return "text-orange-600";
                        default:
                          return "text-gray-600";
                      }
                    };

                    const formatAmount = (amount: number, type: string) => {
                      const prefix = type === "Payin" ? "+" : "-";
                      return `${prefix}GHS ${amount.toLocaleString()}`;
                    };

                    const formatDate = (dateString: string) => {
                      const date = new Date(dateString);
                      const now = new Date();
                      const diffInHours = Math.floor(
                        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
                      );

                      if (diffInHours < 1) return "Just now";
                      if (diffInHours < 24)
                        return `${diffInHours} hour${
                          diffInHours > 1 ? "s" : ""
                        } ago`;
                      const diffInDays = Math.floor(diffInHours / 24);
                      if (diffInDays < 7)
                        return `${diffInDays} day${
                          diffInDays > 1 ? "s" : ""
                        } ago`;
                      return date.toLocaleDateString();
                    };

                    return (
                      <div
                        key={transaction.id}
                        className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border ${getTransactionColor(
                          transaction.type
                        )}`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div
                            className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                              transaction.type === "Payin"
                                ? "bg-green-100"
                                : transaction.type === "Payout"
                                ? "bg-green-100"
                                : transaction.type === "Refund"
                                ? "bg-orange-100"
                                : "bg-gray-100"
                            }`}
                          >
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 capitalize truncate">
                              {transaction.type.replace("_", " ")}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {transaction.project_name ||
                                transaction.description ||
                                "Transaction"}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge
                                variant={
                                  transaction.status === "Complete"
                                    ? "default"
                                    : transaction.status === "Pending"
                                    ? "secondary"
                                    : transaction.status === "Failed"
                                    ? "destructive"
                                    : "outline"
                                }
                                className={`text-xs px-1.5 sm:px-2 py-0.5 ${
                                  transaction.status === "Complete"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : transaction.status === "Pending"
                                    ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                    : transaction.status === "Failed"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                }`}
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p
                            className={`text-xs sm:text-sm font-semibold ${getAmountColor(
                              transaction.type
                            )}`}
                          >
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
                    <ChartLine className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    No Recent Transactions
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Your transaction history will appear here
                  </p>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-xs"
                    onClick={() => router.push("/investments")}
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
                <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                  Latest Updates
                </h4>
                <Button
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
                  onClick={() => router.push("/updates")}
                >
                  View more
                  <CaretRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 sm:space-y-4">
              {updates.slice(0, 4).map((update) => (
                <div
                  key={update.id}
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Image
                    src={
                      update.image_url ||
                      `https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=60&h=60&fit=crop`
                    }
                    alt={update.title}
                    width={60}
                    height={60}
                    className="w-8 h-8 sm:w-12 sm:h-12 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-1">
                      {update.title}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {update.description || update.update_text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 sm:mt-2 flex items-center gap-1">
                      <svg
                        className="w-2 h-2 sm:w-3 sm:h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(update.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <CaretRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}

              {updates.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ChartLine className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600">
                      No updates available
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Up Account Sheet */}
      <Sheet open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-2"
        >
          <SheetTitle className="sr-only">Top Up Account</SheetTitle>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Top Up Account
              </h2>
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
                {currentStep === "amount" && (
                  <div className="space-y-8">
                    {/* Enter Amount Section */}
                    <div className="flex flex-col justify-start items-start gap-2">
                      <div className="w-full justify-start text-gray-900 text-lg font-extrabold leading-tight">
                        Enter Amount
                      </div>
                      <div className="w-full justify-start text-gray-500 text-sm font-medium leading-tight">
                        How much do you want to top up?
                      </div>
                    </div>

                    {/* Amount Input Section */}
                    <div className="w-full flex flex-col justify-start items-center gap-4">
                      <div className="w-full pb-3 border-b border-black/20 flex justify-between items-center">
                        <div className="text-center justify-start text-black text-2xl sm:text-3xl font-normal tracking-tight">
                          GHS
                        </div>
                        <div className="flex-1 text-right">
                          <Input
                            value={amount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            className={`text-right text-gray-900 text-4xl sm:text-5xl md:text-6xl font-normal leading-10 border-0 outline-none p-0 bg-transparent focus:ring-0 focus:border-0 h-auto w-full transition-colors duration-200 ${
                              amountError ? "text-red-500" : ""
                            }`}
                            placeholder="0.00"
                            type="text"
                            inputMode="decimal"
                          />
                        </div>
                      </div>
                      {amountError && (
                        <div className="text-red-500 text-sm mt-2 text-center">
                          {amountError}
                        </div>
                      )}
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                      <div className="w-full flex justify-start text-gray-900 text-lg font-extrabold leading-tight">
                        Select Payment Method
                      </div>

                      <div className="w-full px-4">
                        <RadioGroup
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <div className="w-full space-y-4">
                            {/* Mobile Money Option */}
                            <div
                              className={`w-full rounded-xl border transition-all duration-200 ${
                                paymentMethod === "mobile"
                                  ? "border-green-500 bg-green-50/30"
                                  : "border-gray-200"
                              }`}
                            >
                              {/* Header Row */}
                              <div className="flex h-[100px] sm:h-[110px] p-6 sm:p-8 items-center gap-4 sm:gap-6 w-full">
                                <RadioGroupItem
                                  value="mobile"
                                  id="mobile"
                                  className="w-6 h-6 sm:w-7 sm:h-7"
                                />
                                <Label
                                  htmlFor="mobile"
                                  className="flex-1 cursor-pointer"
                                >
                                  <span className="text-base sm:text-lg font-medium">
                                    Mobile Money
                                  </span>
                                </Label>
                                <Phone className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                              </div>

                              {/* Expanded Form Fields */}
                              {paymentMethod === "mobile" && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden border-t border-green-200"
                                >
                                  <div className="p-6 space-y-8">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700">
                                        Select Network Provider
                                      </Label>
                                      <Select
                                        onValueChange={(value) =>
                                          setPaymentDetails({
                                            ...paymentDetails,
                                            networkProvider: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger className="mt-1 border-0 outline-none focus:ring-0 focus:border-0">
                                          <SelectValue placeholder="Eg. MTN" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="MTN">
                                            MTN
                                          </SelectItem>
                                          <SelectItem value="VOD">
                                            Vodafone
                                          </SelectItem>
                                          <SelectItem value="ATL">
                                            AirtelTigo
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      {!paymentDetails.networkProvider && (
                                        <p className="text-sm text-red-600 mt-1">
                                          Please select a network provider
                                        </p>
                                      )}
                                    </div>

                                    <div>
                                      <Label
                                        htmlFor="phoneNumber"
                                        className="text-sm font-medium text-gray-700 mb-2 block"
                                      >
                                        Phone number
                                      </Label>
                                      <div className="flex rounded-lg border border-gray-300 outline-none overflow-hidden focus-within:ring-0 focus-within:border-gray-400 transition-all duration-200">
                                        <div className="flex items-center px-3 sm:px-4 py-3 sm:py-3 bg-gray-50 border-r border-gray-300 min-w-[80px] sm:min-w-[90px]">
                                          <span className="text-base sm:text-lg mr-2">
                                            🇬🇭
                                          </span>
                                          <span className="text-sm sm:text-base font-medium text-gray-700">
                                            +233
                                          </span>
                                        </div>
                                        <Input
                                          id="phoneNumber"
                                          placeholder="Eg. 55 567 8905"
                                          value={paymentDetails.phoneNumber}
                                          onChange={(e) =>
                                            setPaymentDetails({
                                              ...paymentDetails,
                                              phoneNumber: e.target.value,
                                            })
                                          }
                                          className="flex-1 border-0 outline-none rounded-none focus:ring-0 focus:border-0 py-3 sm:py-6 px-3 sm:px-4 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <Label
                                        htmlFor="saveMobile"
                                        className="text-sm text-gray-600"
                                      >
                                        Save this payment method
                                      </Label>
                                      <Switch
                                        id="saveMobile"
                                        checked={savePaymentMethod}
                                        onCheckedChange={setSavePaymentMethod}
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>

                            {/* Bank Card Option */}
                            <div
                              className={`w-full rounded-xl border transition-all duration-200 ${
                                paymentMethod === "card"
                                  ? "border-green-500 bg-green-50/30"
                                  : "border-gray-200"
                              }`}
                            >
                              {/* Header Row */}
                              <div className="flex h-[100px] sm:h-[110px] p-6 sm:p-8 items-center gap-4 sm:gap-6 w-full">
                                <RadioGroupItem
                                  value="card"
                                  id="card"
                                  className="w-6 h-6 sm:w-7 sm:h-7"
                                />
                                <Label
                                  htmlFor="card"
                                  className="flex-1 cursor-pointer"
                                >
                                  <span className="text-base sm:text-lg font-medium">
                                    Bank Card
                                  </span>
                                </Label>
                                <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                              </div>

                              {/* Expanded Form Fields */}
                              {paymentMethod === "card" && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden border-t border-green-200"
                                >
                                  <div className="p-6 space-y-8">
                                    <div>
                                      <Label className="text-sm font-medium text-gray-700">
                                        Cardholder Name
                                      </Label>
                                      <Input
                                        id="cardholderName"
                                        value={paymentDetails.cardholderName}
                                        onChange={(e) =>
                                          setPaymentDetails({
                                            ...paymentDetails,
                                            cardholderName: e.target.value,
                                          })
                                        }
                                        className="mt-1 border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-sm font-medium text-gray-700">
                                        Card number
                                      </Label>
                                      <div className="relative mt-1">
                                        <Input
                                          id="cardNumber"
                                          placeholder="0000 0000 0000 0000"
                                          value={paymentDetails.cardNumber}
                                          onChange={(e) =>
                                            setPaymentDetails({
                                              ...paymentDetails,
                                              cardNumber: e.target.value,
                                            })
                                          }
                                          className="pr-20 border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                                        />
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                                          <Lock className="h-4 w-4 text-gray-400" />
                                          <div className="w-8 h-5 bg-red-500 rounded flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                              MC
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                      <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                          Expiry Date
                                        </Label>
                                        <div className="relative mt-1">
                                          <Input
                                            id="expiryDate"
                                            placeholder="00/00"
                                            value={paymentDetails.expiryDate}
                                            onChange={(e) =>
                                              setPaymentDetails({
                                                ...paymentDetails,
                                                expiryDate: e.target.value,
                                              })
                                            }
                                            className="pr-8 text-sm sm:text-base border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                                          />
                                          <Calendar className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                        </div>
                                      </div>

                                      <div>
                                        <Label className="text-sm font-medium text-gray-700">
                                          CVC/CVV
                                        </Label>
                                        <div className="relative mt-1">
                                          <Input
                                            id="cvv"
                                            placeholder="000"
                                            value={paymentDetails.cvv}
                                            onChange={(e) =>
                                              setPaymentDetails({
                                                ...paymentDetails,
                                                cvv: e.target.value,
                                              })
                                            }
                                            className="pr-8 text-sm sm:text-base border-0 outline-none focus:ring-0 focus:border-0 transition-all duration-200"
                                          />
                                          <Info className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <Label
                                        htmlFor="saveCard"
                                        className="text-sm text-gray-600"
                                      >
                                        Save this payment method
                                      </Label>
                                      <Switch
                                        id="saveCard"
                                        checked={savePaymentMethod}
                                        onCheckedChange={setSavePaymentMethod}
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
                  </div>
                )}

                {/* Loading Step */}
                {currentStep === "loading" && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                      className="relative"
                    >
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                        <Loading size="sm" text="" />
                      </div>
                    </motion.div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Processing Top Up
                      </h3>
                      <p className="text-gray-600">
                        Please wait while we process your{" "}
                        <span className="font-semibold text-orange-600">
                          GHS {amount}
                        </span>{" "}
                        top up...
                      </p>
                    </div>
                  </div>
                )}

                {/* Success Step */}
                {currentStep === "success" && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
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
                              backgroundColor: [
                                "#ff6b6b",
                                "#4ecdc4",
                                "#45b7d1",
                                "#96ceb4",
                                "#feca57",
                              ][i % 5],
                              left: "50%",
                              top: "50%",
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
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Top Up Successful
                      </h3>
                      <p className="text-gray-600">
                        <span className="font-semibold text-orange-600">
                          GHS {amount}
                        </span>{" "}
                        has been added to your in app account. Your new balance
                        is{" "}
                        <span className="font-semibold text-orange-600">
                          GHS{" "}
                          {wallet?.balance?.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"}
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Step */}
                {currentStep === "error" && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 10,
                      }}
                      className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center"
                    >
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                        <X className="h-6 w-6 text-white" />
                      </div>
                    </motion.div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Oops!
                      </h3>
                      <p className="text-gray-600">
                        We couldn&apos;t complete your payment. Try again or use
                        a different account.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-6 border-t border-gray-200">
              {currentStep === "amount" && (
                <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 sm:space-y-0">
                  <Button
                    variant="outline"
                    className="flex h-[50px] px-8 justify-center items-center gap-1.5 flex-1 rounded-xl border-green-600 text-green-600 hover:bg-green-50 transition-all duration-200"
                    onClick={() => setIsTopUpOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex h-[50px] px-8 justify-center items-center gap-1.5 flex-1 rounded-xl bg-green-700 hover:bg-green-800 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleTopUp}
                    disabled={
                      !paymentMethod ||
                      (paymentMethod === "mobile" &&
                        !paymentDetails.networkProvider) ||
                      !!amountError
                    }
                  >
                    Top up
                  </Button>
                </div>
              )}

              {(currentStep === "success" || currentStep === "error") && (
                <Button
                  className="flex h-[50px] px-8 justify-center items-center gap-1.5 w-full rounded-xl bg-green-700 hover:bg-green-800 text-white transition-all duration-200"
                  onClick={resetTopUp}
                >
                  {currentStep === "success" ? "Done" : "Try Again"}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Withdraw Account Sheet */}
      <Sheet open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <SheetContent className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl p-2">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Withdraw Funds
              </h2>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto">
              {/* Success Screen */}
              {withdrawStep === "success" && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 10,
                    }}
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
                            backgroundColor: [
                              "#ff6b6b",
                              "#4ecdc4",
                              "#45b7d1",
                              "#96ceb4",
                              "#feca57",
                            ][i % 5],
                            left: "50%",
                            top: "50%",
                          }}
                          initial={{
                            x: 0,
                            y: 0,
                            scale: 0,
                          }}
                          animate={{
                            x: (Math.random() - 0.5) * 200,
                            y: (Math.random() - 0.5) * 200,
                            scale: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            delay: i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Withdrawal Successful!
                    </h3>
                    <p className="text-gray-600">
                      Your withdrawal request has been submitted successfully.
                      {withdrawResult?.pending &&
                        " Please check your phone for OTP verification."}
                    </p>
                    <p className="text-sm text-gray-500">
                      Transaction ID:{" "}
                      {withdrawResult?.transactionId || "Processing..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Error Screen */}
              {withdrawStep === "error" && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 10,
                    }}
                  >
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="h-10 w-10 text-red-600" />
                    </div>
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Withdrawal Failed
                    </h3>
                    <p className="text-gray-600">
                      There was an error processing your withdrawal request.
                    </p>
                    <p className="text-sm text-gray-500">
                      Please try again or contact support if the issue persists.
                    </p>
                  </div>
                </div>
              )}

              {/* Loading Screen */}
              {withdrawStep === "loading" && (
                <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 10,
                    }}
                    className="relative"
                  >
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <Loading size="sm" text="" />
                    </div>
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Processing Withdrawal
                    </h3>
                    <p className="text-gray-600">
                      Please wait while we process your{" "}
                      <span className="font-semibold text-green-600">
                        GHS {withdrawAmount}
                      </span>{" "}
                      withdrawal...
                    </p>
                  </div>
                </div>
              )}

              {/* Form Content - Only show when not in success/error state */}
              {withdrawStep === "amount" && (
                <>
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <div className="w-full flex justify-start text-gray-900 text-lg font-extrabold leading-tight">
                      Enter Amount
                    </div>
                    <div className="w-full flex justify-start text-gray-500 text-sm font-medium leading-tight">
                      How much do you want to withdraw?
                    </div>
                    <div className="w-full pb-3 border-b border-black/20 flex justify-between items-center">
                      <Input
                        type="text"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) =>
                          handleWithdrawAmountChange(e.target.value)
                        }
                        className={`text-right text-gray-900 text-4xl sm:text-5xl md:text-6xl font-normal leading-10 border-0 p-0 bg-transparent focus:ring-0 focus:border-0 h-auto w-full ${
                          withdrawAmountError ? "text-red-500" : ""
                        }`}
                      />
                      <div className="text-center justify-start text-black text-2xl sm:text-3xl font-normal tracking-tight">
                        GHS
                      </div>
                    </div>
                    {withdrawAmountError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        className="text-sm text-red-500"
                      >
                        {withdrawAmountError}
                      </motion.div>
                    )}
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-4">
                    <div className="w-full flex justify-start text-gray-900 text-lg font-extrabold leading-tight">
                      Select Withdrawal Method
                    </div>
                    <div className="w-full px-4">
                      <RadioGroup
                        value={withdrawMethod}
                        onValueChange={setWithdrawMethod}
                      >
                        <div className="w-full space-y-4">
                          {/* Bank Transfer Option */}
                          <div
                            className={`w-full rounded-xl border transition-all duration-200 ${
                              withdrawMethod === "bank"
                                ? "border-green-500 bg-green-50/30"
                                : "border-gray-200"
                            }`}
                          >
                            {/* Header Row */}
                            <div className="flex h-[100px] sm:h-[110px] p-6 sm:p-8 items-center gap-4 sm:gap-6 w-full">
                              <RadioGroupItem
                                value="bank"
                                id="withdraw-bank"
                                className="w-6 h-6 sm:w-7 sm:h-7"
                              />
                              <Label
                                htmlFor="withdraw-bank"
                                className="flex-1 cursor-pointer"
                              >
                                <span className="text-base sm:text-lg font-medium">
                                  Bank Transfer
                                </span>
                              </Label>
                              <Buildings className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                            </div>
                            {/* Bank Transfer Details */}
                            {withdrawMethod === "bank" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-green-200 overflow-hidden "
                              >
                                <div className="p-6 space-y-8">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Select Bank
                                    </Label>
                                    <Select
                                      value={withdrawDetails.bankCode}
                                      onValueChange={(value) =>
                                        setWithdrawDetails({
                                          ...withdrawDetails,
                                          bankCode: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="mt-1 border-0 outline-none focus:ring-0 focus:border-0">
                                        <SelectValue placeholder="Select bank" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="040100">
                                          GCB Bank Limited
                                        </SelectItem>
                                        <SelectItem value="020100">
                                          Standard Chartered Bank Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="030100">
                                          Absa Bank Ghana Ltd
                                        </SelectItem>
                                        <SelectItem value="130100">
                                          Ecobank Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="240100">
                                          Fidelity Bank Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="120100">
                                          Zenith Bank Ghana
                                        </SelectItem>
                                        <SelectItem value="280100">
                                          Access Bank
                                        </SelectItem>
                                        <SelectItem value="140100">
                                          CAL Bank Limited
                                        </SelectItem>
                                        <SelectItem value="330100">
                                          First National Bank Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="190100">
                                          Stanbic Bank Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="060100">
                                          United Bank for Africa Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="110100">
                                          Republic Bank (GH) Limited
                                        </SelectItem>
                                        <SelectItem value="090100">
                                          Société Générale Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="180100">
                                          Prudential Bank Limited
                                        </SelectItem>
                                        <SelectItem value="170100">
                                          First Atlantic Bank Limited
                                        </SelectItem>
                                        <SelectItem value="080100">
                                          ADB Bank Limited
                                        </SelectItem>
                                        <SelectItem value="050100">
                                          National Investment Bank Limited
                                        </SelectItem>
                                        <SelectItem value="100100">
                                          Universal Merchant Bank Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="210100">
                                          Bank of Africa Ghana
                                        </SelectItem>
                                        <SelectItem value="200100">
                                          FBNBank Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="360100">
                                          OmniBSCI Bank
                                        </SelectItem>
                                        <SelectItem value="340100">
                                          Consolidated Bank Ghana Limited
                                        </SelectItem>
                                        <SelectItem value="230100">
                                          Guaranty Trust Bank (Ghana) Limited
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Account Number
                                    </Label>
                                    <Input
                                      placeholder="Enter account number"
                                      value={withdrawDetails.accountNumber}
                                      onChange={(e) =>
                                        setWithdrawDetails({
                                          ...withdrawDetails,
                                          accountNumber: e.target.value,
                                        })
                                      }
                                      className="border-0 outline-none focus:ring-0 focus:border-0"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Account Name
                                    </Label>
                                    <Input
                                      placeholder="Enter account holder name"
                                      value={withdrawDetails.accountName}
                                      onChange={(e) =>
                                        setWithdrawDetails({
                                          ...withdrawDetails,
                                          accountName: e.target.value,
                                        })
                                      }
                                      className="border-0 outline-none focus:ring-0 focus:border-0"
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>

                          {/* Mobile Money Option */}
                          <div
                            className={`w-full rounded-xl border transition-all duration-200 ${
                              withdrawMethod === "mobile"
                                ? "border-green-500 bg-green-50/30"
                                : "border-gray-200"
                            }`}
                          >
                            {/* Header Row */}
                            <div className="flex h-[100px] sm:h-[110px] p-6 sm:p-8 items-center gap-4 sm:gap-6">
                              <RadioGroupItem
                                value="mobile"
                                id="withdraw-mobile"
                                className="w-6 h-6 sm:w-7 sm:h-7"
                              />
                              <Label
                                htmlFor="withdraw-mobile"
                                className="flex-1 cursor-pointer"
                              >
                                <span className="text-base sm:text-lg font-medium">
                                  Mobile Money
                                </span>
                              </Label>
                              <Phone className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                            </div>

                            {/* Mobile Money Details */}
                            {withdrawMethod === "mobile" && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="border-t border-green-200 overflow-hidden"
                              >
                                <div className="p-8 space-y-8">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Select Network Provider
                                    </Label>
                                    <Select
                                      value={withdrawDetails.networkProvider}
                                      onValueChange={(value) =>
                                        setWithdrawDetails({
                                          ...withdrawDetails,
                                          networkProvider: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="mt-1 border-0 outline-none focus:ring-0 focus:border-0">
                                        <SelectValue placeholder="Eg. MTN" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="MTN">MTN</SelectItem>
                                        <SelectItem value="VOD">
                                          Vodafone
                                        </SelectItem>
                                        <SelectItem value="ATL">
                                          AirtelTigo
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-700">
                                      Phone number
                                    </Label>
                                    <div className="flex rounded-lg border border-gray-300 outline-none overflow-hidden focus-within:ring-0 focus-within:border-gray-400 transition-all duration-200">
                                      <div className="flex items-center px-3 sm:px-4 py-3 sm:py-3 bg-gray-50 border-r border-gray-300 min-w-[80px] sm:min-w-[90px]">
                                        <span className="text-base sm:text-lg mr-2">
                                          🇬🇭
                                        </span>
                                        <span className="text-sm sm:text-base font-medium text-gray-700">
                                          +233
                                        </span>
                                      </div>
                                      <Input
                                        placeholder="Eg. 55 567 8905"
                                        value={withdrawDetails.phoneNumber}
                                        onChange={(e) =>
                                          setWithdrawDetails({
                                            ...withdrawDetails,
                                            phoneNumber: e.target.value,
                                          })
                                        }
                                        className="flex-1 border-0 outline-none rounded-none focus:ring-0 focus:border-0 py-3 sm:py-6 px-3 sm:px-4 text-gray-900 placeholder-gray-500 text-sm sm:text-base"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-gray-200">
              {(withdrawStep === "success" || withdrawStep === "error") && (
                <div className="flex justify-center">
                  <Button
                    className="flex h-[50px] px-8 justify-center items-center gap-1.5 rounded-xl bg-green-700 hover:bg-green-800 text-white transition-all duration-200"
                    onClick={() => {
                      setIsWithdrawOpen(false);
                      setWithdrawStep("amount");
                      setWithdrawAmount("");
                      setWithdrawMethod("");
                      setWithdrawAmountError("");
                      setWithdrawResult(null);
                      setIsWithdrawProcessing(false);
                    }}
                  >
                    {withdrawStep === "success" ? "Done" : "Try Again"}
                  </Button>
                </div>
              )}

              {withdrawStep === "loading" && (
                <div className="flex justify-center">
                  <Loading size="sm" />
                </div>
              )}

              {withdrawStep === "amount" && (
                <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3 sm:space-y-0">
                  <Button
                    variant="outline"
                    className="flex h-[50px] px-8 justify-center items-center gap-1.5 flex-1 rounded-xl border-green-600 text-green-600 hover:bg-green-50 transition-all duration-200"
                    onClick={() => setIsWithdrawOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex h-[50px] px-8 justify-center items-center gap-1.5 flex-1 rounded-xl bg-green-700 hover:bg-green-800 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleWithdraw}
                    disabled={
                      !withdrawMethod ||
                      !!withdrawAmountError ||
                      parseFloat(withdrawAmount) <= 0
                    }
                  >
                    Withdraw
                  </Button>
                </div>
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
