import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatDate(date: string | Date | undefined, formatStr: string = 'dd MMM yyyy'): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, formatStr);
  } catch {
    return String(date);
  }
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd MMM yyyy, hh:mm a');
  } catch {
    return String(date);
  }
}

export function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return String(date);
  }
}

export function formatNumber(num: number | undefined): string {
  if (num === undefined || num === null) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatCGPA(cgpa: number | undefined): string {
  if (cgpa === undefined || cgpa === null) return '0.00';
  return cgpa.toFixed(2);
}
