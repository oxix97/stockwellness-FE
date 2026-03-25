export const formatCurrency = (value: number): string => {
  return value.toLocaleString('ko-KR');
};

export const formatPercent = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  // 'Jun 10' 형식으로 포맷팅 (월은 영문 약어, 일은 숫자)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
