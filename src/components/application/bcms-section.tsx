'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils/dates';
import { formatAddress } from '@/lib/utils/formatting';
import type { BcmsNotice } from '@/lib/api/bcms';

interface BcmsSectionProps {
  bcmsNotices?: BcmsNotice[];
  nearbyBcms?: BcmsNotice[];
  isLoading: boolean;
}

export function BcmsSection({ bcmsNotices, nearbyBcms, isLoading }: BcmsSectionProps) {
  if (isLoading) return <BcmsSkeleton />;

  const hasLinked = bcmsNotices && bcmsNotices.length > 0;
  const hasNearby = !hasLinked && nearbyBcms && nearbyBcms.length > 0;

  return (
    <div className="space-y-4">
      {/* Linked BCMS Notices */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground">Commencement Notices</h3>
          {!hasLinked ? (
            <p className="mt-3 text-sm text-foreground-muted">
              No commencement notices linked to this application
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Notice #</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Authority</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Address</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Status</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Commenced</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Type</th>
                    <th className="pb-2 text-xs font-medium text-foreground-muted">Floor Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted">
                  {bcmsNotices!.map((n) => (
                    <tr key={n.id} className="transition-colors hover:bg-background-subtle">
                      <td className="py-2 pr-3 text-xs font-medium text-foreground">{n.noticeExternalId}</td>
                      <td className="py-2 pr-3 text-xs">{n.localAuthority || '-'}</td>
                      <td className="py-2 pr-3 text-xs text-foreground-muted">
                        {formatAddress(n.projectAddress, 50)}
                      </td>
                      <td className="py-2 pr-3 text-xs">{n.status || '-'}</td>
                      <td className="py-2 pr-3 text-xs text-foreground-muted">
                        {formatDate(n.commencementDate)}
                      </td>
                      <td className="py-2 pr-3 text-xs">{n.projectType || '-'}</td>
                      <td className="py-2 text-xs">{n.floorArea ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nearby BCMS */}
      {hasNearby && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground">
              Nearby Commencements (&le;75m)
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Notice #</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Authority</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Address</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Status</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Commenced</th>
                    <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Type</th>
                    <th className="pb-2 text-xs font-medium text-foreground-muted">Distance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-muted">
                  {nearbyBcms!.map((n) => (
                    <tr key={n.id} className="transition-colors hover:bg-background-subtle">
                      <td className="py-2 pr-3 text-xs font-medium text-foreground">{n.noticeExternalId}</td>
                      <td className="py-2 pr-3 text-xs">{n.localAuthority || '-'}</td>
                      <td className="py-2 pr-3 text-xs text-foreground-muted">
                        {formatAddress(n.projectAddress, 50)}
                      </td>
                      <td className="py-2 pr-3 text-xs">{n.status || '-'}</td>
                      <td className="py-2 pr-3 text-xs text-foreground-muted">
                        {formatDate(n.commencementDate)}
                      </td>
                      <td className="py-2 pr-3 text-xs">{n.projectType || '-'}</td>
                      <td className="py-2 text-xs">{n.distanceMeters ?? '-'}m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BcmsSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-5 w-40" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
