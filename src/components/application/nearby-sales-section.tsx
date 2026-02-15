'use client';

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/dates';
import { formatAddress } from '@/lib/utils/formatting';
import type { PropertySale } from '@/lib/api/property';

interface NearbySalesSectionProps {
  sales?: PropertySale[];
  isLoading: boolean;
}

const PAGE_SIZE = 10;

export function NearbySalesSection({ sales, isLoading }: NearbySalesSectionProps) {
  const [sortField, setSortField] = useState<'distance' | 'saleDate'>('distance');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  if (isLoading) return <SalesSkeleton />;

  if (!sales || sales.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-foreground-subtle" />
            <p className="mt-2 text-sm text-foreground-muted">No property sales found within 1km</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...sales].sort((a, b) => {
    if (sortField === 'distance') {
      const diff = a.distanceMeters - b.distanceMeters;
      return sortDir === 'asc' ? diff : -diff;
    }
    const diff = new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime();
    return sortDir === 'desc' ? -diff : diff;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: 'distance' | 'saleDate') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'distance' ? 'asc' : 'desc');
    }
    setPage(0);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Nearby Property Sales</h3>
            <p className="text-xs text-foreground-muted">{sales.length} sales within 1km</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-foreground-muted">Sort:</span>
            <Button
              variant={sortField === 'distance' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => toggleSort('distance')}
            >
              Distance {sortField === 'distance' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
            </Button>
            <Button
              variant={sortField === 'saleDate' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => toggleSort('saleDate')}
            >
              Date {sortField === 'saleDate' && (sortDir === 'desc' ? '\u2193' : '\u2191')}
            </Button>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Address</th>
                <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Sale Date</th>
                <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Price</th>
                <th className="pb-2 text-xs font-medium text-foreground-muted">Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {paginated.map((sale) => (
                <tr key={sale.id} className="transition-colors hover:bg-background-subtle">
                  <td className="max-w-[200px] truncate py-2 pr-3 text-xs text-foreground">
                    {formatAddress(sale.address, 40)}
                  </td>
                  <td className="py-2 pr-3 text-xs text-foreground-muted">{formatDate(sale.saleDate)}</td>
                  <td className="py-2 pr-3 text-xs font-medium text-emerald-600">
                    &euro;{sale.price.toLocaleString()}
                  </td>
                  <td className="py-2 text-xs text-foreground-muted">{sale.distanceMeters}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-foreground-muted">
              Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sales.length)} of {sales.length}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SalesSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-5 w-36" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
