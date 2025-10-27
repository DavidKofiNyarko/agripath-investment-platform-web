"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import UserHeader from "@/components/user-header";
import { Transaction, useTransactions } from "@/contexts/TransactionsContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionDetailDrawer } from "@/components/transaction-detail-drawer";
import {
  convertTransactionsToCSV,
  downloadCSV,
  generateTransactionFilename,
  ExportableTransaction,
} from "@/lib/csvExport";
import Loading from "@/components/ui/loading";
import {
  Search,
  Download,
  Bell,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const transactionTypes = [
  {
    id: "investments",
    label: "Investments",
    dbType: ["Payin", "investment"],
    active: true,
    disabled: false,
  },
  {
    id: "topups",
    label: "Top Ups",
    dbType: "momo_topup",
    active: false,
    disabled: false,
  },
  {
    id: "withdrawals",
    label: "Withdrawals",
    dbType: ["momo_withdrawal", "bank_withdrawal"],
    active: false,
    disabled: false,
  },
  {
    id: "payouts",
    label: "Payouts",
    dbType: "Payout",
    active: false,
    disabled: false,
  },
];

// Transaction data now comes from TransactionsContext

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Complete":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Complete
        </Badge>
      );
    case "Pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          Pending
        </Badge>
      );
    case "Failed":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Failed
        </Badge>
      );
    default:
      return (
        <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          {status}
        </Badge>
      );
  }
};

const TransactionsPage = () => {
  const {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    refreshTransactions,
    pagination,
    setPagination,
  } = useTransactions();

  const [activeTab, setActiveTab] = useState("investments");
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleViewTransaction = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTransactionId(null);
  };

  // Filter transactions by active tab
  const getFilteredTransactions = () => {
    const activeType = transactionTypes.find((t) => t.id === activeTab);
    if (!activeType || !activeType.dbType) {
      return [];
    }

    // Handle array of types (investments, withdrawals)
    if (Array.isArray(activeType.dbType)) {
      return transactions.filter((t) => activeType.dbType.includes(t.type));
    }

    // Handle single type (topups, payouts)
    return transactions.filter((t) => t.type === activeType.dbType);
  };

  const allFilteredTransactions = getFilteredTransactions();

  // Apply additional filters (status, search) to the already filtered transactions
  const filteredTransactions = allFilteredTransactions.filter((transaction) => {
    // Apply status filter
    if (filters.status !== "All" && transaction.status !== filters.status) {
      return false;
    }

    return true;
  });

  // Apply pagination to filtered transactions
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (pagination.currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    endIndex
  );

  // Group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.created_at).toLocaleDateString(
        "en-US",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });

    return groups;
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  // Handle CSV export
  const handleExportCSV = () => {
    try {
      // Convert transactions to exportable format
      const exportableTransactions: ExportableTransaction[] =
        filteredTransactions.map((transaction) => ({
          transactionId: transaction.transaction_id,
          method:
            transaction.channel === "wallet"
              ? "Agripath Account"
              : transaction.channel === "card"
              ? "Card Payment"
              : transaction.channel === "momo"
              ? "Mobile Money"
              : transaction.channel === "bank"
              ? "Bank Transfer"
              : "Other",
          project: transaction.project_name || "Unknown Project",
          amount: `GHS ${transaction.amount.toLocaleString()}`,
          unit: transaction.unit ? transaction.unit.toString() : "",
          status: transaction.status,
          date: new Date(transaction.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }),
          description: transaction.description || "",
        }));

      // Generate CSV content
      const csvContent = convertTransactionsToCSV(exportableTransactions);

      // Download the CSV file
      const filename = generateTransactionFilename();
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      // You could add a toast notification here
      alert("Failed to export transactions. Please try again.");
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, currentPage: page });
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <Loading size="lg" className="min-h-screen" />
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Transactions
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button
              onClick={refreshTransactions}
              className="bg-green-600 hover:bg-green-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header */}
        <UserHeader />

        {/* Page Title */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            My Transactions
          </h2>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {/* Transaction Type Tabs */}
            <div className="flex border-b overflow-x-auto">
              {transactionTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => !type.disabled && setActiveTab(type.id)}
                  disabled={type.disabled}
                  className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === type.id
                      ? "bg-green-600 text-white"
                      : type.disabled
                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {type.label}
                  {type.disabled && (
                    <span className="ml-2 text-xs">(Coming Soon)</span>
                  )}
                </button>
              ))}
            </div>

            {/* Export */}
            <div className="p-4 sm:p-6 border-b">
              <div className="flex justify-end">
                <Button
                  className="bg-green-600 hover:bg-green-700 gap-2 text-sm sm:text-base py-2 sm:py-2.5"
                  onClick={handleExportCSV}
                  disabled={filteredTransactions.length === 0}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Export</span>
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 sm:p-6 border-b bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status Filter
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      handleFilterChange("status", value)
                    }
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      <SelectItem value="Complete">Complete</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Transactions Table - Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    {activeTab === "investments" && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit
                        </th>
                      </>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeTab === "investments" ? 8 : 6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center">
                          <Bell className="h-12 w-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">
                            No transactions found
                          </p>
                          <p className="text-sm">
                            Try adjusting your filters or check back later
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.transaction_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="capitalize">
                              {transaction.channel === "wallet"
                                ? "Agripath Account"
                                : transaction.channel === "card"
                                ? "Card Payment"
                                : transaction.channel === "momo"
                                ? "Mobile Money"
                                : transaction.channel}
                            </span>
                            {transaction.network && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({transaction.network})
                              </span>
                            )}
                          </div>
                        </td>
                        {activeTab === "investments" && (
                          <>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="max-w-xs truncate">
                                {transaction.project_name || "Unknown Project"}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.unit}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div>
                            <div>GHS {transaction.amount.toLocaleString()}</div>
                            {transaction.fees > 0 && (
                              <div className="text-xs text-gray-500">
                                Fee: GHS {transaction.fees.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>
                              {new Date(
                                transaction.created_at
                              ).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(
                                transaction.created_at
                              ).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleViewTransaction(transaction.id)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Transactions Cards - Mobile */}
            <div className="lg:hidden">
              {paginatedTransactions.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <Bell className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No transactions found</p>
                    <p className="text-sm">
                      Try adjusting your filters or check back later
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  {Object.entries(
                    groupTransactionsByDate(paginatedTransactions)
                  ).map(([date, dateTransactions]) => (
                    <div key={date} className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-white py-2">
                        {date}
                      </h3>
                      <div className="space-y-3">
                        {dateTransactions.map((transaction) => (
                          <Card key={transaction.id} className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 truncate">
                                    {transaction.transaction_id}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(
                                      transaction.created_at
                                    ).toLocaleTimeString()}
                                  </p>
                                </div>
                                <div className="ml-2">
                                  {getStatusBadge(transaction.status)}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {activeTab === "investments" && (
                                  <>
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        Project
                                      </p>
                                      <p className="font-medium text-gray-900 truncate">
                                        {transaction.project_name ||
                                          "Unknown Project"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        Units
                                      </p>
                                      <p className="font-medium text-gray-900">
                                        {transaction.unit}
                                      </p>
                                    </div>
                                  </>
                                )}
                                {!(activeTab === "investments") && (
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Amount
                                    </p>
                                    <p className="font-medium text-gray-900">
                                      GHS {transaction.amount.toLocaleString()}
                                    </p>
                                    {transaction.fees > 0 && (
                                      <p className="text-xs text-gray-500">
                                        Fee: GHS{" "}
                                        {transaction.fees.toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">
                                    Method
                                  </p>
                                  <p className="font-medium text-gray-900 capitalize">
                                    {transaction.channel === "wallet"
                                      ? "Agripath Account"
                                      : transaction.channel === "card"
                                      ? "Card Payment"
                                      : transaction.channel === "momo"
                                      ? "Mobile Money"
                                      : transaction.channel}
                                    {transaction.network && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({transaction.network})
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {activeTab === "investments" ? (
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Amount
                                    </p>
                                    <p className="font-medium text-gray-900">
                                      GHS {transaction.amount.toLocaleString()}
                                    </p>
                                    {transaction.fees > 0 && (
                                      <p className="text-xs text-gray-500">
                                        Fee: GHS{" "}
                                        {transaction.fees.toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    {/* <p className="text-xs text-gray-500">
                                      Status
                                    </p> */}
                                    {/* <div className="mt-1">
                                      {getStatusBadge(transaction.status)}
                                    </div> */}
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end pt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() =>
                                    handleViewTransaction(transaction.id)
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Showing{" "}
                  {filteredTransactions.length === 0 ? 0 : startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredTransactions.length)} of{" "}
                  {filteredTransactions.length} transactions
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={
                            pagination.currentPage === page
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className={`h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs sm:text-sm ${
                            pagination.currentPage === page
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "text-gray-600"
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === totalPages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    className="text-xs sm:text-sm px-2 sm:px-3"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Detail Drawer */}
      <TransactionDetailDrawer
        transactionId={selectedTransactionId}
        open={drawerOpen}
        onClose={handleCloseDrawer}
      />
    </DashboardLayout>
  );
};

export default TransactionsPage;
