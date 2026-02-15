'use client';

import React, { useEffect, useRef } from 'react';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { useApplications } from '@/lib/queries/applications';
import { SearchBar } from '@/components/dashboard/search-bar';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { ResultsHeader } from '@/components/dashboard/results-header';
import { ResultsTable } from '@/components/dashboard/results-table';
import { ResultsGrid } from '@/components/dashboard/results-grid';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { StatisticsPanel } from '@/components/dashboard/statistics-panel';
import { Separator } from '@/components/ui/separator';
import { Search } from 'lucide-react';

export default function DashboardPage() {
  const {
    filters,
    page,
    pageSize,
    sortBy,
    viewMode,
    scrollPosition,
    setPage,
    setScrollPosition,
  } = useDashboardStore();

  // Build the query filters including sortBy
  const queryFilters = { ...filters, sortBy };

  // Check if we have any active search/filter
  const hasActiveFilters =
    !!filters.planningAuthority ||
    !!filters.sector ||
    !!filters.applicationType ||
    !!filters.decision ||
    !!filters.descriptionSearch ||
    !!filters.applicationNumber ||
    !!filters.latitude;

  const {
    data: response,
    isLoading,
    isFetching,
  } = useApplications(queryFilters, page, pageSize, hasActiveFilters);

  const applications = response?.data ?? [];
  const totalResults = response?.total ?? 0;
  const totalPages = Math.ceil(totalResults / pageSize);

  // Scroll restoration when returning from application detail
  const hasRestoredScroll = useRef(false);
  useEffect(() => {
    if (scrollPosition > 0 && !hasRestoredScroll.current) {
      // Small delay to ensure DOM is rendered
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
        hasRestoredScroll.current = true;
        // Reset after restoring so it doesn't re-trigger
        setScrollPosition(0);
      });
    }
  }, [scrollPosition, setScrollPosition]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col">
      {/* Search & Filter Section */}
      <div className="border-b border-border bg-background px-6 py-5">
        <div className="mx-auto max-w-7xl space-y-4">
          <SearchBar />
          <FilterBar />
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 px-6 py-5">
        <div className="mx-auto max-w-7xl space-y-4">
          {/* Results header: count, sort, view toggle */}
          {hasActiveFilters && (
            <>
              <ResultsHeader
                totalResults={totalResults}
                isLoading={isLoading}
              />
              <Separator />
            </>
          )}

          {/* Results content */}
          {!hasActiveFilters ? (
            <EmptyState
              icon={Search}
              title="Search planning applications"
              description="Select a planning authority or use the search bar to find planning applications across Ireland."
            />
          ) : applications.length === 0 && !isLoading ? (
            <EmptyState
              icon={Search}
              title="No results found"
              description="Try adjusting your filters or search terms to find planning applications."
            />
          ) : viewMode === 'table' ? (
            <ResultsTable
              applications={applications}
              isLoading={isLoading}
            />
          ) : viewMode === 'grid' ? (
            <ResultsGrid
              applications={applications}
              isLoading={isLoading}
            />
          ) : viewMode === 'map' ? (
            <div className="flex h-[500px] items-center justify-center rounded-lg border border-dashed border-border bg-background-subtle">
              <p className="text-sm text-foreground-muted">
                Map view will be implemented in Phase 3
              </p>
            </div>
          ) : viewMode === 'statistics' ? (
            applications.length > 0 ? (
              <StatisticsPanel applications={applications} />
            ) : (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border bg-background-subtle">
                <p className="text-sm text-foreground-muted">
                  Run a search to see statistics for your results.
                </p>
              </div>
            )
          ) : null}

          {/* Pagination */}
          {hasActiveFilters && totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="py-4"
            />
          )}
        </div>
      </div>
    </div>
  );
}
