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
  channel: 'momo' | 'bank' | 'card';
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
        type: item.type as 'Payin' | 'Payout' | 'Refund',
        amount: item.amount,
        unit: item.unit,
        status: item.status as 'Pending' | 'Complete' | 'Failed',
        fees: item.fees || 0,
        net_amount: item.net_amount,
        description: item.description || '',
        processed_at: item.processed_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        channel: item.channel as 'momo' | 'bank' | 'card',
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
      console.error('Error fetching transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch transactions');
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
