import { format, parseISO, addDays, isValid } from 'date-fns';
import { enGB } from 'date-fns/locale';

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    const parsed = parseISO(date);
    if (!isValid(parsed)) return '-';
    return format(parsed, 'd MMM yy', { locale: enGB });
  } catch {
    return '-';
  }
}

export function formatDateLong(date: string | null | undefined): string {
  if (!date) return '-';
  try {
    const parsed = parseISO(date);
    if (!isValid(parsed)) return '-';
    return format(parsed, 'd MMMM yyyy', { locale: enGB });
  } catch {
    return '-';
  }
}

export function calculateSubmissionDeadline(receivedDate: string | null): string {
  if (!receivedDate) return '-';
  try {
    const start = addDays(parseISO(receivedDate), 1);
    const deadline = addDays(start, 35);
    return format(deadline, 'd MMM yy', { locale: enGB });
  } catch {
    return '-';
  }
}

export function getSubmissionDeadlineDate(receivedDate: string | null): Date | null {
  if (!receivedDate) return null;
  try {
    const start = addDays(parseISO(receivedDate), 1);
    return addDays(start, 35);
  } catch {
    return null;
  }
}

export function isWithinDeadlineDays(receivedDate: string | null, days: number): boolean {
  if (!receivedDate) return false;
  const deadline = getSubmissionDeadlineDate(receivedDate);
  if (!deadline) return false;
  const now = new Date();
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil >= 0 && daysUntil <= days;
}
