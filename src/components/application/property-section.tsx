'use client';

import React from 'react';
import { TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/dates';
import { formatAddress } from '@/lib/utils/formatting';
import type { PropertyHistoryResponse } from '@/lib/api/property';

interface PropertySectionProps {
  propertyHistory: PropertyHistoryResponse | undefined;
  isLoading: boolean;
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    verified: { label: 'Verified', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
    high: { label: 'High', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    medium: { label: 'Good', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
    low: { label: 'Possible', className: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300' },
  };
  const v = variants[confidence] ?? variants.low;
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', v.className)}>
      {confidence === 'verified' && <CheckCircle className="mr-1 h-3 w-3" />}
      {v.label}
    </span>
  );
}

export function PropertySection({ propertyHistory, isLoading }: PropertySectionProps) {
  if (isLoading) return <PropertySkeleton />;

  if (!propertyHistory?.success) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-foreground-muted">Unable to load property history</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, applications, bcmsNotices, propertySales, hasExactMatch, canonicalAddress } = propertyHistory;
  const isEmpty = summary.totalApplications === 0 && summary.totalBcms === 0 && summary.totalSales === 0;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground">Property History Overview</h3>
          {hasExactMatch && canonicalAddress && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-200">Exact Property Match</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">{canonicalAddress}</p>
              </div>
            </div>
          )}
          <div className="mt-3 grid grid-cols-4 gap-3">
            <StatCard value={summary.totalApplications} label="Applications" color="text-primary" />
            <StatCard value={summary.totalBcms} label="Commencements" color="text-violet-600" />
            <StatCard value={summary.totalSales} label="Sales" color="text-emerald-600" />
            <StatCard value={summary.highConfidenceCount} label="High Quality" color="text-amber-600" />
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      {applications.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Other Applications ({applications.length})
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">App #</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Description</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Decision</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Received</th>
                    <th className="pb-2 text-xs font-medium text-foreground-muted">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted">
                  {applications.map((app) => (
                    <tr
                      key={app.applicationId}
                      className="cursor-pointer transition-colors hover:bg-background-subtle"
                      onClick={() => app.linkApplicationDetails && window.open(app.linkApplicationDetails, '_blank')}
                    >
                      <td className="py-2 pr-3 text-xs font-medium text-foreground">{app.applicationNumber}</td>
                      <td className="py-2 pr-3 text-xs text-foreground-muted">
                        {app.developmentDescription?.substring(0, 80)}...
                      </td>
                      <td className="py-2 pr-3 text-xs">{app.decision || 'Pending'}</td>
                      <td className="py-2 pr-3 text-xs text-foreground-muted">{formatDate(app.receivedDate)}</td>
                      <td className="py-2"><ConfidenceBadge confidence={app.confidence} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BCMS Notices */}
      {bcmsNotices.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Commencement Notices ({bcmsNotices.length})
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Notice #</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Address</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Status</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Commenced</th>
                    <th className="pb-2 text-xs font-medium text-foreground-muted">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted">
                  {bcmsNotices.map((n) => (
                    <tr key={n.id} className="transition-colors hover:bg-background-subtle">
                      <td className="py-2 pr-3 text-xs font-medium text-foreground">{n.noticeExternalId}</td>
                      <td className="py-2 pr-3 text-xs text-foreground-muted">{formatAddress(n.projectAddress, 50)}</td>
                      <td className="py-2 pr-3 text-xs">{n.status || '-'}</td>
                      <td className="py-2 pr-3 text-xs text-foreground-muted">{formatDate(n.commencementDate)}</td>
                      <td className="py-2"><ConfidenceBadge confidence={n.confidence} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property Sales */}
      {propertySales.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Property Sales ({propertySales.length})
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Sale Date</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Address</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Price</th>
                    <th className="pb-2 text-xs font-medium text-foreground-muted">Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted">
                  {propertySales.map((sale) => (
                    <tr key={sale.id} className="transition-colors hover:bg-background-subtle">
                      <td className="py-2 pr-3 text-xs text-foreground-muted">{formatDate(sale.saleDate)}</td>
                      <td className="py-2 pr-3 text-xs text-foreground-muted">{formatAddress(sale.address, 60)}</td>
                      <td className="py-2 pr-3 text-xs font-medium text-emerald-600">
                        &euro;{sale.price.toLocaleString()}
                      </td>
                      <td className="py-2"><ConfidenceBadge confidence={sale.confidence} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Quality Guide */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold text-foreground">Match Quality Guide</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ConfidenceBadge confidence="verified" />
              <span className="text-foreground-muted">Confirmed same property</span>
            </div>
            <div className="flex items-center gap-2">
              <ConfidenceBadge confidence="high" />
              <span className="text-foreground-muted">Very likely the same property</span>
            </div>
            <div className="flex items-center gap-2">
              <ConfidenceBadge confidence="medium" />
              <span className="text-foreground-muted">Probably the same property</span>
            </div>
            <div className="flex items-center gap-2">
              <ConfidenceBadge confidence="low" />
              <span className="text-foreground-muted">May be related</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isEmpty && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-sm text-foreground-muted">No other records found for this property</p>
              <p className="mt-1 text-xs text-foreground-subtle">
                This is the only planning-related activity at this location
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-md border border-border-muted bg-background-subtle p-3 text-center">
      <p className={cn('text-2xl font-bold', color)}>{value}</p>
      <p className="text-xs text-foreground-muted">{label}</p>
    </div>
  );
}

function PropertySkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-5 w-40" />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-md" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
