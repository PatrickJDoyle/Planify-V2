'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils/dates';
import type { Application } from '@/lib/types/application';

interface RelatedSectionProps {
  relatedApps?: Application[];
  isLoading: boolean;
}

export function RelatedSection({ relatedApps, isLoading }: RelatedSectionProps) {
  if (isLoading) return <RelatedSkeleton />;

  if (!relatedApps || relatedApps.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-foreground-muted">No related sub-applications found</p>
            <p className="mt-1 text-xs text-foreground-subtle">
              This application has no related sub-applications (SUB01, SUB02, etc.)
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Related Sub-Applications ({relatedApps.length})
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Application #</th>
                <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Description</th>
                <th className="pb-2 pr-3 text-xs font-medium text-foreground-muted">Status</th>
                <th className="pb-2 text-xs font-medium text-foreground-muted">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {relatedApps.map((app) => (
                <tr
                  key={app.applicationId}
                  className="cursor-pointer transition-colors hover:bg-background-subtle"
                  onClick={() => app.linkApplicationDetails && window.open(app.linkApplicationDetails, '_blank')}
                >
                  <td className="py-2 pr-3 text-xs font-medium text-foreground">{app.applicationNumber}</td>
                  <td className="py-2 pr-3 text-xs text-foreground-muted">
                    {app.developmentDescription
                      ? `${app.developmentDescription.substring(0, 100)}...`
                      : '-'}
                  </td>
                  <td className="py-2 pr-3 text-xs">{app.applicationStatus || '-'}</td>
                  <td className="py-2 text-xs text-foreground-muted">{formatDate(app.receivedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RelatedSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-5 w-48" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
