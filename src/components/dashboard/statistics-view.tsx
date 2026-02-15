'use client';

import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Application } from '@/lib/types/application';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const { statusData, authorityData, decisionData } = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byAuthority: Record<string, number> = {};
    const byDecision: Record<string, number> = {};

    for (const app of applications) {
      const status = app.displayStatus || app.applicationStatus || 'Unknown';
      const authority = app.planningAuthority || 'Unknown';
      const decision = app.displayDecision || app.decision || 'Undecided';

      byStatus[status] = (byStatus[status] ?? 0) + 1;
      byAuthority[authority] = (byAuthority[authority] ?? 0) + 1;
      byDecision[decision] = (byDecision[decision] ?? 0) + 1;
    }

    return {
      statusData: topCounts(byStatus),
      authorityData: topCounts(byAuthority),
      decisionData: topCounts(byDecision),
    };
  }, [applications]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Application Status Mix</CardTitle>
          <CardDescription>Breakdown from the current filtered result set.</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
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
          <CardTitle>Top Planning Authorities</CardTitle>
          <CardDescription>Most frequent authorities in the current results.</CardDescription>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={authorityData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#1270AF" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Decision Snapshot</CardTitle>
          <CardDescription>Decision distribution for current filtered results.</CardDescription>
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
            <div className="rounded-lg border border-border bg-background-subtle p-3">
              <p className="text-xs text-foreground-muted">Total Results</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{totalResults.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
