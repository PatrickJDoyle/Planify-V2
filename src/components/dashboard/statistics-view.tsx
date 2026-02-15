'use client';

import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Application } from '@/lib/types/application';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StatisticsViewProps {
  applications: Application[];
  totalResults: number;
}

const PIE_COLORS = ['#1270AF', '#0D5F95', '#1E88CC', '#0A4C77', '#74B8E0', '#D5EBF8'];

function topCounts(entries: Record<string, number>, limit = 6) {
  return Object.entries(entries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

export function StatisticsView({ applications, totalResults }: StatisticsViewProps) {
  const {
    statusData,
    authorityData,
    decisionData,
    typeData,
    processBuckets,
    kpis,
  } = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byAuthority: Record<string, number> = {};
    const byDecision: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const processingDays: number[] = [];
    let appealed = 0;
    let fiRequested = 0;
    let approvedHousingUnits = 0;

    for (const app of applications) {
      const status = app.displayStatus || app.applicationStatus || 'Unknown';
      const authority = app.planningAuthority || 'Unknown';
      const decision = app.displayDecision || app.decision || 'Undecided';
      const type = app.displayApplicationType || app.applicationType || 'Unknown';

      byStatus[status] = (byStatus[status] ?? 0) + 1;
      byAuthority[authority] = (byAuthority[authority] ?? 0) + 1;
      byDecision[decision] = (byDecision[decision] ?? 0) + 1;
      byType[type] = (byType[type] ?? 0) + 1;

      if (app.appealSubmittedDate || app.appealRefNumber) appealed += 1;
      if (app.fiRequestDate || app.fiRecDate) fiRequested += 1;
      if (
        app.numResidentialUnits &&
        app.numResidentialUnits > 0 &&
        (decision.toUpperCase().includes('GRANT') || decision.toUpperCase().includes('CONDITIONAL'))
      ) {
        approvedHousingUnits += app.numResidentialUnits;
      }

      if (app.receivedDate && app.decisionDate) {
        const rec = new Date(app.receivedDate).getTime();
        const dec = new Date(app.decisionDate).getTime();
        if (!Number.isNaN(rec) && !Number.isNaN(dec) && dec >= rec) {
          processingDays.push(Math.floor((dec - rec) / (1000 * 60 * 60 * 24)));
        }
      }
    }

    const decided = Object.entries(byDecision)
      .filter(([name]) => name.toLowerCase() !== 'undecided')
      .reduce((sum, [, value]) => sum + value, 0);
    const granted = Object.entries(byDecision)
      .filter(([name]) => name.toUpperCase().includes('GRANT') || name.toUpperCase().includes('CONDITIONAL'))
      .reduce((sum, [, value]) => sum + value, 0);

    const approvalRate = decided > 0 ? (granted / decided) * 100 : 0;
    const appealRate = decided > 0 ? (appealed / decided) * 100 : 0;
    const fiRate = totalResults > 0 ? (fiRequested / totalResults) * 100 : 0;

    const sortedDays = [...processingDays].sort((a, b) => a - b);
    const medianDays =
      sortedDays.length === 0
        ? null
        : sortedDays[Math.floor(sortedDays.length / 2)];

    const bucketDefs = [
      { label: '0-4w', min: 0, max: 28 },
      { label: '4-8w', min: 29, max: 56 },
      { label: '8-12w', min: 57, max: 84 },
      { label: '12-16w', min: 85, max: 112 },
      { label: '16w+', min: 113, max: Number.MAX_SAFE_INTEGER },
    ];
    const processBuckets = bucketDefs.map((bucket) => ({
      name: bucket.label,
      value: processingDays.filter((days) => days >= bucket.min && days <= bucket.max).length,
    }));

    return {
      statusData: topCounts(byStatus),
      authorityData: topCounts(byAuthority, 10),
      decisionData: topCounts(byDecision),
      typeData: topCounts(byType, 8),
      processBuckets,
      kpis: {
        approvalRate,
        appealRate,
        fiRate,
        medianDays,
        approvedHousingUnits,
        uniqueAuthorities: Object.keys(byAuthority).length,
      },
    };
  }, [applications, totalResults]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Kpi title="Total Applications" value={totalResults.toLocaleString()} />
        <Kpi title="Approval Rate" value={`${kpis.approvalRate.toFixed(1)}%`} />
        <Kpi title="Median Decision Time" value={kpis.medianDays ? `${kpis.medianDays}d` : 'N/A'} />
        <Kpi title="Approved Units" value={kpis.approvedHousingUnits.toLocaleString()} />
        <Kpi title="Appeal Rate" value={`${kpis.appealRate.toFixed(1)}%`} />
        <Kpi title="Authorities" value={kpis.uniqueAuthorities.toString()} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timelines">Timelines</TabsTrigger>
          <TabsTrigger value="authorities">Authorities</TabsTrigger>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Application Status Mix</CardTitle>
              <CardDescription>Current filtered result distribution.</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={110} label>
                    {statusData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Application Types</CardTitle>
              <CardDescription>Top application types in current dataset.</CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={110}>
                    {typeData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timelines">
          <Card>
            <CardHeader>
              <CardTitle>Processing Time Distribution</CardTitle>
              <CardDescription>
                Median: {kpis.medianDays ? `${kpis.medianDays} days` : 'N/A'} • FI rate: {kpis.fiRate.toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processBuckets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1270AF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authorities">
          <Card>
            <CardHeader>
              <CardTitle>Authority Performance</CardTitle>
              <CardDescription>Top authorities by volume in this filter set.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={authorityData} layout="vertical" margin={{ left: 8, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1270AF" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions">
          <Card>
            <CardHeader>
              <CardTitle>Decision Snapshot</CardTitle>
              <CardDescription>Detailed decision distribution.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {decisionData.map((item, idx) => (
                  <div key={item.name} className="rounded-lg border border-border bg-background-subtle p-3">
                    <p className="text-xs text-foreground-muted">{item.name}</p>
                    <p className="mt-1 text-xl font-semibold" style={{ color: PIE_COLORS[idx % PIE_COLORS.length] }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xs text-foreground-muted">{title}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
