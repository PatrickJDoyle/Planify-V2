'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, MailOpen, Star, Archive, CheckCheck,
  MapPin, Building2, Globe, ChevronDown, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import { formatAddress, formatDescription } from '@/lib/utils/formatting';
import {
  useInbox, useInboxStats, useMarkRead, useStarAlert,
  useArchiveAlert, useBulkUpdateAlerts, useMarkAllRead,
} from '@/lib/queries/alerts';
import type { InboxFilters, InboxAlert, AlertScope, BulkAction } from '@/lib/types/alerts';

type ViewFilter = 'all' | 'unread' | 'starred' | 'archived';

const scopeIcon: Record<AlertScope, React.ElementType> = {
  radius: MapPin,
  authority: Building2,
  nationwide: Globe,
};

const scopeColor: Record<AlertScope, string> = {
  radius: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  authority: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  nationwide: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function InboxPage() {
  const router = useRouter();
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const pageSize = 20;

  const filters: InboxFilters = useMemo(() => {
    const f: InboxFilters = { page, pageSize, sortBy: 'date', sortOrder: 'desc' };
    if (viewFilter === 'unread') f.read = false;
    if (viewFilter === 'starred') f.starred = true;
    if (viewFilter === 'archived') f.archived = true;
    return f;
  }, [viewFilter, page]);

  const { data: inboxData, isLoading } = useInbox(filters);
  const { data: stats } = useInboxStats();
  const markRead = useMarkRead();
  const starAlert = useStarAlert();
  const archiveAlert = useArchiveAlert();
  const bulkUpdate = useBulkUpdateAlerts();
  const markAllRead = useMarkAllRead();

  const alerts = inboxData?.alerts ?? [];
  const totalPages = inboxData?.totalPages ?? 1;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === alerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(alerts.map((a) => a.id)));
    }
  };

  const handleBulk = (action: BulkAction) => {
    bulkUpdate.mutate({ ids: Array.from(selectedIds), action });
    setSelectedIds(new Set());
  };

  const handleRowClick = (alert: InboxAlert) => {
    if (!alert.read) {
      markRead.mutate({ alertId: alert.id, read: true });
    }
    router.push(`/applications/${alert.applicationId}`);
  };

  const viewFilters: { key: ViewFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: stats?.total },
    { key: 'unread', label: 'Unread', count: stats?.unread },
    { key: 'starred', label: 'Starred', count: stats?.starred },
    { key: 'archived', label: 'Archived', count: stats?.archived },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
          <p className="text-sm text-foreground-muted">
            {stats?.unread ? `${stats.unread} unread` : 'No unread alerts'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => markAllRead.mutate()}
            disabled={!stats?.unread}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* View Filters */}
      <div className="flex items-center gap-1 border-b border-border pb-2">
        {viewFilters.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setViewFilter(key); setPage(1); }}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              viewFilter === key
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground-muted hover:bg-background-muted hover:text-foreground',
            )}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-background-subtle px-3 py-2">
          <span className="text-xs text-foreground-muted">{selectedIds.size} selected</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulk('read')}>
            Mark Read
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulk('unread')}>
            Mark Unread
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulk('star')}>
            Star
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulk('archive')}>
            Archive
          </Button>
          <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && alerts.length === 0 && (
        <EmptyState
          icon={Mail}
          title={viewFilter === 'all' ? 'Inbox is empty' : `No ${viewFilter} alerts`}
          description="When your alerts trigger, matching applications will appear here."
        />
      )}

      {/* Alert Rows */}
      {!isLoading && alerts.length > 0 && (
        <div className="space-y-0 overflow-hidden rounded-lg border border-border">
          {/* Select all header */}
          <div className="flex items-center gap-3 border-b border-border bg-background-subtle px-3 py-2">
            <input
              type="checkbox"
              checked={selectedIds.size === alerts.length && alerts.length > 0}
              onChange={selectAll}
              className="h-3.5 w-3.5 rounded border-border accent-primary"
            />
            <span className="text-xs text-foreground-muted">Select all</span>
          </div>

          {alerts.map((alert) => (
            <InboxRow
              key={alert.id}
              alert={alert}
              selected={selectedIds.has(alert.id)}
              onToggleSelect={() => toggleSelect(alert.id)}
              onClick={() => handleRowClick(alert)}
              onMarkRead={(read) => markRead.mutate({ alertId: alert.id, read })}
              onStar={(starred) => starAlert.mutate({ alertId: alert.id, starred })}
              onArchive={(archived) => archiveAlert.mutate({ alertId: alert.id, archived })}
            />
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

interface InboxRowProps {
  alert: InboxAlert;
  selected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  onMarkRead: (read: boolean) => void;
  onStar: (starred: boolean) => void;
  onArchive: (archived: boolean) => void;
}

function InboxRow({ alert, selected, onToggleSelect, onClick, onMarkRead, onStar, onArchive }: InboxRowProps) {
  const ScopeIcon = scopeIcon[alert.alertScope] ?? MapPin;

  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-border-muted px-3 py-2.5 transition-colors last:border-b-0',
        !alert.read ? 'bg-brand-50/30 dark:bg-brand-900/10' : 'hover:bg-background-subtle',
        selected && 'bg-brand-50/50 dark:bg-brand-900/20',
      )}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
        className="h-3.5 w-3.5 shrink-0 rounded border-border accent-primary"
      />

      {/* Star */}
      <button
        onClick={(e) => { e.stopPropagation(); onStar(!alert.starred); }}
        className="shrink-0"
      >
        <Star
          className={cn(
            'h-4 w-4 transition-colors',
            alert.starred ? 'fill-amber-400 text-amber-400' : 'text-foreground-subtle hover:text-amber-400',
          )}
        />
      </button>

      {/* Content — clickable */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2">
          {/* Scope badge */}
          <span className={cn('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium', scopeColor[alert.alertScope])}>
            <ScopeIcon className="h-3 w-3" />
            {alert.alertScope}
          </span>
          {/* App number */}
          <span className={cn('text-xs', !alert.read ? 'font-semibold text-foreground' : 'text-foreground-muted')}>
            {alert.ApplicationNumber}
          </span>
          {/* Authority */}
          {alert.planningAuthority && (
            <span className="hidden text-xs text-foreground-subtle sm:inline">
              {alert.planningAuthority}
            </span>
          )}
          {/* Distance */}
          {alert.distance > 0 && (
            <span className="text-xs text-foreground-subtle">
              {alert.distance < 1000
                ? `${Math.round(alert.distance)}m`
                : `${(alert.distance / 1000).toFixed(1)}km`}
            </span>
          )}
        </div>

        <p className={cn(
          'mt-0.5 truncate text-xs',
          !alert.read ? 'font-medium text-foreground' : 'text-foreground-muted',
        )}>
          {formatAddress(alert.DevelopmentAddress, 60)}
        </p>

        <p className="mt-0.5 line-clamp-1 text-xs text-foreground-subtle">
          {alert.applications?.DevelopmentDescription}
        </p>

        {/* Keywords */}
        {alert.matchedKeywords?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {alert.matchedKeywords.slice(0, 3).map((kw) => (
              <span
                key={kw}
                className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200"
              >
                {kw}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right side — time + actions */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Decision badge */}
        {alert.applications?.Decision && alert.applications.Decision !== 'N/A' && (
          <Badge
            variant={
              alert.applications.Decision.toLowerCase().includes('grant') ? 'granted' :
              alert.applications.Decision.toLowerCase().includes('refus') ? 'refused' : 'secondary'
            }
            className="text-[10px]"
          >
            {alert.applications.Decision}
          </Badge>
        )}

        <span className="whitespace-nowrap text-xs text-foreground-subtle">
          {formatRelativeTime(alert.sentAt)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(!alert.read); }}
            className="rounded p-1 text-foreground-subtle transition-colors hover:bg-background-muted hover:text-foreground"
            title={alert.read ? 'Mark unread' : 'Mark read'}
          >
            {alert.read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(!alert.archived); }}
            className="rounded p-1 text-foreground-subtle transition-colors hover:bg-background-muted hover:text-foreground"
            title={alert.archived ? 'Unarchive' : 'Archive'}
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
