export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(Number(value))) return '0';
  return value.toLocaleString('ko-KR');
};

export type SignedFormatOptions = {
  showArrow?: boolean;
  showSign?: boolean;
  fractionDigits?: number;
};

export const toFiniteNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(num) ? num : 0;
};

export const formatSignedPercent = (
  value: number | string | null | undefined,
  options: SignedFormatOptions = {},
): string => {
  const { showArrow = true, showSign = false, fractionDigits = 2 } = options;
  const num = toFiniteNumber(value);

  if (Math.abs(num) < 0.0001) return '0.00%';

  const arrow = showArrow ? (num > 0 ? '▲ ' : '▼ ') : '';
  const sign = showSign ? (num > 0 ? '+' : '-') : '';
  return `${arrow}${sign}${Math.abs(num).toFixed(fractionDigits)}%`;
};

export const formatPercent = (value: number | string | null | undefined): string => {
  return formatSignedPercent(value);
};

export const formatSignedCurrency = (
  value: number | string | null | undefined,
  options: SignedFormatOptions = {},
): string => {
  const { showArrow = false, showSign = false } = options;
  const amount = toFiniteNumber(value);

  if (Math.abs(amount) < 0.0001) return '0 원';

  const arrow = showArrow ? (amount > 0 ? '▲ ' : '▼ ') : '';
  const sign = showSign ? (amount > 0 ? '+' : '-') : '';
  return `${arrow}${sign}${formatCurrency(Math.abs(amount))} 원`;
};

export const formatSignedNumber = (
  value: number | string | null | undefined,
  options: SignedFormatOptions = {},
): string => {
  const { showArrow = true, showSign = false, fractionDigits = 0 } = options;
  const num = toFiniteNumber(value);

  if (Math.abs(num) < 0.0001) return fractionDigits > 0 ? num.toFixed(fractionDigits) : '0';

  const arrow = showArrow ? (num > 0 ? '▲ ' : '▼ ') : '';
  const sign = showSign ? (num > 0 ? '+' : '-') : '';
  return `${arrow}${sign}${Math.abs(num).toLocaleString('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  // 'Jun 10' 형식으로 포맷팅 (월은 영문 약어, 일은 숫자)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
