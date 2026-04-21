export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(Number(value))) return '0';
  return value.toLocaleString('ko-KR');
};

export const formatPercent = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0.00%';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0.00%';
  
  // 0%일 경우 부호 없이 출력
  if (Math.abs(num) < 0.0001) return '0.00%';
  
  const sign = num > 0 ? '▲ ' : '▼ ';
  return `${sign}${Math.abs(num).toFixed(2)}%`;
};

export const formatSignedCurrency = (value: number | null | undefined): string => {
  const amount = value ?? 0;
  const prefix = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${prefix}₩${formatCurrency(Math.abs(amount))}`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  // 'Jun 10' 형식으로 포맷팅 (월은 영문 약어, 일은 숫자)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
