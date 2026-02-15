'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { reportJobsApi, type ReportJobSummary } from '@/lib/api/report-jobs';

function formatDate(value?: string | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IE');
}

function formatMs(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return 'N/A';
  return `${(value / 1000).toFixed(1)}s`;
}

function statusClass(status: string): string {
  if (status === 'generated') return 'text-green-700 bg-green-50 border-green-200';
  if (status === 'failed') return 'text-red-700 bg-red-50 border-red-200';
  if (status === 'generating' || status === 'queued') return 'text-blue-700 bg-blue-50 border-blue-200';
  return 'text-foreground bg-background border-border';
}

export default function ReportsHistoryPage() {
  const [rows, setRows] = useState<ReportJobSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorText('');
      const response = await reportJobsApi.listPrePlanningJobs({ page, pageSize });
      setRows(response.data);
      setTotal(response.total);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Failed to load report history.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Report History</CardTitle>
            <CardDescription>All generated pre-planning reports saved to your account.</CardDescription>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {errorText ? (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorText}</p>
          ) : null}

          <div className="overflow-x-auto rounded-md border border-border bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-background-subtle">
                <tr>
                  <th className="px-3 py-2 font-semibold">Created</th>
                  <th className="px-3 py-2 font-semibold">Name</th>
                  <th className="px-3 py-2 font-semibold">Intent</th>
                  <th className="px-3 py-2 font-semibold">Scope</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Time</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/70">
                    <td className="px-3 py-2">{formatDate(row.createdAt)}</td>
                    <td className="max-w-[280px] px-3 py-2 text-xs text-foreground-muted">
                      <p className="truncate text-sm text-foreground">{row.reportName || row.address || `Report #${row.id}`}</p>
                      <p className="truncate">{row.address || 'No address'}</p>
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {row.intentionCategory || 'N/A'}
                      {row.intentionSubCategory ? ` -> ${row.intentionSubCategory}` : ''}
                    </td>
                    <td className="px-3 py-2 text-xs">{row.applicationCount} apps</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${statusClass(row.reportStatus)}`}>
                        {row.reportStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs">{formatMs(row.generationTimeMs)}</td>
                    <td className="px-3 py-2">
                      <Link href={`/reports/pre-planning?jobId=${row.id}`}>
                        <Button size="sm" variant="outline">Open</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                {!isLoading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-foreground-muted">
                      No reports generated yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-foreground-muted">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
