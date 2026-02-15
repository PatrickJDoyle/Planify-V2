'use client';

import { format, parseISO } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import type { Application } from '@/lib/types/application';

interface StatisticsPanelProps {
  applications: Application[];
}

function getDecisionCounts(apps: Application[]): { name: string; count: number; fill: string }[] {
  const counts: Record<string, number> = {};
  const colors: Record<string, string> = {
    granted: '#10b981',
    refused: '#ef4444',
    pending: '#f59e0b',
    conditions: '#0ea5e9',
    appealed: '#8b5cf6',
    withdrawn: '#6b7280',
  };
  apps.forEach((a) => {
    const key = (a.decision ?? a.displayStatus ?? 'other').toLowerCase().replace(/\s+/g, '-');
    const label = key === 'granted' || key === 'refused' || key === 'pending' 
      ? key 
      : key.includes('condition') ? 'conditions' : key.includes('appeal') ? 'appealed' : key.includes('withdraw') ? 'withdrawn' : 'other';
    counts[label] = (counts[label] ?? 0) + 1;
  });
  return Object.entries(counts).map(([name, count]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    count,
    fill: colors[name] ?? '#6b7280',
  }));
}

function getMonthlyCounts(apps: Application[]): { month: string; count: number }[] {
  const byMonth: Record<string, number> = {};
  apps.forEach((a) => {
    const d = a.receivedDate;
    if (!d) return;
    const monthKey = d.slice(0, 7);
    byMonth[monthKey] = (byMonth[monthKey] ?? 0) + 1;
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([k]) => ({
      month: format(parseISO(k + '-01'), 'MMM yy'),
      count: byMonth[k] ?? 0,
    }));
}

export function StatisticsPanel({ applications }: StatisticsPanelProps) {
  const decisionData = getDecisionCounts(applications);
  const monthlyData = getMonthlyCounts(applications);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Decisions (n={applications.length})
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={decisionData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
              <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                {decisionData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Applications by Month
        </h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Bar dataKey="count" fill="#1270AF" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
