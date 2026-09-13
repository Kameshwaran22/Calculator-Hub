import { Currency } from '../types';

export function formatCurrency(amount: number, currency: Currency | string = 'INR'): string {
  if (isNaN(amount) || !isFinite(amount)) return '0';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (currency === 'INR') {
    // Format according to Indian Number System (Lakhs, Crores)
    let formattedStr = '';
    if (absAmount >= 10000000) {
      formattedStr = `₹${(absAmount / 10000000).toFixed(2)} Cr`;
    } else if (absAmount >= 100000) {
      formattedStr = `₹${(absAmount / 100000).toFixed(2)} Lakh`;
    } else {
      formattedStr = `₹${Math.round(absAmount).toLocaleString('en-IN')}`;
    }
    return isNegative ? `-${formattedStr}` : formattedStr;
  }

  // International formatting for USD, EUR, GBP, JPY, CNY
  const symbolMap: Record<Currency, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
  };

  const symbol = symbolMap[currency as Currency] || '$';
  let formattedStr = '';
  if (absAmount >= 1000000000) {
    formattedStr = `${symbol}${(absAmount / 1000000000).toFixed(2)}B`;
  } else if (absAmount >= 1000000) {
    formattedStr = `${symbol}${(absAmount / 1000000).toFixed(2)}M`;
  } else {
    formattedStr = `${symbol}${Math.round(absAmount).toLocaleString('en-US')}`;
  }

  return isNegative ? `-${formattedStr}` : formattedStr;
}

export function formatExactCurrency(amount: number, currency: Currency | string = 'INR'): string {
  if (isNaN(amount) || !isFinite(amount)) return '0';
  const symbolMap: Record<Currency, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
  };
  const symbol = symbolMap[currency as Currency] || '₹';
  const locale =
    currency === 'INR'
      ? 'en-IN'
      : currency === 'JPY'
      ? 'ja-JP'
      : currency === 'CNY'
      ? 'zh-CN'
      : 'en-US';
  return `${symbol}${Math.round(amount).toLocaleString(locale)}`;
}

export function formatPercent(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0%';
  return `${val.toFixed(1)}%`;
}

export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
