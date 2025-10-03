'use client';

import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Network
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
          <Clock className="h-3 w-3" />
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
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">{status}</Badge>;
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'Payin':
      return 'Investment';
    case 'Payout':
      return 'Payout';
    case 'Refund':
      return 'Refund';
    default:
      return type;
  }
};

export function TransactionDetailDrawer({ transactionId, open, onClose }: TransactionDetailDrawerProps) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (open && transactionId) {
      fetchTransactionDetail();
    }
  }, [open, transactionId]);

  const fetchTransactionDetail = async () => {
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
  };

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
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

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transaction Details</SheetTitle>
          <SheetDescription>
            Complete information about this transaction
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Transaction Status and Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <span className="font-medium">{getTypeLabel(transaction.type)}</span>
            </div>
            {getStatusBadge(transaction.status)}
          </div>

          <Separator />

          {/* Transaction ID */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Hash className="h-4 w-4" />
              <span>Transaction ID</span>
            </div>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded">{transaction.transaction_id}</p>
          </div>

          {/* Amount Details */}
          <div className="bg-green-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <DollarSign className="h-4 w-4" />
                <span>Amount</span>
              </div>
              <span className="text-lg font-bold text-green-700">
                GHS {transaction.amount.toLocaleString()}
              </span>
            </div>
            
            {transaction.fees > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Transaction Fee</span>
                <span className="text-gray-700">GHS {transaction.fees.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm pt-2 border-t border-green-200">
              <span className="text-gray-600">Net Amount</span>
              <span className="font-semibold text-gray-900">
                GHS {transaction.net_amount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Units</span>
              <span className="font-semibold text-gray-900">{transaction.unit}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Information
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium capitalize">{transaction.channel}</span>
              </div>
              
              {transaction.network && (
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Network className="h-3 w-3" />
                    Network
                  </span>
                  <span className="font-medium">{transaction.network}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600 flex items-center gap-1">
                  <Smartphone className="h-3 w-3" />
                  Account Number
                </span>
                <span className="font-medium font-mono">{transaction.account_number}</span>
              </div>

              {transaction.external_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">External ID</span>
                  <span className="font-medium text-xs">{transaction.external_id}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Project Information */}
          {transaction.project && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Project Information
                </h3>
                
                <div className="space-y-2 text-sm bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project Name</span>
                    <span className="font-medium">{transaction.project.project_name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span className="font-medium">{transaction.project.farm_location}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per Unit</span>
                    <span className="font-medium">GHS {transaction.project.unit_price.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Units</span>
                    <span className="font-medium">{transaction.project.total_units}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Project Status</span>
                    <Badge variant="outline" className="capitalize">
                      {transaction.project.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* User Information */}
          {transaction.profile && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Investor Information
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name</span>
                    <span className="font-medium">{transaction.profile.first_name} {transaction.profile.last_name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-xs">{transaction.profile.email}</span>
                  </div>
                  
                  {transaction.profile.phone_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-medium">{transaction.profile.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* Description */}
          {transaction.description && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Description</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {transaction.description}
                </p>
              </div>

              <Separator />
            </>
          )}

          {/* Timestamps */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">
                  {new Date(transaction.created_at).toLocaleString()}
                </span>
              </div>
              
              {transaction.processed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Processed</span>
                  <span className="font-medium">
                    {new Date(transaction.processed_at).toLocaleString()}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {new Date(transaction.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

