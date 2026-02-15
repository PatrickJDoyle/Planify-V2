'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, List, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge, DecisionBadge } from '@/components/shared/status-badge';
import { FavoriteButton } from '@/components/shared/favorite-button';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/lib/queries/favorites';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { formatDate, calculateSubmissionDeadline } from '@/lib/utils/dates';
import { formatAddress, formatDescription } from '@/lib/utils/formatting';
import type { Application } from '@/lib/types/application';

type ViewMode = 'table' | 'grid';

export default function SavedPage() {
  const router = useRouter();
  const { setScrollPosition, setSelectedApplicationId } = useDashboardStore();
  const [view, setView] = useState<ViewMode>('table');
  const [page, setPage] = useState(1);
  const pageSize = 16;

  const { data, isLoading } = useFavorites(page, pageSize);
  const applications = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleClick = (app: Application) => {
    setScrollPosition(window.scrollY);
    setSelectedApplicationId(app.applicationId);
    router.push(`/applications/${app.applicationId}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Saved Projects</h1>
          <p className="text-sm text-foreground-muted">
            {isLoading ? 'Loading...' : `${total} saved application${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center rounded-md border border-border bg-background p-0.5">
          {([
            { mode: 'table' as ViewMode, icon: List, label: 'Table' },
            { mode: 'grid' as ViewMode, icon: LayoutGrid, label: 'Grid' },
          ]).map(({ mode, icon: Icon, label }) => (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setView(mode)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded transition-colors',
                    view === mode
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

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && applications.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title="No saved projects"
          description="Applications you save will appear here. Use the bookmark icon on any application to save it."
        />
      )}

      {/* Table View */}
      {!isLoading && applications.length > 0 && view === 'table' && (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background-subtle">
                  <th className="w-10 px-3 py-3 text-center" />
                  <th className="px-3 py-3 text-left font-medium text-foreground-muted">Status</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground-muted">Authority</th>
                  <th className="min-w-[180px] px-3 py-3 text-left font-medium text-foreground-muted">Address</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground-muted">Received</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground-muted">Submissions By</th>
                  <th className="px-3 py-3 text-left font-medium text-foreground-muted">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.map((app) => (
                  <tr
                    key={app.applicationId}
                    onClick={() => handleClick(app)}
                    className="cursor-pointer transition-colors hover:bg-background-subtle"
                  >
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <FavoriteButton applicationId={app.applicationId} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-1.5">
                        <StatusBadge displayStatus={app.displayStatus} statusCategory={app.statusCategory} />
                        <DecisionBadge decision={app.decision} displayDecision={app.displayDecision} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-foreground">{app.planningAuthority}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {formatAddress(app.formattedAddress ?? app.developmentAddress, 45)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-foreground-muted">
                      {formatDate(app.receivedDate)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-foreground-muted">
                      {calculateSubmissionDeadline(app.receivedDate)}
                    </td>
                    <td className="px-3 py-2.5 text-foreground-muted">
                      {app.decisionDate ? formatDate(app.decisionDate) : formatDate(app.decisionDueDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {!isLoading && applications.length > 0 && view === 'grid' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {applications.map((app) => (
            <Card
              key={app.applicationId}
              className="group cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => handleClick(app)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge displayStatus={app.displayStatus} statusCategory={app.statusCategory} />
                      <DecisionBadge decision={app.decision} displayDecision={app.displayDecision} />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{app.planningAuthority}</h3>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <FavoriteButton applicationId={app.applicationId} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="font-medium text-foreground">
                  {formatAddress(app.formattedAddress ?? app.developmentAddress, 50)}
                </p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {formatDescription(app.formattedDescription ?? app.developmentDescription, 100)}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border-muted pt-3">
                  <div>
                    <span className="text-xs text-foreground-subtle">Received</span>
                    <p className="text-sm text-foreground">{formatDate(app.receivedDate)}</p>
                  </div>
                  <div>
                    <span className="text-xs text-foreground-subtle">Submissions By</span>
                    <p className="text-sm text-foreground">{calculateSubmissionDeadline(app.receivedDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
