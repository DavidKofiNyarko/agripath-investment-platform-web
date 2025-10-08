'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/app/utils/supabase/client';

export interface Project {
  id: string;
  project_code: string;
  project_name: string;
  project_date: string;
  description: string;
  project_type: 'CROP' | 'LIVESTOCK' | 'FISHERY' | 'OTHER';
  farm_location: string;
  total_units: number;
  unit_price: number;
  total_value: number;
  expected_return_rate: number;
  duration_months: number;
  status: 'Active' | 'Inactive' | 'Complete' | 'Cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  image: string;
  start_date: string;
  end_date: string;
  cover_image_url: string;
  max_expected_return_rate: number;
  available_unit: number;
  purchased_unit: number;
  project_stages: 'PLANNING' | 'PREPARATION' | 'PLANTING' | 'GROWTH' | 'HARVEST' | 'COMPLETED';
  is_high_ticket: boolean;
  min_investment_amount: number;
  max_investment_amount: number;
  payout_type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'END_OF_PROJECT';
}

interface ProjectRow {
  id: string;
  project_code: string;
  project_name: string;
  project_date: string;
  description: string | null;
  project_type: string | null;
  farm_location: string | null;
  total_units: number | null;
  unit_price: number | null;
  total_value: number | null;
  expected_return_rate: number | null;
  duration_months: number | null;
  status: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  image: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_image_url: string | null;
  max_expected_return_rate: number | null;
  available_unit: number | null;
  purchased_unit: number | null;
  project_stages: string | null;
  is_high_ticket: boolean | null;
  min_investment_amount: number | null;
  max_investment_amount: number | null;
  payout_type: string | null;
}

interface ProjectFilters {
  search: string;
  category: string;
  status: string;
  minPrice: number;
  maxPrice: number;
  duration: string;
  returnRate: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface ProjectsContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  filters: ProjectFilters;
  setFilters: (filters: ProjectFilters) => void;
  refreshProjects: () => Promise<void>;
  pagination: Pagination;
  setPagination: React.Dispatch<React.SetStateAction<Pagination>>;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

export const ProjectsProvider = ({ children }: { children: React.ReactNode }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    category: 'All',
    status: 'All',
    minPrice: 0,
    maxPrice: 100000,
    duration: 'All',
    returnRate: 'All'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const supabase = createClient();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query with filters
      let query = supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .eq('status', 'Active') // Only show active projects by default
        .order('created_at', { ascending: false });

      // Apply search filter
      if (filters.search) {
        query = query.or(`project_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,farm_location.ilike.%${filters.search}%`);
      }

      // Apply category filter
      if (filters.category !== 'All') {
        query = query.eq('project_type', filters.category);
      }

      // Apply status filter
      if (filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }

      // Apply price range filter
      if (filters.minPrice > 0) {
        query = query.gte('unit_price', filters.minPrice);
      }
      if (filters.maxPrice < 100000) {
        query = query.lte('unit_price', filters.maxPrice);
      }

      // Apply duration filter
      if (filters.duration !== 'All') {
        switch (filters.duration) {
          case 'Short (1-3 months)':
            query = query.lte('duration_months', 3);
            break;
          case 'Medium (4-8 months)':
            query = query.gte('duration_months', 4).lte('duration_months', 8);
            break;
          case 'Long (9+ months)':
            query = query.gte('duration_months', 9);
            break;
        }
      }

      // Apply return rate filter
      if (filters.returnRate !== 'All') {
        switch (filters.returnRate) {
          case 'Low (5-15%)':
            query = query.gte('expected_return_rate', 5).lte('expected_return_rate', 15);
            break;
          case 'Medium (16-25%)':
            query = query.gte('expected_return_rate', 16).lte('expected_return_rate', 25);
            break;
          case 'High (26%+)':
            query = query.gte('expected_return_rate', 26);
            break;
        }
      }

      // Apply pagination
      const from = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const to = from + pagination.itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(`Failed to fetch projects: ${queryError.message}`);
      }

      // Format projects data
      const formattedProjects = data?.map((item: ProjectRow) => ({
        id: item.id,
        project_code: item.project_code,
        project_name: item.project_name,
        project_date: item.project_date,
        description: item.description || '',
        project_type: (item.project_type as 'CROP' | 'LIVESTOCK' | 'FISHERY' | 'OTHER') || 'CROP',
        farm_location: item.farm_location || '',
        total_units: item.total_units || 0,
        unit_price: item.unit_price || 0,
        total_value: item.total_value || 0,
        expected_return_rate: item.expected_return_rate || 0,
        duration_months: item.duration_months || 0,
        status: (item.status as 'Active' | 'Inactive' | 'Complete' | 'Cancelled') || 'Active',
        created_by: item.created_by || '',
        created_at: item.created_at,
        updated_at: item.updated_at,
        image: item.image || '',
        start_date: item.start_date || '',
        end_date: item.end_date || '',
        cover_image_url: item.cover_image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
        max_expected_return_rate: item.max_expected_return_rate || 0,
        available_unit: item.available_unit || 0,
        purchased_unit: item.purchased_unit || 0,
        project_stages: (item.project_stages as 'PLANNING' | 'PREPARATION' | 'PLANTING' | 'GROWTH' | 'HARVEST' | 'COMPLETED') || 'PLANNING',
        is_high_ticket: item.is_high_ticket || false,
        min_investment_amount: item.min_investment_amount || 0,
        max_investment_amount: item.max_investment_amount || 0,
        payout_type: (item.payout_type as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'END_OF_PROJECT') || 'END_OF_PROJECT'
      })) || [];

      setProjects(formattedProjects);

      // Update pagination
      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      
      setPagination(prev => ({
        ...prev,
        totalPages,
        totalItems
      }));

    } catch (error) {
      console.error('Error fetching projects:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage, supabase]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const refreshProjects = useCallback(() => fetchProjects(), [fetchProjects]);

  const value = {
    projects,
    loading,
    error,
    filters,
    setFilters,
    refreshProjects,
    pagination,
    setPagination
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};
