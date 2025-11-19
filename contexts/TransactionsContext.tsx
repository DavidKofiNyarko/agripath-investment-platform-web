'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useUser } from './UserContext';

export interface Transaction {
  id: string;
  transaction_id: string;
  profile_id: string;
  project_id: string;
  type: 'Payin' | 'Payout' | 'Refund' | 'momo_topup' | 'momo_withdrawal' | 'bank_withdrawal' | 'investment';
  amount: number;
  unit: number;
  status: 'Pending' | 'Complete' | 'Failed'; // Database uses 'Complete'
  fees: number;
  net_amount: number;
  description: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  channel: 'momo' | 'bank' | 'card' | 'wallet';
  external_id: string | null;
  network: string | null;
  account_number: string;
  project_name?: string;
}

interface TransactionRow {
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
  description: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  channel: string;
  external_id: string | null;
  network: string | null;
  account_number: string;
  projects: {
    project_name: string | null;
  } | {
    project_name: string | null;
  }[] | null;
}

interface TransactionFilters {
  status: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface TransactionsContextType {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  refreshTransactions: () => Promise<void>;
  pagination: Pagination;
  setPagination: React.Dispatch<React.SetStateAction<Pagination>>;
}

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

export const useTransactions = () => {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionsProvider');
  }
  return context;
};

export const TransactionsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    status: 'All'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query with filters
      let query = supabase
        .from('transactions')
        .select(`
          id,
          transaction_id,
          profile_id,
          project_id,
          type,
          amount,
          unit,
          status,
          fees,
          net_amount,
          description,
          processed_at,
          created_at,
          updated_at,
          channel,
          external_id,
          network,
          account_number,
          projects:project_id(
            project_name
          )
        `, { count: 'exact' })
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      // Note: Type filtering is now handled in the UI component, not at database level
      // This allows for better tab switching without refetching data

      // Apply status filter
      if (filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      const from = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const to = from + pagination.itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(`Failed to fetch transactions: ${queryError.message}`);
      }

      // Format transactions data
      const formattedTransactions = data?.map((item: TransactionRow) => ({
        id: item.id,
        transaction_id: item.transaction_id,
        profile_id: item.profile_id,
        project_id: item.project_id,
        type: item.type as Transaction['type'],
        amount: item.amount,
        unit: item.unit,
        status: item.status as 'Pending' | 'Complete' | 'Failed',
        fees: item.fees || 0,
        net_amount: item.net_amount,
        description: item.description || '',
        processed_at: item.processed_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        channel: item.channel as 'momo' | 'bank' | 'card' | 'wallet',
        external_id: item.external_id,
        network: item.network,
        account_number: item.account_number,
        project_name: Array.isArray(item.projects) ? (item.projects[0]?.project_name || 'Unknown Project') : (item.projects?.project_name || 'Unknown Project'),
      })) || [];

      setTransactions(formattedTransactions);

      // Update pagination
      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      
      setPagination(prev => ({
        ...prev,
        totalPages,
        totalItems
      }));

    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [user, filters, pagination.currentPage, pagination.itemsPerPage, supabase]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, fetchTransactions]);

  // Refetch when filters change (immediate)
  useEffect(() => {
    if (user) {
      // Reset to first page when filters change
      setPagination(prev => ({ ...prev, currentPage: 1 }));
      fetchTransactions();
    }
  }, [filters.status, user, fetchTransactions]);

  // Real-time subscription for transactions
  useEffect(() => {
    if (!user) return;

    let channel: any = null;

    try {
      channel = supabase
        .channel(`transactions-changes-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all changes (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "transactions",
            filter: `profile_id=eq.${user.id}`, // Only listen to user's transactions
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              // New transaction added
              const newTransactionRow = payload.new as TransactionRow;
              const newTransaction: Transaction = {
                id: newTransactionRow.id,
                transaction_id: newTransactionRow.transaction_id,
                profile_id: newTransactionRow.profile_id,
                project_id: newTransactionRow.project_id,
                type: newTransactionRow.type as Transaction['type'],
                amount: newTransactionRow.amount,
                unit: newTransactionRow.unit,
                status: newTransactionRow.status as 'Pending' | 'Complete' | 'Failed',
                fees: newTransactionRow.fees || 0,
                net_amount: newTransactionRow.net_amount,
                description: newTransactionRow.description || '',
                processed_at: newTransactionRow.processed_at,
                created_at: newTransactionRow.created_at,
                updated_at: newTransactionRow.updated_at,
                channel: newTransactionRow.channel as 'momo' | 'bank' | 'card' | 'wallet',
                external_id: newTransactionRow.external_id,
                network: newTransactionRow.network,
                account_number: newTransactionRow.account_number,
                project_name: Array.isArray(newTransactionRow.projects) 
                  ? (newTransactionRow.projects[0]?.project_name || 'Unknown Project') 
                  : (newTransactionRow.projects?.project_name || 'Unknown Project'),
              };
              setTransactions((prevTransactions) => [
                newTransaction,
                ...prevTransactions,
              ]);
            } else if (payload.eventType === "UPDATE") {
              // Transaction updated (e.g., status changed from Pending to Complete)
              const updatedTransaction = payload.new as TransactionRow;
              
              setTransactions((prevTransactions) => {
                // Check if transaction is in current view (considering filters and pagination)
                const index = prevTransactions.findIndex(
                  (t) => t.id === updatedTransaction.id
                );

                if (index !== -1) {
                  // Update existing transaction
                  const formatted: Transaction = {
                    id: updatedTransaction.id,
                    transaction_id: updatedTransaction.transaction_id,
                    profile_id: updatedTransaction.profile_id,
                    project_id: updatedTransaction.project_id,
                    type: updatedTransaction.type as Transaction['type'],
                    amount: updatedTransaction.amount,
                    unit: updatedTransaction.unit,
                    status: updatedTransaction.status as 'Pending' | 'Complete' | 'Failed',
                    fees: updatedTransaction.fees || 0,
                    net_amount: updatedTransaction.net_amount,
                    description: updatedTransaction.description || '',
                    processed_at: updatedTransaction.processed_at,
                    created_at: updatedTransaction.created_at,
                    updated_at: updatedTransaction.updated_at,
                    channel: updatedTransaction.channel as 'momo' | 'bank' | 'card' | 'wallet',
                    external_id: updatedTransaction.external_id,
                    network: updatedTransaction.network,
                    account_number: updatedTransaction.account_number,
                    project_name: Array.isArray(updatedTransaction.projects) 
                      ? (updatedTransaction.projects[0]?.project_name || 'Unknown Project') 
                      : (updatedTransaction.projects?.project_name || 'Unknown Project'),
                  };

                  const updated = [...prevTransactions];
                  updated[index] = formatted;
                  return updated;
                } else {
                  // Transaction not in current view, refresh to get updated list
                  fetchTransactions();
                  return prevTransactions;
                }
              });
            } else if (payload.eventType === "DELETE") {
              // Transaction deleted - remove from list
              setTransactions((prevTransactions) =>
                prevTransactions.filter((t) => t.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Successfully subscribed
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            // Handle channel errors
          }
        });

      return () => {
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    } catch (error) {
      // Error setting up real-time subscription
    }
  }, [user, supabase, fetchTransactions]);

  const refreshTransactions = useCallback(() => fetchTransactions(), [fetchTransactions]);

  const value = {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    refreshTransactions,
    pagination,
    setPagination
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
};
