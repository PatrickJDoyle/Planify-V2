'use client';

import React from 'react';
import { ApplicationCard } from './application-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Application } from '@/lib/types/application';

interface ResultsGridProps {
  applications: Application[];
  isLoading: boolean;
}

export function ResultsGrid({ applications, isLoading }: ResultsGridProps) {
  if (isLoading) {
    return <GridSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {applications.map((app) => (
        <ApplicationCard key={app.applicationId} application={app} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-full" />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-muted pt-3">
            <div>
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-1 h-4 w-20" />
            </div>
            <div>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-1 h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
