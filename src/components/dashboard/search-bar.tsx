'use client';

import React, { useState, useCallback } from 'react';
import { Search, X, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useDashboardStore } from '@/lib/stores/dashboard-store';

type SearchMode = 'address' | 'reference';

export function SearchBar() {
  const { setFilters, resetFilters, setSearchMode } = useDashboardStore();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('address');

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;

    if (mode === 'reference') {
      setFilters({ applicationNumber: query.trim() });
      setSearchMode('authority');
    } else {
      // For address search, we set the description search
      setFilters({ descriptionSearch: query.trim() });
      setSearchMode('authority');
    }
  }, [query, mode, setFilters, setSearchMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setQuery('');
    resetFilters();
  };

  return (
    <div className="flex items-center gap-2">
      {/* Mode toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={mode === 'reference' ? 'default' : 'outline'}
            size="icon-sm"
            onClick={() => setMode(mode === 'address' ? 'reference' : 'address')}
            className="shrink-0"
          >
            <Hash className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {mode === 'reference'
            ? 'Searching by reference number'
            : 'Click to search by reference number'}
        </TooltipContent>
      </Tooltip>

      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-subtle" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'reference'
              ? 'Search by application reference (e.g. SD22A/0344)'
              : 'Search planning applications...'
          }
          className={cn(
            'h-10 pl-10 pr-10',
            query && 'pr-20',
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-foreground-subtle"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSearch}
          className="absolute right-1 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-primary"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
