import { useMutation, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { BacktestRequest, BacktestResponse, ChartPeriod, PortfolioInceptionChartResponse } from "@/types/api";
import { useAuthStore } from "@/store/auth";

export type Period = ChartPeriod;

const PERIOD_DAYS: Record<string, number> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
};

/**
 * 백테스트 결과를 기간별로 필터링합니다.
 */
export function sliceByPeriod(
  results: { date: string }[] | undefined,
  period: string
): typeof results {
  if (!results || results.length === 0) return [];
  
  const upperPeriod = period.toUpperCase();
  const days = PERIOD_DAYS[upperPeriod] || Infinity;
  
  if (days === Infinity) return results;

  const lastDate = new Date(results[results.length - 1].date);
  const cutoff = new Date(lastDate);
  cutoff.setDate(cutoff.getDate() - days);

  return results.filter((r) => {
    const rDate = new Date(r.date);
    return rDate >= cutoff;
  });
}

/**
 * 백테스트 일별 결과로부터 성과 지표를 계산합니다.
 */
export function computeMetrics(results: any[] | undefined) {
  if (!results || results.length === 0) return null;

  const first = results[0];
  const last = results[results.length - 1];

  // 필드명 호환성 처리 (Backtest vs InceptionChart)
  const totalReturn = last.returnRate ?? last.portfolioReturnRate ?? 0;
  const benchmarkReturn = last.benchmarkReturnRate ?? (last.benchmarkReturnRates ? Object.values(last.benchmarkReturnRates)[0] : 0) ?? 0;
  
  const totalValue = last.totalValue ?? (1 + (totalReturn / 100)); // 기준값 1
  const initialValue = first.totalValue ?? (1 + (first.returnRate ?? first.portfolioReturnRate ?? 0) / 100);

  // MDD: 구간 최고점 대비 최대 낙폭 (수익률 기반으로 계산)
  let peak = -Infinity;
  let mdd = 0;
  for (const r of results) {
    const val = r.returnRate ?? r.portfolioReturnRate ?? 0;
    if (val > peak) peak = val;
    const drawdown = (val - peak);
    if (drawdown < mdd) mdd = drawdown;
  }

  // CAGR: 연평균 성장률 (거래일 252일 기준)
  // 수익률(%)을 배수로 변환하여 계산: (1 + r/100)
  const years = Math.max(0.1, results.length / 252);
  const finalMultiplier = 1 + (totalReturn / 100);
  const initialMultiplier = 1 + (results[0].returnRate ?? results[0].portfolioReturnRate ?? 0) / 100;
  const cagr = (Math.pow(Math.max(0.01, finalMultiplier / initialMultiplier), 1 / years) - 1) * 100;

  // Sharpe Ratio: 일별 수익률의 평균 / 표준편차 * sqrt(252)
  const dailyReturns = results.slice(1).map((r, i) => {
    const prevRate = results[i].returnRate ?? results[i].portfolioReturnRate ?? 0;
    return (r.returnRate ?? r.portfolioReturnRate ?? 0) - prevRate;
  });
  
  let sharpeRatio = 0;
  if (dailyReturns.length > 0) {
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
    sharpeRatio = variance > 0 ? (meanReturn / Math.sqrt(variance)) * Math.sqrt(252) : 0;
  }

  return {
    totalReturn: +totalReturn.toFixed(1),
    benchmarkReturn: +benchmarkReturn.toFixed(1),
    outperformance: +(totalReturn - benchmarkReturn).toFixed(1),
    mdd: +Math.abs(mdd).toFixed(1),
    sharpeRatio: +sharpeRatio.toFixed(2),
    cagr: +cagr.toFixed(1),
  };
}

/**
 * 활성 포트폴리오에 대한 백테스트 시뮬레이션을 실행하고 기간별 결과를 제공합니다.
 */
export function usePortfolioSimulation(period: ChartPeriod) {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  const query = useQuery<PortfolioInceptionChartResponse>({
    queryKey: ["backtest", "simulation", portfolioId], // period를 queryKey에서 제거하여 한 번만 호출
    queryFn: () => portfolioApi.getInceptionChart(portfolioId!),
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 10,
  });

  const slicedResults = query.data
    ? sliceByPeriod(query.data.dailyResults, period)
    : undefined;

  return {
    ...query,
    data: slicedResults ? { ...query.data!, dailyResults: slicedResults } : query.data,
  };
}

export function useBacktest(period?: string) {
  const portfolioId = useAuthStore((state) => state.portfolioId) || "1";

  const mutation = useMutation({
    mutationFn: (params: BacktestRequest) => portfolioApi.runBacktest(portfolioId, params),
  });

  // 서버 응답 데이터를 우선 사용하되, 전달된 period가 있다면 한번 더 필터링 검증
  const data = mutation.data;
  const processedResults = (data && period) 
    ? sliceByPeriod(data.dailyResults, period) 
    : data?.dailyResults;

  return {
    run: mutation.mutate,
    runAsync: mutation.mutateAsync,
    data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    /** 기간 슬라이싱된 결과 기반 클라이언트 계산 지표 */
    metrics: processedResults ? computeMetrics(processedResults) : null,
    /** BE 서버 계산 지표 — 전체 기간 기준 (슬라이싱 미적용) */
    serverMetrics: data
      ? {
          cagr: data.cagr,
          mdd: data.mdd,
          sharpeRatio: data.sharpeRatio,
          beta: data.beta,
          bestYearRate: data.bestYearRate,
          worstYearRate: data.worstYearRate,
          alpha: data.alpha,
          totalReturnRate: data.totalReturnRate,
          // 기간 필터링(period)이 있는 경우 클라이언트 재계산값을 우선시할지 여부는 UI 요구사항에 따라 다르나,
          // 여기서는 '전체 기간' 기준 서버 데이터를 반환함을 명시
        }
      : null,
    /** BE Spring AI 연동 완료 시 제공되는 AI 코멘트. null이면 클라이언트 룰 기반 사용 */
    aiComment: data?.aiComment ?? null,
  };
}
