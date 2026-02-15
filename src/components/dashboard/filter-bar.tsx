'use client';

import React, { useMemo, useState } from 'react';
import { Filter, RotateCcw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import { PLANNING_AUTHORITIES, SECTORS, APPLICATION_TYPES } from '@/lib/utils/constants';

export function FilterBar() {
  const { filters, setFilters, resetFilters } = useDashboardStore();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(filters);

  const activeFilters = useMemo(
    () =>
      Object.entries(filters).filter(([, value]) => {
        if (value === undefined || value === null) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        return true;
      }),
    [filters],
  );

  const activeFilterCount = activeFilters.length;

  const decisions = [
    'GRANT',
    'REFUSE',
    'CONDITIONAL',
    'WITHDRAWN',
    'INVALID',
    'APPEALED',
  ];

  const submissionDeadlineOptions = [
    { value: '', label: 'Any deadline' },
    { value: '7', label: 'Within 7 days' },
    { value: '14', label: 'Within 14 days' },
    { value: '21', label: 'Within 21 days' },
    { value: '28', label: 'Within 28 days' },
    { value: '35', label: 'Within 35 days' },
  ];

  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) setDraft(filters);
  };

  const applyFilters = () => {
    setFilters({
      planningAuthority: draft.planningAuthority || undefined,
      sector: draft.sector || undefined,
      applicationType: draft.applicationType || undefined,
      decision: draft.decision || undefined,
      applicationNumber: draft.applicationNumber || undefined,
      descriptionSearch: draft.descriptionSearch || undefined,
      submissionDeadline: draft.submissionDeadline || undefined,
      receivedDateFrom: draft.receivedDateFrom || undefined,
      receivedDateTo: draft.receivedDateTo || undefined,
    });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-brand-500 px-1.5 py-0 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
              <DialogDescription>
                Apply enterprise-grade filters. Results will refresh and this panel will close.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Planning Authority">
                <select
                  value={draft.planningAuthority ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, planningAuthority: e.target.value || undefined }))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">All authorities</option>
                  {PLANNING_AUTHORITIES.map((authority) => (
                    <option key={authority.id} value={authority.id}>
                      {authority.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Sector">
                <select
                  value={draft.sector ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, sector: e.target.value || undefined }))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">All sectors</option>
                  {SECTORS.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Application Type">
                <select
                  value={draft.applicationType ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, applicationType: e.target.value || undefined }))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">All types</option>
                  {APPLICATION_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Decision">
                <select
                  value={draft.decision ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, decision: e.target.value || undefined }))}
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="">All decisions</option>
                  {decisions.map((decision) => (
                    <option key={decision} value={decision}>
                      {decision}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Submission Deadline">
                <select
                  value={String(draft.submissionDeadline ?? '')}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      submissionDeadline: (e.target.value || undefined) as typeof prev.submissionDeadline,
                    }))
                  }
                  className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  {submissionDeadlineOptions.map((opt) => (
                    <option key={opt.value || 'all'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Application Number">
                <Input
                  value={draft.applicationNumber ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, applicationNumber: e.target.value || undefined }))}
                  placeholder="e.g. SD22A/0344"
                  className="h-9"
                />
              </Field>

              <Field label="Description Contains">
                <Input
                  value={draft.descriptionSearch ?? ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, descriptionSearch: e.target.value || undefined }))}
                  placeholder="Keyword search"
                  className="h-9"
                />
              </Field>

              <Field label="Received Date From">
                <Input
                  type="date"
                  value={draft.receivedDateFrom ? toInputDate(draft.receivedDateFrom) : ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      receivedDateFrom: e.target.value ? new Date(e.target.value) : undefined,
                    }))
                  }
                  className="h-9"
                />
              </Field>

              <Field label="Received Date To">
                <Input
                  type="date"
                  value={draft.receivedDateTo ? toInputDate(draft.receivedDateTo) : ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      receivedDateTo: e.target.value ? new Date(e.target.value) : undefined,
                    }))
                  }
                  className="h-9"
                />
              </Field>
            </div>

            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                onClick={() =>
                  setDraft({
                    planningAuthority: undefined,
                    sector: undefined,
                    applicationType: undefined,
                    decision: undefined,
                    applicationNumber: undefined,
                    descriptionSearch: undefined,
                    submissionDeadline: undefined,
                    receivedDateFrom: undefined,
                    receivedDateTo: undefined,
                  })
                }
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button onClick={applyFilters} className="gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Search
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="gap-1.5 text-foreground-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear all
          </Button>
        )}
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-foreground-muted">Active filters:</span>
          {activeFilters.map(([key, value]) => (
            <Badge key={key} variant="outline" className="gap-1 pr-1">
              {prettyFilterLabel(key, value)}
              <button
                onClick={() => setFilters({ [key]: undefined })}
                className="ml-0.5 rounded-full p-0.5 hover:bg-background-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground-muted">{label}</label>
      {children}
    </div>
  );
}

function toInputDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0] ?? '';
}

function prettyFilterLabel(key: string, value: unknown) {
  if (value instanceof Date) return `${key}: ${toInputDate(value)}`;
  if (typeof value === 'string' || typeof value === 'number') return `${key}: ${value}`;
  return key;
}
