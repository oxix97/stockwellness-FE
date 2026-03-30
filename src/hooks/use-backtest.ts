import { useMutation, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { BacktestRequest, BacktestResponse, ChartPeriod } from "@/types/api";
import { useAuthStore } from "@/store/auth";

const PERIOD_DAYS: Record<string, number> = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  "3Y": 365 * 3,
  "ALL": Infinity,
};

/**
 * 백테스트 결과를 기간별로 필터링합니다.
 */
export function sliceByPeriod(
  results: BacktestResponse["dailyResults"] | undefined,
  period: string
): BacktestResponse["dailyResults"] {
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
export function computeMetrics(results: BacktestResponse["dailyResults"] | undefined) {
  if (!results || results.length === 0) return null;

  const first = results[0];
  const last = results[results.length - 1];

  const totalReturn = last.returnRate ?? 0;
  const benchmarkReturn = last.benchmarkReturnRate ?? 0;
  const finalValue = last.totalValue ?? 0;
  const initialInvested = first.totalInvested ?? first.totalValue ?? 1;

  // MDD: 구간 최고점 대비 최대 낙폭
  let peak = first.totalValue || 0;
  let mdd = 0;
  for (const r of results) {
    if (r.totalValue > peak) peak = r.totalValue;
    const drawdown = peak > 0 ? (r.totalValue - peak) / peak : 0;
    if (drawdown < mdd) mdd = drawdown;
  }

  // CAGR: 연평균 성장률 (거래일 252일 기준)
  const years = Math.max(0.1, results.length / 252);
  const cagr = (Math.pow(Math.max(0.01, finalValue / initialInvested), 1 / years) - 1) * 100;

  // Sharpe Ratio: 일별 수익률의 평균 / 표준편차 * sqrt(252)
  const dailyReturns = results.slice(1).map((r, i) => {
    const prevRate = results[i].returnRate ?? 0;
    return (r.returnRate ?? 0) - prevRate;
  });
  
  let sharpeRatio = 0;
  if (dailyReturns.length > 0) {
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
    sharpeRatio = variance > 0 ? (meanReturn / Math.sqrt(variance)) * Math.sqrt(252) : 0;
  }

  // Beta: 포트폴리오 일별 수익률과 벤치마크 일별 수익률의 공분산 / 벤치마크 분산
  const benchmarkDailyReturns = results.slice(1).map((r, i) => {
    const prevRate = results[i].benchmarkReturnRate ?? 0;
    return (r.benchmarkReturnRate ?? 0) - prevRate;
  });
  
  let beta = 1;
  if (benchmarkDailyReturns.length > 0 && dailyReturns.length === benchmarkDailyReturns.length) {
    const meanBenchmark = benchmarkDailyReturns.reduce((a, b) => a + b, 0) / benchmarkDailyReturns.length;
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    
    const covariance = dailyReturns.reduce((acc, r, i) =>
      acc + (r - meanReturn) * (benchmarkDailyReturns[i] - meanBenchmark), 0
    ) / dailyReturns.length;
    
    const benchmarkVariance = benchmarkDailyReturns.reduce((a, b) =>
      a + Math.pow(b - meanBenchmark, 2), 0
    ) / benchmarkDailyReturns.length;
    
    beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1;
  }

  return {
    finalValue,
    totalReturn: +totalReturn.toFixed(1),
    benchmarkReturn: +benchmarkReturn.toFixed(1),
    outperformance: +(totalReturn - benchmarkReturn).toFixed(1),
    mdd: +(mdd * 100).toFixed(1),
    sharpeRatio: +sharpeRatio.toFixed(2),
    cagr: +cagr.toFixed(1),
    beta: +beta.toFixed(2),
  };
}

/**
 * 활성 포트폴리오에 대한 백테스트 시뮬레이션을 실행하고 기간별 결과를 제공합니다.
 */
export function usePortfolioSimulation(period: ChartPeriod) {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  const query = useQuery({
    queryKey: ["backtest", "simulation", portfolioId, period],
    queryFn: () =>
      portfolioApi.runBacktest(portfolioId!, {
        strategy: "LUMP_SUM",
        amount: 10_000_000,
        benchmarkTicker: "SPY",
        period: period as any, // ChartPeriod Union 대응
        rebalancingPeriod: "NONE",
      }),
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
        }
      : null,
    /** BE Spring AI 연동 완료 시 제공되는 AI 코멘트. null이면 클라이언트 룰 기반 사용 */
    aiComment: data?.aiComment ?? null,
  };
}
