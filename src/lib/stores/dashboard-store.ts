import { create } from 'zustand';
import type { DashboardFilters, SortOption, ViewMode } from '@/lib/types/filters';

interface DashboardStore {
  // Filters
  filters: DashboardFilters;
  searchMode: 'authority' | 'address';
  setFilters: (filters: Partial<DashboardFilters>) => void;
  setSearchMode: (mode: 'authority' | 'address') => void;
  resetFilters: () => void;

  // View state
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Pagination
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Scroll preservation
  scrollPosition: number;
  setScrollPosition: (pos: number) => void;

  // Sort
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;

  // Selected application (for highlight on return)
  selectedApplicationId: number | null;
  setSelectedApplicationId: (id: number | null) => void;
}

const DEFAULT_FILTERS: DashboardFilters = {};

export const useDashboardStore = create<DashboardStore>((set) => ({
  filters: DEFAULT_FILTERS,
  searchMode: 'authority',
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  setSearchMode: (mode) => set({ searchMode: mode }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS, page: 1 }),

  viewMode: 'table',
  setViewMode: (mode) => set({ viewMode: mode }),

  page: 1,
  pageSize: 20,
  setPage: (page) => set({ page }),
  setPageSize: (size) => set({ pageSize: size, page: 1 }),

  scrollPosition: 0,
  setScrollPosition: (pos) => set({ scrollPosition: pos }),

  sortBy: 'received_newest',
  setSortBy: (sort) => set({ sortBy: sort, page: 1 }),

  selectedApplicationId: null,
  setSelectedApplicationId: (id) => set({ selectedApplicationId: id }),
}));
