import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string, format: string = 'MMM DD, YYYY'): string {
  return dayjs(date).format(format);
}

export function formatDateTime(date: Date | string, format: string = 'MMM DD, YYYY HH:mm'): string {
  return dayjs(date).format(format);
}

export function generatePaymentReference(): string {
  return uuidv4().toUpperCase();
}

export function generateInvoiceNumber(prefix: string, count: number): string {
  const paddedNumber = String(count + 1).padStart(6, '0');
  return `${prefix}-${paddedNumber}`;
}

export function generatePasswordResetToken(): string {
  return Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64');
}

export function isTokenExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate;
}
