'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/app/utils/supabase/client';
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
  Receipt
} from 'lucide-react';

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
    case 'Complete':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Complete
        </Badge>
      );
    case 'Pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1">
          <Clock3 className="h-3 w-3" />
          Pending
        </Badge>
      );
    case 'Failed':
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
    case 'Payin':
      return 'Investment';
    case 'Payout':
      return 'Withdrawal';
    case 'Refund':
      return 'Refund';
    default:
      return type;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Payin':
    case 'investment':
      return ArrowUpRight;
    case 'Payout':
      return ArrowDownLeft;
    case 'Refund':
      return RefreshCw;
    case 'momo_topup':
      return Smartphone;
    case 'momo_withdrawal':
    case 'bank_withdrawal':
      return Banknote;
    default:
      return Receipt;
  }
};

const formatHumanReadableDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);
  
  let relativeTime = '';
  if (diffInDays === 0) {
    if (diffInHours === 0) {
      relativeTime = 'Just now';
    } else if (diffInHours === 1) {
      relativeTime = '1 hour ago';
    } else {
      relativeTime = `${diffInHours} hours ago`;
    }
  } else if (diffInDays === 1) {
    relativeTime = 'Yesterday';
  } else if (diffInDays < 7) {
    relativeTime = `${diffInDays} days ago`;
  } else {
    relativeTime = `${Math.floor(diffInDays / 7)} weeks ago`;
  }
  
  return {
    fullDate: date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }),
    relative: relativeTime
  };
};

export function TransactionDetailDrawer({ transactionId, open, onClose }: TransactionDetailDrawerProps) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const fetchTransactionDetail = useCallback(async () => {
    if (!transactionId) return;
    
    setLoading(true);
    try {
      const { data, error} = await supabase
        .from('transactions')
        .select(`
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
        `)
        .eq('id', transactionId)
        .single();

      if (error) throw error;

      setTransaction({
        ...data,
        project: Array.isArray(data.projects) ? data.projects[0] : data.projects,
        profile: Array.isArray(data.profile) ? data.profile[0] : data.profile,
      });
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
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
            <SheetTitle className="text-xl font-semibold">Transaction Details</SheetTitle>
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
        <SheetHeader className="p-6 border-none">
          <SheetTitle className="text-xl font-semibold">Transaction Details</SheetTitle>
          <SheetDescription className="text-gray-600">
            Complete information about this transaction
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 p-6 space-y-6">
          {/* Header Section with Status */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-sm border border-green-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TypeIcon className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{getTypeLabel(transaction.type)}</h2>
                  <p className="text-sm text-gray-600">#{transaction.transaction_id}</p>
                </div>
              </div>
              {getStatusBadge(transaction.status)}
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="bg-white border border-gray-50/10 rounded-sm p-5 shadow-xs">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-600" />
              Financial Summary
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 font-medium">Amount</span>
                <span className="text-xl font-bold text-green-600">
                  GHS {transaction.amount.toLocaleString()}
                </span>
              </div>
              
              {transaction.fees > 0 && (
                <div className="flex items-center justify-between py-2 border-t border-gray-50/20">
                  <span className="text-gray-600">Transaction Fee</span>
                  <span className="font-semibold text-gray-700">GHS {transaction.fees.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between py-2 border-t border-gray-50/20">
                <span className="text-gray-600 font-medium">Net Amount</span>
                <span className="text-lg font-bold text-gray-900">
                  GHS {transaction.net_amount.toLocaleString()}
                </span>
              </div>

                  <div className="flex items-center justify-between py-2 border-t border-gray-50/20">
                <span className="text-gray-600 font-medium">Units</span>
                <span className="text-lg font-bold text-gray-900">{transaction.unit}</span>
              </div>
            </div>
          </div>

          {/* Payment Information Card */}
          <div className="bg-white border border-gray-50/10 rounded-sm p-5 shadow-xs">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              Payment Information
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 font-medium">Method</span>
                <Badge variant="secondary" className="capitalize bg-blue-100 text-blue-800">
                  {transaction.channel === 'wallet' ? 'Agripath Account' : transaction.channel}
                </Badge>
              </div>
              
              {transaction.network && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    Network
                  </span>
                  <span className="font-semibold text-gray-900">{transaction.network}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Account Number
                </span>
                <span className="font-semibold text-gray-900 font-mono">{transaction.account_number}</span>
              </div>

              {transaction.external_id && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">External ID</span>
                  <span className="font-semibold text-gray-900 text-sm">{transaction.external_id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Project Information Card */}
          {transaction.project && (
            <div className="bg-white border border-gray-50/10 rounded-sm p-5 shadow-xs">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                Project Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Project Name</span>
                  <span className="font-semibold text-gray-900">{transaction.project.project_name}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </span>
                  <span className="font-semibold text-gray-900">{transaction.project.farm_location}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Price per Unit</span>
                  <span className="font-semibold text-gray-900">GHS {transaction.project.unit_price.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Total Units</span>
                  <span className="font-semibold text-gray-900">{transaction.project.total_units}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Project Status</span>
                  <Badge 
                    variant={transaction.project.status === 'Active' ? 'default' : 'secondary'}
                    className={`capitalize ${
                      transaction.project.status === 'Active' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {transaction.project.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Investor Information Card */}
          {transaction.profile && (
            <div className="bg-white border border-gray-50/10 rounded-sm p-5 shadow-xs">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-orange-600" />
                Investor Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium">Name</span>
                  <span className="font-semibold text-gray-900">{transaction.profile.first_name} {transaction.profile.last_name}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600 font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </span>
                  <span className="font-semibold text-gray-900 text-sm">{transaction.profile.email}</span>
                </div>
                
                {transaction.profile.phone_number && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600 font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </span>
                    <span className="font-semibold text-gray-900">{transaction.profile.phone_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transaction Timeline Card */}
          <div className="bg-gradient-to-br from-blue-50/30 to-indigo-50/30 border border-blue-100/50 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-6">
              Transaction Timeline
            </h3>
            
            <div className="space-y-6">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">Transaction Created</h4>
                    <p className="text-sm text-gray-600">When this transaction was initiated</p>
                  </div>
                  <div className="text-right min-w-0 flex-shrink-0 ml-4">
                    <div className="font-semibold text-gray-900 text-sm leading-tight">
                      {formatHumanReadableDate(transaction.created_at).fullDate}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      at {formatHumanReadableDate(transaction.created_at).time}
                    </div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-2">
                      {formatHumanReadableDate(transaction.created_at).relative}
                    </div>
                  </div>
                </div>
              </div>
              
              {transaction.processed_at && (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Transaction Processed</h4>
                      <p className="text-sm text-gray-600">When this transaction was completed</p>
                    </div>
                    <div className="text-right min-w-0 flex-shrink-0 ml-4">
                      <div className="font-semibold text-gray-900 text-sm leading-tight">
                        {formatHumanReadableDate(transaction.processed_at).fullDate}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        at {formatHumanReadableDate(transaction.processed_at).time}
                      </div>
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mt-2">
                        {formatHumanReadableDate(transaction.processed_at).relative}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}