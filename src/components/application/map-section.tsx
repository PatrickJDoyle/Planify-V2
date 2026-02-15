'use client';

import React from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Application } from '@/lib/types/application';
import type { ZoningData } from '@/lib/api/zoning';

interface MapSectionProps {
  application: Application;
  zoning?: ZoningData | null;
}

export function MapSection({ application: app, zoning }: MapSectionProps) {
  const hasCoords = app.latitude && app.longitude;

  if (!hasCoords) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-foreground-muted">
            No coordinates available for this application
          </p>
        </CardContent>
      </Card>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${app.latitude},${app.longitude}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${app.latitude},${app.longitude}`;

  return (
    <div className="space-y-4">
      {/* Zoning Info */}
      {zoning && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Zoning Information</h3>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-semibold text-primary dark:bg-brand-900">
                {zoning.zoneGzt}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {zoning.zoneOrig && (
                <div>
                  <span className="text-xs text-foreground-subtle">Zone Type</span>
                  <p className="text-sm text-foreground">{zoning.zoneOrig}</p>
                </div>
              )}
              {zoning.zoneDesc && (
                <div>
                  <span className="text-xs text-foreground-subtle">Description</span>
                  <p className="text-sm text-foreground">{zoning.zoneDesc}</p>
                </div>
              )}
              {zoning.laName && (
                <div>
                  <span className="text-xs text-foreground-subtle">Local Authority</span>
                  <p className="text-sm text-foreground">{zoning.laName}</p>
                </div>
              )}
              {zoning.planName && (
                <div>
                  <span className="text-xs text-foreground-subtle">Plan</span>
                  <p className="text-sm text-foreground">{zoning.planName}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Embed */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Location Map</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => window.open(googleMapsUrl, '_blank')}
              >
                <MapPin className="h-3 w-3" />
                Google Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => window.open(streetViewUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                Street View
              </Button>
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-md border border-border">
            <iframe
              title="Application Location"
              width="100%"
              height="450"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}&q=${app.latitude},${app.longitude}&zoom=15`}
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
            <MapPin className="h-3 w-3" />
            <span>
              {app.latitude.toFixed(6)}, {app.longitude.toFixed(6)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-3 h-[450px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}
