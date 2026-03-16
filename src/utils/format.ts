export const formatCurrency = (value: number): string => {
  return value.toLocaleString('ko-KR');
};

export const formatPercent = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ko-KR');
};
