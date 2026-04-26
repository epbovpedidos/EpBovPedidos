export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function parseFormattedNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  // Handle both comma and dot as decimal separator gracefully
  // First, remove all non-numeric characters except comma and dot
  let cleaned = value.replace(/[^\d.,]/g, '');
  // If there are multiple dots/commas, only keep the last one as decimal
  const lastCommaIndex = cleaned.lastIndexOf(',');
  const lastDotIndex = cleaned.lastIndexOf('.');
  const decimalIndex = Math.max(lastCommaIndex, lastDotIndex);
  
  if (decimalIndex !== -1) {
    const integerPart = cleaned.substring(0, decimalIndex).replace(/[.,]/g, '');
    const decimalPart = cleaned.substring(decimalIndex + 1).replace(/[.,]/g, '');
    return parseFloat(`${integerPart}.${decimalPart}`) || 0;
  }
  
  return parseFloat(cleaned) || 0;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (e) {
    return dateStr;
  }
}
