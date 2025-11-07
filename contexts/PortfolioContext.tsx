'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useUser } from './UserContext';
import { calculateProjectProgress as calculateStageProgress, mapOldStageToNew, ProjectType, ProjectStage, getProjectEndDate } from '@/lib/project-stages';

export interface Project {
  id: string;
  project_name: string;
  description: string;
  cover_image_url: string;
  project_type: string;
  status: string;
  total_units: number;
  unit_price: number;
  expected_return_rate: number;
  max_expected_return_rate: number;
  duration_months: number;
  project_stages: string;
  start_date: string;
  end_date: string;
  invested_amount: number;
  units_owned: number;
  last_investment: string;
  investment_count: number;
  // Additional properties for portfolio display
  amount?: number;
  units?: number;
  date?: string;
  progress?: number;
  roi?: string;
  potentialReturn?: string;
  duration?: string;
  endDate?: string;
  timeline?: Array<{
    step: string;
    date: string;
    completed: boolean;
    current?: boolean;
  }>;
}

interface PortfolioMetrics {
  total_invested: number;
  active_projects: number;
  total_units: number;
  total_transactions: number;
  expected_returns: number;
  average_investment: number;
}

interface Transaction {
  id: string;
  transaction_id: string;
  project_id: string;
  type: 'Payin' | 'Payout' | 'Refund';
  amount: number;
  unit: number;
  status: 'Complete' | 'Pending' | 'Failed' | 'Cancelled';
  net_amount: number;
  description: string | null;
  processed_at: string | null;
  created_at: string;
  channel: 'momo' | 'card' | 'bank';
  project_name?: string;
}

// Supabase response types
interface SupabaseProject {
  id: string;
  project_name: string;
  description: string | null;
  cover_image_url: string | null;
  project_type: 'CROP' | 'LIVESTOCK' | 'FISHERY' | 'OTHER';
  status: 'Active' | 'Inactive' | 'Complete' | 'Completed' | 'Cancelled';
  total_units: number;
  unit_price: number;
  expected_return_rate: number;
  max_expected_return_rate: number;
  duration_months: number;
  project_stages: 'PLANNING' | 'PREPARATION' | 'PLANTING' | 'GROWTH' | 'HARVEST' | 'COMPLETED';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface SupabaseTransactionWithProject {
  project_id: string;
  amount: number;
  unit: number;
  created_at: string;
  projects: SupabaseProject;
}

interface SupabaseMetricsData {
  amount: number;
  unit: number;
  type: 'Payin' | 'Payout' | 'Refund';
  status: 'Complete' | 'Pending' | 'Failed' | 'Cancelled';
}

interface SupabaseTransactionData {
  id: string;
  transaction_id: string;
  project_id: string;
  type: 'Payin' | 'Payout' | 'Refund';
  amount: number;
  unit: number;
  status: 'Complete' | 'Pending' | 'Failed' | 'Cancelled';
  net_amount: number;
  description: string | null;
  processed_at: string | null;
  created_at: string;
  channel: 'momo' | 'card' | 'bank';
  projects: {
    project_name: string;
  };
}

interface PortfolioFilters {
  type: string;
  status: string;
  search: string;
}

interface PortfolioPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface PortfolioContextType {
  projects: Project[];
  metrics: PortfolioMetrics | null;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  filters: PortfolioFilters;
  setFilters: (filters: PortfolioFilters) => void;
  pagination: PortfolioPagination;
  setPagination: React.Dispatch<React.SetStateAction<PortfolioPagination>>;
  refreshPortfolio: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

// Calculate accurate project progress based on timeline
const calculateProjectProgress = (projectStartDate: Date, durationMonths: number) => {
  const now = new Date();
  const projectEndDate = new Date(projectStartDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
  const totalDuration = projectEndDate.getTime() - projectStartDate.getTime();
  const elapsed = now.getTime() - projectStartDate.getTime();
  
  // Clamp progress between 0 and 100
  const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  return Math.round(progress);
};

// Calculate accurate end date from project start + duration
const calculateProjectEndDate = (projectStartDate: Date, durationMonths: number) => {
  const endDate = new Date(projectStartDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
  return endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Generate accurate project timeline based on real project data
const generateProjectTimeline = (projectStage: string, durationMonths: number, projectStartDate: Date) => {
  const timeline: { step: string; date: string; completed: boolean; current?: boolean }[] = [];
  const now = new Date();
  const projectEndDate = new Date(projectStartDate.getTime() + durationMonths * 30 * 24 * 60 * 60 * 1000);
  
  // Define project phases based on duration and current stage
  const phases = [
    { name: 'Project Initiation', duration: 0.5 }, // 0.5 months
    { name: 'Land Preparation', duration: 1 },     // 1 month
    { name: 'Planting/Growth', duration: durationMonths * 0.6 }, // 60% of duration
    { name: 'Harvest Phase', duration: durationMonths * 0.3 },   // 30% of duration
    { name: 'Project Completion', duration: 0.5 }   // 0.5 months
  ];
  
  let currentDate = new Date(projectStartDate);
  let currentPhaseIndex = -1;
  
  // Find which phase we're currently in based on project stage
  const stageMapping: Record<string, number> = {
    'PLANNING': 0,
    'PREPARATION': 1,
    'PLANTING': 2,
    'GROWTH': 2,
    'HARVEST': 3,
    'COMPLETED': 4
  };
  
  currentPhaseIndex = stageMapping[projectStage] || 0;
  
  phases.forEach((phase, index) => {
    const phaseEndDate = new Date(currentDate.getTime() + phase.duration * 30 * 24 * 60 * 60 * 1000);
    const isCompleted = index < currentPhaseIndex || (index === currentPhaseIndex && now > phaseEndDate);
    const isCurrent = index === currentPhaseIndex && now >= currentDate && now <= phaseEndDate;
    
    timeline.push({
      step: phase.name,
      date: phaseEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      completed: isCompleted,
      current: isCurrent && !isCompleted
    });
    
    currentDate = new Date(phaseEndDate);
  });
  
  return timeline;
};

// Type validation helpers
const isValidProject = (project: unknown): project is SupabaseProject => {
  if (!project || typeof project !== 'object' || project === null) return false;
  
  const p = project as Record<string, unknown>;
  
  const checks = {
    id: typeof p.id === 'string',
    project_name: typeof p.project_name === 'string',
    expected_return_rate: typeof p.expected_return_rate === 'number',
    max_expected_return_rate: typeof p.max_expected_return_rate === 'number',
    duration_months: typeof p.duration_months === 'number',
    unit_price: typeof p.unit_price === 'number',
    total_units: typeof p.total_units === 'number',
    created_at: typeof p.created_at === 'string',
    start_date: (p.start_date === null || typeof p.start_date === 'string'),
    end_date: (p.end_date === null || typeof p.end_date === 'string')
  };
  
  return Object.values(checks).every(check => check);
};

const isValidTransaction = (transaction: unknown): transaction is SupabaseTransactionWithProject => {
  if (!transaction || typeof transaction !== 'object' || transaction === null) return false;
  
  const t = transaction as Record<string, unknown>;
  
  // Simplified validation - just check the essential fields
  const hasProjectId = typeof t.project_id === 'string';
  const hasAmount = typeof t.amount === 'number';
  const hasUnit = typeof t.unit === 'number';
  const hasCreatedAt = typeof t.created_at === 'string';
  const hasProjects = !!t.projects;
  
  return hasProjectId && hasAmount && hasUnit && hasCreatedAt && hasProjects;
};

const isValidMetricsData = (data: unknown): data is SupabaseMetricsData => {
  if (!data || typeof data !== 'object' || data === null) return false;
  
  const d = data as Record<string, unknown>;
  return (
    typeof d.amount === 'number' &&
    typeof d.unit === 'number' &&
    typeof d.type === 'string' &&
    typeof d.status === 'string'
  );
};

export const PortfolioProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PortfolioFilters>({
    type: 'All',
    status: 'All',
    search: ''
  });
  const [pagination, setPagination] = useState<PortfolioPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const supabase = createClient();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setMetrics(null);
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch portfolio metrics - only include completed investment transactions
      // Payin transactions are pending payments and shouldn't be counted as investments
      const { data: metricsData, error: metricsError } = await supabase
        .from('transactions')
        .select('amount, unit, type, status')
        .eq('profile_id', user.id)
        .eq('type', 'investment')
        .eq('status', 'Complete');

      if (metricsError) {
        throw new Error(`Failed to fetch portfolio metrics: ${metricsError.message}`);
      }

      // Type-safe metrics calculation with validation
      const validMetricsData = metricsData?.filter(isValidMetricsData) || [];
      const totalInvested = validMetricsData.reduce((sum, t) => sum + t.amount, 0);
      const totalUnits = validMetricsData.reduce((sum, t) => sum + t.unit, 0);
      // Note: project_id is not available in metrics query, will be calculated from projects data
      const activeProjects = 0; // Will be updated after projects data is fetched
      const totalTransactions = validMetricsData.length;
      const averageInvestment = totalTransactions > 0 ? totalInvested / totalTransactions : 0;

      setMetrics({
        total_invested: totalInvested,
        active_projects: activeProjects,
        total_units: totalUnits,
        total_transactions: totalTransactions,
        expected_returns: totalInvested * 0.15, // Assuming 15% expected return
        average_investment: averageInvestment
      });

      // Fetch all projects data - only include completed investment transactions
      // Payin transactions are pending payments and shouldn't be counted as investments
      const { data: projectsData, error: projectsError } = await supabase
        .from('transactions')
        .select(`
          project_id,
          amount,
          unit,
          created_at,
          projects!inner(
            id,
            project_name,
            description,
            cover_image_url,
            project_type,
            status,
            total_units,
            unit_price,
            expected_return_rate,
            max_expected_return_rate,
            duration_months,
            project_stages,
            start_date,
            end_date
          )
        `)
        .eq('profile_id', user.id)
        .eq('type', 'investment')
        .eq('status', 'Complete')
        .order('created_at', { ascending: false });

      if (projectsError) {
        throw new Error(`Failed to fetch projects: ${projectsError.message}`);
      }

      // Type-safe projects data processing with validation
      const validProjectsData = (projectsData as unknown as SupabaseTransactionWithProject[])?.filter(isValidTransaction) || [];
      
      const projectMap = new Map<string, Project>();
      
      validProjectsData.forEach((item) => {
        const projectId = item.project_id;
        const project = item.projects;
        
        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, {
            id: project.id,
            project_name: project.project_name,
            description: project.description || '',
            cover_image_url: project.cover_image_url || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
            project_type: project.project_type,
            status: project.status,
            total_units: project.total_units,
            unit_price: project.unit_price,
            expected_return_rate: project.expected_return_rate,
            max_expected_return_rate: project.max_expected_return_rate,
            duration_months: project.duration_months,
            project_stages: project.project_stages,
            start_date: project.start_date || item.created_at.split('T')[0], // Use transaction date as fallback
            end_date: project.end_date || '',
            invested_amount: 0,
            units_owned: 0,
            last_investment: '',
            investment_count: 0,
            // Additional properties for portfolio display
            amount: 0,
            units: 0,
            date: '',
            progress: project.status === 'Complete' || project.status === 'Completed'
              ? 100 
              : calculateStageProgress(project.project_type as ProjectType, project.project_stages ? mapOldStageToNew(project.project_stages) as ProjectStage : undefined),
            roi: `${project.expected_return_rate}% - ${project.max_expected_return_rate}%`,
            potentialReturn: `GHS ${Math.round(project.expected_return_rate / 100 * 1000)} - ${Math.round(project.expected_return_rate / 100 * 1500)}`,
            duration: `${project.duration_months} Months`,
            endDate: getProjectEndDate(project.project_type as ProjectType, new Date(project.created_at || Date.now())).toISOString().split('T')[0],
            timeline: generateProjectTimeline(project.project_stages, project.duration_months, new Date(project.created_at || Date.now()))
          });
        }

        const existingProject = projectMap.get(projectId)!;
        existingProject.invested_amount += item.amount;
        existingProject.units_owned += item.unit;
        existingProject.investment_count += 1;
        
        // Update additional properties for display
        existingProject.amount = existingProject.invested_amount;
        existingProject.units = existingProject.units_owned;
        existingProject.date = item.created_at;
        
        // Update last investment date
        const investmentDate = new Date(item.created_at);
        if (!existingProject.last_investment || investmentDate > new Date(existingProject.last_investment)) {
          existingProject.last_investment = item.created_at;
        }
      });

      const projectsArray = Array.from(projectMap.values());
      setProjects(projectsArray);

      // Update metrics with actual project count
      setMetrics(prev => prev ? {
        ...prev,
        active_projects: projectsArray.length
      } : null);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          id,
          transaction_id,
          project_id,
          type,
          amount,
          unit,
          status,
          net_amount,
          description,
          processed_at,
          created_at,
          channel,
          projects!inner(project_name)
        `)
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionsError) {
        throw new Error(`Failed to fetch transactions: ${transactionsError.message}`);
      }

      // Type-safe transaction data processing with validation
      const validTransactionsData = (transactionsData as unknown as SupabaseTransactionData[])?.filter((item) => 
        item &&
        typeof item.id === 'string' &&
        typeof item.transaction_id === 'string' &&
        typeof item.project_id === 'string' &&
        typeof item.amount === 'number' &&
        typeof item.unit === 'number' &&
        typeof item.status === 'string' &&
        typeof item.net_amount === 'number' &&
        typeof item.created_at === 'string' &&
        typeof item.channel === 'string' &&
        item.projects &&
        typeof item.projects.project_name === 'string'
      ) || [];
      
      const formattedTransactions: Transaction[] = validTransactionsData.map((item) => ({
        id: item.id,
        transaction_id: item.transaction_id,
        project_id: item.project_id,
        type: item.type,
        amount: item.amount,
        unit: item.unit,
        status: item.status,
        net_amount: item.net_amount,
        description: item.description,
        processed_at: item.processed_at,
        created_at: item.created_at,
        channel: item.channel,
        project_name: item.projects.project_name
      })) || [];

      setTransactions(formattedTransactions);

    } catch (error) {
      console.error('Error fetching portfolio data:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to fetch portfolio data';
      setError(errorMessage);
      
      // Reset data on error
      setProjects([]);
      setMetrics(null);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      fetchPortfolioData();
    }
  }, [user, fetchPortfolioData]);

  // Note: Filtering and pagination are now handled client-side
  // No need for useEffect to watch filter changes

  const refreshPortfolio = useCallback(() => fetchPortfolioData(), [fetchPortfolioData]);

  const value = {
    projects,
    metrics,
    transactions,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    setPagination,
    refreshPortfolio
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
