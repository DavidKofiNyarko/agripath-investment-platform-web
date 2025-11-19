"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { createClient } from "@/app/utils/supabase/client";

export interface ProjectUpdate {
  id: string;
  project_id: string;
  update_text: string;
  created_at: string;
  created_by: string | null;
  title: string;
  description: string;
  image_url: string[] | null;
  update_type: "Progress" | "Milestone" | "Issue" | "Completion";
  status: "Draft" | "Published" | "Archived";
  updated_at: string;
  project_name?: string;
  project_type?: string;
  farm_location?: string;
}

interface UpdateRow {
  id: string;
  project_id: string;
  update_text: string;
  created_at: string;
  created_by: string | null;
  title: string;
  description: string;
  image_url: string[] | null;
  update_type: string;
  status: string;
  updated_at: string;
  projects:
    | {
        project_name: string | null;
        project_type: string | null;
        farm_location: string | null;
      }
    | {
        project_name: string | null;
        project_type: string | null;
        farm_location: string | null;
      }[]
    | null;
}

interface UpdateFilters {
  search: string;
  updateType: string;
  projectId: string;
  dateRange: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface UpdatesContextType {
  updates: ProjectUpdate[];
  loading: boolean;
  error: string | null;
  filters: UpdateFilters;
  setFilters: (filters: UpdateFilters) => void;
  refreshUpdates: () => Promise<void>;
  pagination: Pagination;
  setPagination: React.Dispatch<React.SetStateAction<Pagination>>;
}

const UpdatesContext = createContext<UpdatesContextType | undefined>(undefined);

export const useUpdates = () => {
  const context = useContext(UpdatesContext);
  if (context === undefined) {
    throw new Error("useUpdates must be used within an UpdatesProvider");
  }
  return context;
};

export const UpdatesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UpdateFilters>({
    search: "",
    updateType: "All",
    projectId: "All",
    dateRange: "All",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 9,
  });
  const supabase = createClient();

  const fetchUpdates = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If no user, set loading to false immediately
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUpdates([]);
      setLoading(false);
      return;
    }

    try {
      // Build query with filters
      let query = supabase
        .from("project_updates")
        .select(
          `
          id,
          project_id,
          update_text,
          created_at,
          created_by,
          title,
          description,
          image_url,
          update_type,
          status,
          updated_at,
          projects!inner(
            project_name,
            project_type,
            farm_location
          )
        `,
          { count: "exact" }
        )
        .eq("status", "Published") // Only show published updates
        .order("created_at", { ascending: false });

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,update_text.ilike.%${filters.search}%`
        );
      }

      // Apply update type filter
      if (filters.updateType !== "All") {
        query = query.eq("update_type", filters.updateType);
      }

      // Apply project filter
      if (filters.projectId !== "All") {
        query = query.eq("project_id", filters.projectId);
      }

      // Apply date range filter
      if (filters.dateRange !== "All") {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case "Today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            break;
          case "This Week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "This Month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case "Last 3 Months":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth() - 3,
              now.getDate()
            );
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte("created_at", startDate.toISOString());
      }

      // Apply pagination
      const from = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const to = from + pagination.itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw new Error(`Failed to fetch updates: ${queryError.message}`);
      }

      // Format updates data
      const formattedUpdates =
        data?.map((item: UpdateRow) => ({
          id: item.id,
          project_id: item.project_id,
          update_text: item.update_text,
          created_at: item.created_at,
          created_by: item.created_by,
          title: item.title,
          description: item.description,
          image_url: item.image_url,
          update_type: item.update_type as
            | "Progress"
            | "Milestone"
            | "Issue"
            | "Completion",
          status: item.status as "Draft" | "Published" | "Archived",
          updated_at: item.updated_at,
          project_name: Array.isArray(item.projects)
            ? item.projects[0]?.project_name || "Unknown Project"
            : item.projects?.project_name || "Unknown Project",
          project_type: Array.isArray(item.projects)
            ? item.projects[0]?.project_type || "CROP"
            : item.projects?.project_type || "CROP",
          farm_location: Array.isArray(item.projects)
            ? item.projects[0]?.farm_location || "Unknown Location"
            : item.projects?.farm_location || "Unknown Location",
        })) || [];

      setUpdates(formattedUpdates);

      // Update pagination
      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);

      setPagination((prev) => ({
        ...prev,
        totalPages,
        totalItems,
      }));
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.itemsPerPage, supabase]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  const refreshUpdates = useCallback(() => fetchUpdates(), [fetchUpdates]);

  const value = {
    updates,
    loading,
    error,
    filters,
    setFilters,
    refreshUpdates,
    pagination,
    setPagination,
  };

  return (
    <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>
  );
};
