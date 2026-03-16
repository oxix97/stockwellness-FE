export const calculateReturnRate = (current: number, original: number): number => {
  if (original === 0) return 0;
  return Number(((current - original) / original * 100).toFixed(2));
};

export const calculatePriceChange = (current: number, original: number): number => {
  return current - original;
};

export const getPriceStatus = (change: number): 'up' | 'down' | 'neutral' => {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'neutral';
};
