'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getStatusVariant, getDecisionVariant, getAppealDecisionVariant, formatStatusLabel } from '@/lib/utils/status';

interface StatusBadgeProps {
  status?: string;
  displayStatus?: string;
  statusCategory?: string;
}

export function StatusBadge({ displayStatus, statusCategory }: StatusBadgeProps) {
  const label = displayStatus || formatStatusLabel(statusCategory);
  if (!label) return null;

  return (
    <Badge variant={getStatusVariant(statusCategory)}>
      {label}
    </Badge>
  );
}

interface DecisionBadgeProps {
  decision?: string | null;
  displayDecision?: string;
  label?: string;
}

export function DecisionBadge({ decision, displayDecision, label = 'CC' }: DecisionBadgeProps) {
  if (!decision || decision === 'N/A') return null;

  const display = displayDecision || formatStatusLabel(decision);

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-foreground-muted">{label}</span>
      <Badge variant={getDecisionVariant(decision)} className="text-xs">
        {display}
      </Badge>
    </div>
  );
}

interface AppealBadgeProps {
  appealDecision?: string | null;
}

export function AppealBadge({ appealDecision }: AppealBadgeProps) {
  if (!appealDecision || appealDecision === 'N/A') return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-foreground-muted">ABP</span>
      <Badge variant={getAppealDecisionVariant(appealDecision)} className="text-xs">
        {formatStatusLabel(appealDecision)}
      </Badge>
    </div>
  );
}
