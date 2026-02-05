import { format, isToday, isYesterday, isSameYear } from 'date-fns';

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date
 */
export function formatDate(
  date: Date,
  formatType: 'long' | 'short' = 'long'
): string {
  if (formatType === 'short') {
    return format(date, 'MM/dd/yyyy');
  }
  return format(date, 'MMM dd, yyyy');
}

/**
 * Format a decimal as percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 2
): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a date relative to today
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();

  if (isToday(date)) {
    return 'Today';
  }

  if (isYesterday(date)) {
    return 'Yesterday';
  }

  if (isSameYear(date, now)) {
    return format(date, 'MMM dd');
  }

  return format(date, 'MMM dd, yyyy');
}
