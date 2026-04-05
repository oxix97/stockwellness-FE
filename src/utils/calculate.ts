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

/**
 * 포트폴리오 점수에 따른 건강 상태 뱃지 정보를 반환합니다.
 */
export const calculateHealthBadge = (score: number) => {
  if (score >= 70) {
    return { label: "✅ 안정적", color: "bg-green-50 text-green-700", status: "STABLE" as const };
  }
  if (score >= 40) {
    return { label: "⚠️ 주의", color: "bg-amber-50 text-amber-700", status: "CAUTION" as const };
  }
  return { label: "🔴 위험", color: "bg-red-50 text-red-700", status: "DANGER" as const };
};

/**
 * 건강 점수에 따른 투자 성향 타입을 반환합니다.
 */
export const calculateInvestorType = (score: number | undefined) => {
  if (score === undefined) return { label: "분석 중...", color: "text-muted-foreground" };
  if (score >= 80) return { label: "이성적인 자산배분가", color: "text-primary" };
  if (score >= 60) return { label: "성장 추구형 투자자", color: "text-primary" };
  if (score >= 40) return { label: "안정 지향형 투자자", color: "text-amber-600" };
  return { label: "공격형 투자자", color: "text-red-500" };
};
