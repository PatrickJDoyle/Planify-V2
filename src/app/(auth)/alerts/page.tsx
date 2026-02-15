'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Plus, Trash2, MapPin, Building2, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useAlerts, useDeleteAlert } from '@/lib/queries/alerts';
import type { Alert, AlertScope } from '@/lib/types/alerts';

const scopeConfig: Record<AlertScope, { icon: React.ElementType; label: string; color: string }> = {
  radius: { icon: MapPin, label: 'Radius', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  authority: { icon: Building2, label: 'Authority', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200' },
  nationwide: { icon: Globe, label: 'Nationwide', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
};

export default function AlertsPage() {
  const router = useRouter();
  const { data: alerts, isLoading } = useAlerts();
  const deleteAlert = useDeleteAlert();

  const handleDelete = (alertId: number) => {
    deleteAlert.mutate(alertId);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Alerts</h1>
          <p className="text-sm text-foreground-muted">
            Manage your planning application alerts
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => router.push('/alerts/inbox')}
        >
          <Bell className="h-3.5 w-3.5" />
          View Inbox
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (!alerts || alerts.length === 0) && (
        <EmptyState
          icon={Bell}
          title="No alerts configured"
          description="Create alerts to get notified when new applications are submitted or existing ones change status."
        />
      )}

      {/* Alert List */}
      {!isLoading && alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, onDelete }: { alert: Alert; onDelete: (id: number) => void }) {
  const scope = alert.scope ?? 'radius';
  const config = scopeConfig[scope];
  const Icon = config.icon;

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background-subtle">
            <Icon className="h-4 w-4 text-foreground-muted" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {alert.alertType === 'new_application' ? 'New Applications' : 'Status Updates'}
              </span>
              <Badge className={config.color}>{config.label}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {alert.planningAuthority && `${alert.planningAuthority} · `}
              {alert.address && `${alert.address} · `}
              {alert.radius && `${alert.radius}m radius`}
              {alert.applicationId && `Application #${alert.applicationId}`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-foreground-muted hover:text-red-500"
          onClick={() => onDelete(alert.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
