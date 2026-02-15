'use client';

import React, { useState } from 'react';
import { ChevronDown, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { PLANNING_AUTHORITIES, SECTORS, APPLICATION_TYPES } from '@/lib/utils/constants';

interface FilterOption {
  id: string;
  name: string;
}

interface FilterDropdownProps {
  label: string;
  options: readonly FilterOption[];
  value: string | undefined;
  onSelect: (value: string | undefined) => void;
}

function FilterDropdown({ label, options, value, onSelect }: FilterDropdownProps) {
  const selectedOption = options.find((o) => o.id === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={value ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
        >
          {selectedOption ? selectedOption.name : label}
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[320px] overflow-y-auto scrollbar-thin">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {value && (
          <>
            <DropdownMenuItem onClick={() => onSelect(undefined)}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Clear filter
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={value === option.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-200' : ''}
          >
            {option.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterBar() {
  const { filters, setFilters, resetFilters } = useDashboardStore();

  const activeFilterCount = [
    filters.planningAuthority,
    filters.sector,
    filters.applicationType,
    filters.decision,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      {/* Filter chips row */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Planning Authority"
          options={PLANNING_AUTHORITIES}
          value={filters.planningAuthority}
          onSelect={(v) => setFilters({ planningAuthority: v })}
        />
        <FilterDropdown
          label="Sector"
          options={SECTORS}
          value={filters.sector}
          onSelect={(v) => setFilters({ sector: v })}
        />
        <FilterDropdown
          label="Type"
          options={APPLICATION_TYPES}
          value={filters.applicationType}
          onSelect={(v) => setFilters({ applicationType: v })}
        />

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="gap-1.5 text-foreground-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active filters pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-foreground-muted">Active filters:</span>
          {filters.planningAuthority && (
            <Badge variant="outline" className="gap-1 pr-1">
              {filters.planningAuthority}
              <button
                onClick={() => setFilters({ planningAuthority: undefined })}
                className="ml-0.5 rounded-full p-0.5 hover:bg-background-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.sector && (
            <Badge variant="outline" className="gap-1 pr-1">
              {SECTORS.find((s) => s.id === filters.sector)?.name ?? filters.sector}
              <button
                onClick={() => setFilters({ sector: undefined })}
                className="ml-0.5 rounded-full p-0.5 hover:bg-background-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.applicationType && (
            <Badge variant="outline" className="gap-1 pr-1">
              {APPLICATION_TYPES.find((t) => t.id === filters.applicationType)?.name ?? filters.applicationType}
              <button
                onClick={() => setFilters({ applicationType: undefined })}
                className="ml-0.5 rounded-full p-0.5 hover:bg-background-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
