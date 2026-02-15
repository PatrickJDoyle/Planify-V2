'use client';

import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Application } from '@/lib/types/application';

interface DocumentsSectionProps {
  application: Application;
}

export function DocumentsSection({ application: app }: DocumentsSectionProps) {
  const dublinCouncils = [
    'Dublin City Council',
    'South Dublin County Council',
    'Fingal County Council',
    'Dun Laoghaire Rathdown County Council',
  ];

  const isDublin = dublinCouncils.includes(app.planningAuthority || '');

  return (
    <div className="space-y-4">
      {/* Document Links */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Council Documents */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Council Documents</h3>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-xs text-foreground-muted">
              View all planning documents, drawings, reports, and decisions from{' '}
              {app.planningAuthority}
            </p>
            {app.linkApplicationDetails && (
              <Button
                size="sm"
                className="mt-3 w-full gap-1.5"
                onClick={() => window.open(app.linkApplicationDetails, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on Council Website
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Appeal Documents */}
        {app.appealRefNumber && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Appeal Documents</h3>
                <FileText className="h-4 w-4 text-red-500" />
              </div>
              <p className="mt-2 text-xs text-foreground-muted">
                View appeal submissions, inspector reports, and decisions from An Bord Pleanala
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3 w-full gap-1.5"
                onClick={() =>
                  window.open(
                    `https://www.pleanala.ie/en-ie/case/${app.appealRefNumber?.split('-')[1]}`,
                    '_blank',
                  )
                }
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on ABP Website
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Document Types Info */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground">Common Document Types</h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <DocType title="Application Forms" desc="Planning application and supporting statements" />
            <DocType title="Drawings & Plans" desc="Site plans, elevations, floor plans, and sections" />
            <DocType title="Reports" desc="Environmental, traffic, engineering assessments" />
            <DocType title="Decisions & Notices" desc="Planning decisions, FI requests, grant notices" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DocType({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-md border border-border-muted p-2.5">
      <p className="text-xs font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-foreground-muted">{desc}</p>
    </div>
  );
}
