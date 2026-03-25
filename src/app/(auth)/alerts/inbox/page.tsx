'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Inbox,
  Star,
  Archive,
  Mail,
  MailOpen,
  MapPin,
  Building2,
  Globe,
  Tag,
  Filter,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  useInbox,
  useInboxStats,
  useMarkRead,
  useStarAlert,
  useArchiveAlert,
  useMarkAllRead,
  useBulkUpdateAlerts,
} from '@/lib/queries/alerts';
import { useUserProfile } from '@/lib/queries/user';
import type { InboxFilters, AlertScope, InboxAlert } from '@/lib/types/alerts';
import { cn } from '@/lib/utils';

const SCOPE_CONFIG: Record<AlertScope, { icon: React.ElementType; label: string; color: string }> =
  {
    radius: { icon: MapPin, label: 'Radius', color: 'text-blue-500' },
    authority: { icon: Building2, label: 'Authority', color: 'text-violet-500' },
    nationwide: { icon: Globe, label: 'Nationwide', color: 'text-emerald-500' },
  };

function InboxItem({
  item,
  selected,
  onSelect,
  onMarkRead,
  onStar,
  onArchive,
}: {
  item: InboxAlert;
  selected: boolean;
  onSelect: (id: number, v: boolean) => void;
  onMarkRead: (id: number, read: boolean) => void;
  onStar: (id: number, starred: boolean) => void;
  onArchive: (id: number, archived: boolean) => void;
}) {
  const router = useRouter();
  const scope = (item.alertScope ?? 'radius') as AlertScope;
  const ScopeIcon = SCOPE_CONFIG[scope]?.icon ?? MapPin;
  const scopeColor = SCOPE_CONFIG[scope]?.color ?? 'text-foreground-muted';

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer items-start gap-3 border-b border-border px-5 py-4 transition-colors last:border-b-0',
        item.read ? 'bg-background' : 'bg-brand-500/[0.03]',
        selected && 'bg-brand-500/5',
      )}
      onClick={() => {
        if (!item.read) onMarkRead(item.id, true);
        router.push(`/applications/${item.applicationId}`);
      }}
    >
      {/* Unread dot */}
      {!item.read && (
        <div className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-500" />
      )}

      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onSelect(item.id, e.target.checked)}
        className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-brand-500"
      />

      {/* Scope icon */}
      <div className="mt-0.5 shrink-0">
        <ScopeIcon className={cn('h-3.5 w-3.5', scopeColor)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <span
            className={cn(
              'text-sm leading-snug',
              item.read ? 'font-medium text-foreground' : 'font-semibold text-foreground',
            )}
          >
            {item.ApplicationNumber}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {item.ApplicationStatus && (
              <StatusBadge displayStatus={item.ApplicationStatus} />
            )}
            <span className="text-[11px] text-foreground-subtle">
              {new Date(item.sentAt).toLocaleDateString('en-IE', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        </div>
        <p className="mt-0.5 text-xs text-foreground-muted line-clamp-1">
          {item.DevelopmentAddress}
        </p>
        <p className="mt-0.5 text-xs text-foreground-subtle line-clamp-1">
          {item.applications?.DevelopmentDescription}
        </p>
        {item.matchedKeywords?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.matchedKeywords.slice(0, 3).map((kw) => (
              <Badge key={kw} variant="outline" className="flex h-4 items-center gap-0.5 px-1.5 py-0 text-[10px]">
                <Tag className="h-2.5 w-2.5" />
                {kw}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions — visible on hover */}
      <div
        className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 text-foreground-subtle hover:text-amber-500"
          onClick={() => onStar(item.id, !item.starred)}
        >
          <Star className={cn('h-3.5 w-3.5', item.starred && 'fill-amber-400 text-amber-400')} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 text-foreground-subtle hover:text-foreground"
          onClick={() => onMarkRead(item.id, !item.read)}
        >
          {item.read ? <Mail className="h-3.5 w-3.5" /> : <MailOpen className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 text-foreground-subtle hover:text-foreground"
          onClick={() => onArchive(item.id, !item.archived)}
        >
          <Archive className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 text-foreground-subtle hover:text-brand-500"
          onClick={() => router.push(`/applications/${item.applicationId}`)}
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const router = useRouter();
  const { tier, isLoading: profileLoading } = useUserProfile();
  const canAccessAlerts = tier !== 'free';
  const [filters, setFilters] = useState<InboxFilters>({ page: 1, pageSize: 20 });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');

  const {
    data,
    isLoading,
    error: inboxError,
    refetch: refetchInbox,
    isFetching: isRefetchingInbox,
  } = useInbox(
    {
      ...filters,
      read: activeTab === 'unread' ? false : undefined,
      starred: activeTab === 'starred' ? true : undefined,
      archived: activeTab === 'archived' ? true : undefined,
    },
    { enabled: canAccessAlerts },
  );
  const {
    data: stats,
    error: statsError,
    refetch: refetchStats,
    isFetching: isRefetchingStats,
  } = useInboxStats({ enabled: canAccessAlerts });
  const markRead = useMarkRead();
  const star = useStarAlert();
  const archive = useArchiveAlert();
  const markAllRead = useMarkAllRead();
  const bulkUpdate = useBulkUpdateAlerts();
  const mutationError =
    markRead.error ??
    star.error ??
    archive.error ??
    markAllRead.error ??
    bulkUpdate.error;
  const hasQueryError = Boolean(inboxError || statsError);

  const items = data?.alerts ?? [];
  const totalPages = data?.totalPages ?? 1;
  const page = filters.page ?? 1;

  const toggleSelect = (id: number, val: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((i) => i.id)));
    }
  };

  const handleBulk = (action: Parameters<typeof bulkUpdate.mutate>[0]['action']) => {
    bulkUpdate.mutate({ ids: Array.from(selected), action });
    setSelected(new Set());
  };

  const TABS = [
    { id: 'all' as const, label: 'All', count: stats?.total },
    { id: 'unread' as const, label: 'Unread', count: stats?.unread },
    { id: 'starred' as const, label: 'Starred', count: stats?.starred },
    { id: 'archived' as const, label: 'Archived', count: stats?.archived },
  ];

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-10 w-56 rounded-md" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!canAccessAlerts) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            New applications matching your alerts
          </p>
        </div>
        <Card className="border-brand-500/30 bg-brand-500/5">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-brand-500/15 p-2">
                <Lock className="h-4 w-4 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Inbox is available on paid plans</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Upgrade to Personal or Enterprise to access alert inbox workflows.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-brand-500 hover:bg-brand-600"
              onClick={() => router.push('/billing/plans')}
            >
              View plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Inbox</h1>
          <p className="mt-0.5 text-sm text-foreground-muted">New applications matching your alerts</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || !stats?.unread}
          className="gap-1.5"
        >
          <MailOpen className="h-3.5 w-3.5" />
          Mark all read
        </Button>
      </div>

      {hasQueryError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <p className="text-sm text-destructive">
              {(inboxError as Error)?.message ||
                (statsError as Error)?.message ||
                'Failed to load inbox.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                void refetchInbox();
                void refetchStats();
              }}
              disabled={isRefetchingInbox || isRefetchingStats}
            >
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5',
                  (isRefetchingInbox || isRefetchingStats) && 'animate-spin',
                )}
              />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {mutationError && !hasQueryError && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {(mutationError as Error).message || 'Failed to update inbox item.'}
        </div>
      )}

      {/* Stat pills */}
      {!hasQueryError && stats?.byScope && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byScope).map(([scope, count]) => {
            if (!count) return null;
            const cfg = SCOPE_CONFIG[scope as AlertScope];
            if (!cfg) return null;
            const Icon = cfg.icon;
            return (
              <div
                key={scope}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground-muted"
              >
                <Icon className={cn('h-3 w-3', cfg.color)} />
                {count} {cfg.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      {!hasQueryError && (
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background-subtle p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setFilters((f) => ({ ...f, page: 1 }));
              setSelected(new Set());
            }}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            {tab.label}
            {!!tab.count && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0 text-[10px] font-semibold',
                  activeTab === tab.id ? 'bg-brand-500 text-white' : 'bg-background-muted',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      )}

      {/* Bulk toolbar */}
      {!hasQueryError && selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-brand-500/30 bg-brand-500/5 px-4 py-2.5">
          <span className="text-xs font-medium text-foreground-muted">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleBulk('read')}>
              <MailOpen className="h-3 w-3" /> Mark read
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleBulk('star')}>
              <Star className="h-3 w-3" /> Star
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleBulk('archive')}>
              <Archive className="h-3 w-3" /> Archive
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      {!hasQueryError && (
      <Card className="overflow-hidden p-0">
        {/* Select all bar */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-2.5">
          <input
            type="checkbox"
            checked={selected.size > 0 && selected.size === items.length}
            ref={(el) => {
              if (el) el.indeterminate = selected.size > 0 && selected.size < items.length;
            }}
            onChange={selectAll}
            className="h-3.5 w-3.5 cursor-pointer rounded accent-brand-500"
          />
          <span className="text-xs text-foreground-muted">
            {items.length > 0 ? `${items.length} item${items.length !== 1 ? 's' : ''}` : ''}
          </span>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 px-5 py-4">
                <Skeleton className="mt-1 h-3.5 w-3.5 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && items.length === 0 && (
          <div className="py-12">
            <EmptyState
              icon={Inbox}
              title="Inbox is empty"
              description="When new planning applications match your alerts, they'll appear here."
            />
          </div>
        )}

        {/* Items */}
        {!isLoading && items.length > 0 && (
          <div>
            {items.map((item) => (
              <InboxItem
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                onMarkRead={(id, read) => markRead.mutate({ alertId: id, read })}
                onStar={(id, starred) => star.mutate({ alertId: id, starred })}
                onArchive={(id, archived) => archive.mutate({ alertId: id, archived })}
              />
            ))}
          </div>
        )}
      </Card>
      )}

      {/* Pagination */}
      {!hasQueryError && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground-muted">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
              className="gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
