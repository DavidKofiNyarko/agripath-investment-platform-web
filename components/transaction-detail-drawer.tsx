"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/app/utils/supabase/client";
import {
  Calendar,
  DollarSign,
  CreditCard,
  User,
  Building2,
  Hash,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Smartphone,
  Network,
  TrendingUp,
  Shield,
  Wallet,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  MapPin,
  Package,
  UserCheck,
  Mail,
  Phone,
  CalendarDays,
  Clock3,
  Receipt,
} from "lucide-react";

interface TransactionDetail {
  id: string;
  transaction_id: string;
  profile_id: string;
  project_id: string;
  type: string;
  amount: number;
  unit: number;
  status: string;
  fees: number;
  net_amount: number;
  description: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  channel: string;
  external_id: string | null;
  network: string | null;
  account_number: string;
  // Joined data
  project?: {
    project_name: string;
    farm_location: string;
    total_units: number;
    unit_price: number;
    status: string;
  };
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
}

interface TransactionDetailDrawerProps {
  transactionId: string | null;
  open: boolean;
  onClose: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Complete":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Complete
        </Badge>
      );
    case "Pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
          <Clock3 className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "Failed":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="capitalize">
          {status}
        </Badge>
      );
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "Payin":
      return "Investment";
    case "Payout":
      return "Withdrawal";
    case "Refund":
      return "Refund";
    default:
      return type;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Payin":
    case "investment":
      return ArrowUpRight;
    case "Payout":
      return ArrowDownLeft;
    case "Refund":
      return RefreshCw;
    case "momo_topup":
      return Smartphone;
    case "momo_withdrawal":
    case "bank_withdrawal":
      return Banknote;
    default:
      return Receipt;
  }
};

const formatHumanReadableDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );
  const diffInDays = Math.floor(diffInHours / 24);

  let relativeTime = "";
  if (diffInDays === 0) {
    if (diffInHours === 0) {
      relativeTime = "Just now";
    } else if (diffInHours === 1) {
      relativeTime = "1 hour ago";
    } else {
      relativeTime = `${diffInHours} hours ago`;
    }
  } else if (diffInDays === 1) {
    relativeTime = "Yesterday";
  } else if (diffInDays < 7) {
    relativeTime = `${diffInDays} days ago`;
  } else {
    relativeTime = `${Math.floor(diffInDays / 7)} weeks ago`;
  }

  return {
    fullDate: date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
    relative: relativeTime,
  };
};

const generateReceipt = (transaction: TransactionDetail) => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const date = new Date(transaction.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction Receipt - Agripath</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          padding: 20px; 
          background: #f8f9fa;
        }
        .receipt { 
          max-width: 400px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #16a34a, #15803d); 
          color: white; 
          padding: 24px; 
          text-align: center; 
        }
        .logo { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 8px;
        }
        .subtitle { 
          font-size: 14px; 
          opacity: 0.9; 
        }
        .content { 
          padding: 24px; 
        }
        .section { 
          margin-bottom: 20px; 
        }
        .section-title { 
          font-size: 16px; 
          font-weight: 600; 
          color: #374151; 
          margin-bottom: 12px; 
          border-bottom: 2px solid #e5e7eb; 
          padding-bottom: 8px;
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 8px; 
          font-size: 14px;
        }
        .label { 
          color: #6b7280; 
        }
        .value { 
          font-weight: 500; 
          color: #111827; 
        }
        .total { 
          background: #f3f4f6; 
          padding: 16px; 
          border-radius: 8px; 
          margin-top: 16px;
        }
        .total-amount { 
          font-size: 20px; 
          font-weight: bold; 
          color: #16a34a; 
          text-align: center;
        }
        .footer { 
          background: #f9fafb; 
          padding: 16px; 
          text-align: center; 
          font-size: 12px; 
          color: #6b7280;
        }
        @media print {
          body { padding: 0; background: white; }
          .receipt { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <div class="logo">🌱 Agripath</div>
          <div class="subtitle">Transaction Receipt</div>
        </div>
        
        <div class="content">
          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="detail-row">
              <span class="label">Transaction ID:</span>
              <span class="value">${transaction.transaction_id}</span>
            </div>
            <div class="detail-row">
              <span class="label">Type:</span>
              <span class="value">${getTypeLabel(transaction.type)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date & Time:</span>
              <span class="value">${date}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value">${transaction.status}</span>
            </div>
          </div>

          ${transaction.profile ? `
          <div class="section">
            <div class="section-title">Investor Details</div>
            <div class="detail-row">
              <span class="label">Name:</span>
              <span class="value">${transaction.profile.first_name} ${transaction.profile.last_name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Email:</span>
              <span class="value">${transaction.profile.email}</span>
            </div>
            <div class="detail-row">
              <span class="label">Phone:</span>
              <span class="value">${transaction.profile.phone_number}</span>
            </div>
          </div>
          ` : ''}

          ${transaction.project ? `
          <div class="section">
            <div class="section-title">Project Details</div>
            <div class="detail-row">
              <span class="label">Project:</span>
              <span class="value">${transaction.project.project_name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Location:</span>
              <span class="value">${transaction.project.farm_location}</span>
            </div>
            <div class="detail-row">
              <span class="label">Units:</span>
              <span class="value">${transaction.unit}</span>
            </div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Financial Details</div>
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span class="value">GHS ${transaction.amount.toLocaleString()}</span>
            </div>
            ${transaction.fees > 0 ? `
            <div class="detail-row">
              <span class="label">Fees:</span>
              <span class="value">GHS ${transaction.fees.toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Net Amount:</span>
              <span class="value">GHS ${transaction.net_amount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Channel:</span>
              <span class="value">${transaction.channel}</span>
            </div>
          </div>

          <div class="total">
            <div class="total-amount">
              GHS ${transaction.net_amount.toLocaleString()}
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for using Agripath!</p>
          <p>This receipt confirms your transaction.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (isMobile) {
    // For mobile, open in new window for better compatibility
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      // Give time for content to load, then trigger print/save
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  } else {
    // For desktop, download the file
    const blob = new Blob([receiptHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `agripath-receipt-${transaction.transaction_id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export function TransactionDetailDrawer({
  transactionId,
  open,
  onClose,
}: TransactionDetailDrawerProps) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchTransactionDetail = useCallback(async () => {
    if (!transactionId) return;

    setLoading(true);
    try {
      // First try to fetch from transactions table
      const { data, error } = await supabase
        .from("transactions")
        .select(
          `
          *,
          projects:project_id(
            project_name,
            farm_location,
            total_units,
            unit_price,
            status
          ),
          profile:profile_id(
            first_name,
            last_name,
            email,
            phone_number
          )
        `
        )
        .eq("id", transactionId)
        .single();

      // If not found in transactions, try payouts table
      let transactionData = data;
      if (error || !data) {
        const { data: payoutData, error: payoutError } = await supabase
          .from("payouts")
          .select(
            `
            *,
            projects:project_id(
              project_name,
              farm_location,
              total_units,
              unit_price,
              status
            ),
            profile:profile_id(
              first_name,
              last_name,
              email,
              phone_number
            )
          `
          )
          .eq("id", transactionId)
          .single();

        // If payout query also fails, throw the error
        if (payoutError || !payoutData) {
          throw (
            payoutError ||
            new Error("Transaction not found in transactions or payouts")
          );
        }

        // Convert payout to transaction format
        transactionData = {
          id: payoutData.id,
          transaction_id: payoutData.payout_id,
          profile_id: payoutData.profile_id || "",
          project_id: payoutData.project_id || "",
          type: "Payout",
          amount: payoutData.amount,
          unit: 0,
          status: payoutData.status || "Pending",
          fees: 0,
          net_amount: payoutData.calculated_amount || payoutData.amount,
          description: payoutData.description || "",
          processed_at: payoutData.processed_at,
          created_at: payoutData.created_at,
          updated_at: payoutData.updated_at,
          channel: (payoutData.payment_method?.toLowerCase() ||
            "momo") as string,
          external_id: payoutData.external_ref,
          network: payoutData.account_issuer,
          account_number: payoutData.account_bank || "",
          projects: Array.isArray(payoutData.projects)
            ? payoutData.projects[0]
            : payoutData.projects,
          profile: Array.isArray(payoutData.profile)
            ? payoutData.profile[0]
            : payoutData.profile,
        };
      }

      if (!transactionData) {
        throw new Error("Transaction not found");
      }

      setTransaction({
        ...transactionData,
        project: Array.isArray(transactionData.projects)
          ? transactionData.projects[0]
          : transactionData.projects,
        profile: Array.isArray(transactionData.profile)
          ? transactionData.profile[0]
          : transactionData.profile,
      });
    } catch (error) {
      // Error fetching transaction detail
    } finally {
      setLoading(false);
    }
  }, [transactionId, supabase]);

  useEffect(() => {
    if (open && transactionId) {
      fetchTransactionDetail();
    }
  }, [open, transactionId, fetchTransactionDetail]);

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg p-0 overflow-y-auto">
          <SheetHeader className="p-6 border-b">
            <SheetTitle className="text-xl font-semibold">
              Transaction Details
            </SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!transaction) {
    return null;
  }

  const TypeIcon = getTypeIcon(transaction.type);

  return (
      <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg p-0 overflow-y-auto">
        <SheetHeader className="p-4 sm:p-6 border-b border-gray-200">
          <SheetTitle className="text-lg sm:text-xl font-semibold">
            Transaction Details
          </SheetTitle>
          <SheetDescription className="text-gray-600 text-sm sm:text-base mt-1">
            Complete information about this transaction
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header Section with Status */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-5 rounded-lg border border-green-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-green-100 rounded-lg flex-shrink-0">
                  <TypeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-gray-900 text-base sm:text-lg">
                    {getTypeLabel(transaction.type)}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    #{transaction.transaction_id}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(transaction.status)}
              </div>
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Banknote className="h-4 w-4 text-green-600 flex-shrink-0" />
              Financial Summary
            </h3>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Amount</span>
                <span className="text-lg sm:text-xl font-bold text-green-600">
                  GHS {transaction.amount.toLocaleString()}
                </span>
              </div>

              {transaction.fees > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-t border-gray-100">
                  <span className="text-gray-600 text-sm sm:text-base">Transaction Fee</span>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">
                    GHS {transaction.fees.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-t border-gray-100">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Net Amount</span>
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  GHS {transaction.net_amount.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-t border-gray-100">
                <span className="text-gray-600 font-medium text-sm sm:text-base">Units</span>
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  {transaction.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Information Card - Commented out for now */}
          {/* <div className="bg-white border border-gray-50/10 rounded-sm p-5 shadow-xs">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              Payment Information
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-gray-600 font-medium text-sm sm:text-base">
                  Method
                </span>
                <Badge
                  variant="secondary"
                  className="capitalize bg-blue-100 text-blue-800 w-fit"
                >
                  {transaction.channel === "wallet"
                    ? "Agripath Account"
                    : transaction.channel}
                </Badge>
              </div>

              {transaction.network && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm sm:text-base flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Network
                  </span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base break-all sm:break-normal">
                    {transaction.network}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1 sm:gap-0">
                <span className="text-gray-600 text-sm sm:text-base flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Account Number
                </span>
                <span className="font-semibold text-gray-900 font-mono text-sm sm:text-base break-all sm:break-normal">
                  {transaction.account_number}
                </span>
              </div>

              {transaction.external_id && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 gap-1 sm:gap-0">
                  <span className="text-gray-600 font-medium text-sm sm:text-base">
                    External ID
                  </span>
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm break-all sm:break-normal">
                    {transaction.external_id}
                  </span>
                </div>
              )}
            </div>
          </div> */}

          {/* Project Information Card */}
          {transaction.project && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <Package className="h-4 w-4 text-purple-600 flex-shrink-0" />
                Project Information
              </h3>

              <div className="space-y-3">
                <div className="flex flex-col gap-1 sm:gap-0 py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600 font-medium text-xs sm:text-sm mb-1">
                    Project Name
                  </span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                    {transaction.project.project_name}
                  </span>
                </div>

                <div className="flex flex-col gap-1 sm:gap-0 py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600 text-xs sm:text-sm font-medium flex items-center gap-2 mb-1">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Location
                  </span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base break-words pl-5 sm:pl-6">
                    {transaction.project.farm_location}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600 text-xs sm:text-sm font-medium">
                    Price per Unit
                  </span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    GHS {transaction.project.unit_price.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-gray-600 text-xs sm:text-sm font-medium">
                    Total Units
                  </span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {transaction.project.total_units}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
                  <span className="text-gray-600 text-xs sm:text-sm font-medium">
                    Project Status
                  </span>
                  <Badge
                    variant={
                      transaction.project.status === "Active"
                        ? "default"
                        : "secondary"
                    }
                    className={`capitalize w-fit text-xs sm:text-sm ${
                      transaction.project.status === "Active"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                    }`}
                  >
                    {transaction.project.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Timeline - Simplified */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="h-4 w-4 text-gray-600 flex-shrink-0" />
              Transaction Timeline
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2">
                <span className="text-gray-600 text-xs sm:text-sm">Created</span>
                <span className="font-medium text-gray-900 text-xs sm:text-sm">
                  {new Date(transaction.created_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {transaction.processed_at && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 py-2 border-t border-gray-100">
                  <span className="text-gray-600 text-xs sm:text-sm">Processed</span>
                  <span className="font-medium text-gray-900 text-xs sm:text-sm">
                    {new Date(transaction.processed_at).toLocaleString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Download Receipt Button */}
          {transaction && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm">
              <Button
                onClick={() => generateReceipt(transaction)}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base h-10 sm:h-11"
                variant="default"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
