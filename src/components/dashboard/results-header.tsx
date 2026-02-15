'use client';

import React from 'react';
import { LayoutGrid, List, Map as MapIcon, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { SORT_OPTIONS } from '@/lib/utils/constants';
import type { ViewMode, SortOption } from '@/lib/types/filters';

interface ResultsHeaderProps {
  totalResults: number;
  isLoading: boolean;
}

const viewOptions: { mode: ViewMode; icon: React.ElementType; label: string }[] = [
  { mode: 'table', icon: List, label: 'Table' },
  { mode: 'grid', icon: LayoutGrid, label: 'Grid' },
  { mode: 'map', icon: MapIcon, label: 'Map' },
  { mode: 'statistics', icon: BarChart3, label: 'Statistics' },
];

export function ResultsHeader({ totalResults, isLoading }: ResultsHeaderProps) {
  const { viewMode, setViewMode, sortBy, setSortBy } = useDashboardStore();

  const currentSort = SORT_OPTIONS.find((s) => s.id === sortBy);

  return (
    <div className="flex items-center justify-between">
      {/* Left: result count */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-foreground">
          {isLoading ? (
            <span className="text-foreground-muted">Loading...</span>
          ) : (
            <>
              <span className="font-semibold">{totalResults.toLocaleString()}</span>
              <span className="text-foreground-muted"> results</span>
            </>
          )}
        </p>
      </div>

      {/* Right: sort + view toggle */}
      <div className="flex items-center gap-2">
        {/* Sort dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-foreground-muted">
              Sort: {currentSort?.name ?? 'Newest'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onClick={() => setSortBy(option.id as SortOption)}
                className={sortBy === option.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200' : ''}
              >
                {option.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        {/* View mode toggle */}
        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          {viewOptions.map(({ mode, icon: Icon, label }) => (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded transition-colors',
                    viewMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground-muted hover:text-foreground',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );
}
