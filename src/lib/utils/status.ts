import type { BadgeProps } from '@/components/ui/badge';

// Map backend status/decision categories to badge variants
export function getStatusVariant(
  statusCategory?: string,
): BadgeProps['variant'] {
  if (!statusCategory) return 'secondary';
  const cat = statusCategory.toUpperCase();

  if (cat.includes('PENDING') || cat.includes('NEW') || cat.includes('UNDER'))
    return 'pending';
  if (cat.includes('APPEAL')) return 'appealed';
  if (cat.includes('WITHDRAWN') || cat.includes('INVALID')) return 'withdrawn';
  if (cat.includes('DECIDED') || cat.includes('COMPLETE')) return 'secondary';

  return 'secondary';
}

export function getDecisionVariant(
  decision?: string | null,
): BadgeProps['variant'] {
  if (!decision) return 'secondary';
  const d = decision.toUpperCase();

  if (
    d.includes('GRANT') ||
    d.includes('CONDITIONAL') ||
    d.includes('UNCONDITIONAL') ||
    d.includes('APPROVAL') ||
    d.includes('EXEMPT')
  )
    return 'granted';
  if (
    d.includes('REFUSED') ||
    d.includes('INVALID') ||
    d.includes('QUASHED') ||
    d.includes('NOT EXEMPT') ||
    d.includes('CANNOT')
  )
    return 'refused';
  if (d.includes('WITHDRAWN')) return 'withdrawn';

  return 'secondary';
}

export function getAppealDecisionVariant(
  appealDecision?: string | null,
): BadgeProps['variant'] {
  if (!appealDecision) return 'secondary';
  const d = appealDecision.toUpperCase();

  if (
    d.includes('GRANT') ||
    d.includes('CONDITIONAL') ||
    d.includes('UNCONDITIONAL')
  )
    return 'granted';
  if (d.includes('REFUSED') || d.includes('INVALID') || d.includes('QUASHED'))
    return 'refused';
  if (d.includes('WITHDRAWN')) return 'withdrawn';

  return 'appealed';
}

export function formatStatusLabel(status?: string): string {
  if (!status) return '';
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
