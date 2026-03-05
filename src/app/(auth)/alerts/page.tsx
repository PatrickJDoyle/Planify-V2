'use client';

import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  MapPin,
  Building2,
  Globe,
  Edit3,
  MoreHorizontal,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/shared/empty-state';
import { AlertWizard } from '@/components/alerts/alert-wizard';
import { PaywallModal } from '@/components/billing/paywall-modal';
import { useAlerts, useDeleteAlert } from '@/lib/queries/alerts';
import { useUserProfile } from '@/lib/queries/user';
import { useRouter } from 'next/navigation';
import type { Alert, AlertScope, AlertType } from '@/lib/types/alerts';
import { cn } from '@/lib/utils';

const SCOPE_CONFIG: Record<AlertScope, { icon: React.ElementType; label: string; color: string }> = {
  radius: {
    icon: MapPin,
    label: 'Radius',
    color: 'bg-blue-500/10 text-blue-600',
  },
  authority: {
    icon: Building2,
    label: 'Council Area',
    color: 'bg-violet-500/10 text-violet-600',
  },
  nationwide: {
    icon: Globe,
    label: 'Nationwide',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
};

const TYPE_LABELS: Record<AlertType, string> = {
  new_application: 'New applications',
  status_update: 'Status updates',
};

function AlertCard({ alert, onDelete }: { alert: Alert; onDelete: (id: number) => void }) {
  const scope = (alert.scope ?? 'radius') as AlertScope;
  const { icon: Icon, label, color } = SCOPE_CONFIG[scope];

  return (
    <Card className="transition-shadow hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background-muted">
              <Icon className="h-4 w-4 text-foreground-muted" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {TYPE_LABELS[alert.alertType] ?? alert.alertType}
                </span>
                <Badge className={cn('text-xs', color)}>{label}</Badge>
              </div>
              <p className="mt-1 text-xs text-foreground-muted">
                {[
                  alert.planningAuthority,
                  alert.address,
                  alert.radius && `${alert.radius < 1000 ? `${alert.radius}m` : `${alert.radius / 1000}km`} radius`,
                  alert.applicationId && `App #${alert.applicationId}`,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'All applications'}
              </p>
              {alert.createdAt && (
                <p className="mt-1.5 text-[11px] text-foreground-subtle">
                  Created{' '}
                  {new Date(alert.createdAt).toLocaleDateString('en-IE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-foreground-muted hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => onDelete(alert.id)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

function UsageBar({ used, max, label }: { used: number; max: number | null; label: string }) {
  const pct = max === null ? 0 : Math.min((used / max) * 100, 100);
  const isUnlimited = max === null;
  const isWarning = !isUnlimited && pct > 70;
  const isFull = !isUnlimited && pct >= 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground-muted">{label}</span>
        <span className={cn('text-xs font-medium', isFull ? 'text-destructive' : isWarning ? 'text-amber-500' : 'text-foreground-muted')}>
          {isUnlimited ? 'Unlimited' : `${used} / ${max}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 overflow-hidden rounded-full bg-background-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isFull ? 'bg-destructive' : isWarning ? 'bg-amber-500' : 'bg-brand-500',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const router = useRouter();
  const { data: alerts, isLoading } = useAlerts();
  const deleteAlert = useDeleteAlert();
  const { limits, isPaid, tier } = useUserProfile();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const alertCount = alerts?.length ?? 0;
  const maxAlerts = limits.maxAlerts;
  const atLimit = maxAlerts !== null && alertCount >= maxAlerts;

  const handleNewAlert = () => {
    if (!isPaid) {
      setPaywallOpen(true);
      return;
    }
    if (atLimit) {
      setPaywallOpen(true);
      return;
    }
    setWizardOpen(true);
  };

  return (
    <>
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Alerts</h1>
            <p className="mt-0.5 text-sm text-foreground-muted">
              Get notified about new planning activity matching your criteria
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => router.push('/alerts/inbox')}
            >
              <Inbox className="h-3.5 w-3.5" />
              Inbox
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-brand-500 hover:bg-brand-600"
              onClick={handleNewAlert}
            >
              <Plus className="h-3.5 w-3.5" />
              New Alert
            </Button>
          </div>
        </div>

        {/* Usage card */}
        {!isLoading && (
          <Card>
            <CardContent className="p-5">
              <UsageBar
                used={alertCount}
                max={maxAlerts}
                label="Alerts usage"
              />
              {atLimit && (
                <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  You&apos;ve reached your alert limit.{' '}
                  <button
                    className="font-semibold underline"
                    onClick={() => router.push('/billing/plans')}
                  >
                    Upgrade to add more
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && alertCount === 0 && (
          <EmptyState
            icon={Bell}
            title="No alerts configured"
            description="Create your first alert to get notified when new planning applications match your criteria."
          >
            <Button
              size="sm"
              className="mt-4 gap-1.5 bg-brand-500 hover:bg-brand-600"
              onClick={handleNewAlert}
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first alert
            </Button>
          </EmptyState>
        )}

        {/* Alert list */}
        {!isLoading && alertCount > 0 && (
          <div className="space-y-3">
            {alerts!.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={(id) => deleteAlert.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>

      <AlertWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      <PaywallModal
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        feature="Alerts"
        description={
          atLimit
            ? `You're on the ${tier} plan which allows up to ${maxAlerts} alerts. Upgrade to create unlimited alerts.`
            : undefined
        }
      />
    </>
  );
}
