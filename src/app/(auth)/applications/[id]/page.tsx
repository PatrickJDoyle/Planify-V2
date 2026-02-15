'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useApplication, useRelatedApplications } from '@/lib/queries/applications';
import {
  useBcmsNotices,
  useNearbyBcms,
  useNearbySales,
  useNearbyZoning,
  usePropertyHistory,
  useZoning,
} from '@/lib/queries/detail';
import { ApplicationHeader } from '@/components/application/application-header';
import { OverviewSection, OverviewSkeleton } from '@/components/application/overview-section';
import { DocumentsSection } from '@/components/application/documents-section';
import { MapSection, MapSkeleton } from '@/components/application/map-section';
import { TimelineSection, TimelineSkeleton } from '@/components/application/timeline-section';
import { PropertySection } from '@/components/application/property-section';
import { BcmsSection } from '@/components/application/bcms-section';
import { NearbySalesSection } from '@/components/application/nearby-sales-section';
import { RelatedSection } from '@/components/application/related-section';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const applicationId = Number(params.id);

  // Core application data
  const { data: application, isLoading: appLoading } = useApplication(applicationId);

  // Supplementary data — only fetch when we have the application
  const { data: bcmsNotices, isLoading: bcmsLoading } = useBcmsNotices(applicationId);
  const { data: nearbyBcms } = useNearbyBcms(
    applicationId,
    application?.latitude,
    application?.longitude,
    !bcmsLoading && (!bcmsNotices || bcmsNotices.length === 0),
  );
  const { data: zoning } = useZoning(application?.latitude, application?.longitude);
  const { data: nearbyZones } = useNearbyZoning(application?.latitude, application?.longitude, 0.08);
  const { data: nearbySales, isLoading: salesLoading } = useNearbySales(
    application?.latitude,
    application?.longitude,
  );
  const { data: propertyHistory, isLoading: historyLoading } = usePropertyHistory(
    applicationId,
    application?.latitude,
    application?.longitude,
    application?.developmentAddress,
    application?.applicationNumber,
    application?.planningAuthority,
  );
  const { data: relatedApps, isLoading: relatedLoading } = useRelatedApplications(applicationId);

  if (appLoading || !application) {
    return <DetailPageSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ApplicationHeader application={application} zoning={zoning} />

      <div className="flex-1 px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="property">Property History</TabsTrigger>
              <TabsTrigger value="bcms">BCMS</TabsTrigger>
              <TabsTrigger value="prices">Prices</TabsTrigger>
              <TabsTrigger value="related">Related</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <OverviewSection application={application} bcmsNotices={bcmsNotices} />
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentsSection application={application} />
            </TabsContent>

            <TabsContent value="map" className="mt-4">
              <MapSection application={application} zoning={zoning} nearbyZones={nearbyZones} />
            </TabsContent>

            <TabsContent value="timeline" className="mt-4">
              <TimelineSection application={application} bcmsNotices={bcmsNotices} />
            </TabsContent>

            <TabsContent value="property" className="mt-4">
              <PropertySection propertyHistory={propertyHistory} isLoading={historyLoading} />
            </TabsContent>

            <TabsContent value="bcms" className="mt-4">
              <BcmsSection
                bcmsNotices={bcmsNotices}
                nearbyBcms={nearbyBcms}
                isLoading={bcmsLoading}
              />
            </TabsContent>

            <TabsContent value="prices" className="mt-4">
              <NearbySalesSection sales={nearbySales} isLoading={salesLoading} />
            </TabsContent>

            <TabsContent value="related" className="mt-4">
              <RelatedSection relatedApps={relatedApps} isLoading={relatedLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function DetailPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header skeleton */}
      <div className="border-b border-border bg-surface px-6 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-6 w-96" />
          <Skeleton className="h-4 w-[600px]" />
          <Skeleton className="h-3 w-80" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <div className="flex gap-4 border-b border-border pb-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-16" />
            ))}
          </div>
          <div className="mt-4">
            <OverviewSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
