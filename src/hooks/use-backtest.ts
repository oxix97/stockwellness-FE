import { useMutation, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { BacktestRequest, ChartPeriod, PortfolioInceptionChartResponse } from "@/types/api";
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
  
  // MDD: 구간 최고점 대비 최대 낙폭 (수익률 기반으로 계산)
  let peak = -Infinity;
  let mdd = 0;
  let peakDate = results[0].date;
  let recoveryPeriod = 0; // in days

  for (const r of results) {
    const val = r.returnRate ?? r.portfolioReturnRate ?? 0;
    if (val > peak) {
      peak = val;
      peakDate = r.date;
    }
    const drawdown = (val - peak);
    if (drawdown < mdd) mdd = drawdown;

    // Recovery period calculation (최고점 경신 전까지의 최장 기간)
    if (val < peak) {
      const daysSincePeak = (new Date(r.date).getTime() - new Date(peakDate).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSincePeak > recoveryPeriod) recoveryPeriod = Math.round(daysSincePeak);
    }
  }

  // CAGR: 연평균 성장률 (거래일 252일 기준)
  const years = Math.max(0.1, results.length / 252);
  const finalMultiplier = 1 + (totalReturn / 100);
  const initialMultiplier = 1 + (first.returnRate ?? first.portfolioReturnRate ?? 0) / 100;
  const cagr = (Math.pow(Math.max(0.01, finalMultiplier / initialMultiplier), 1 / years) - 1) * 100;

  // 수익률 변화량(Return Diff) 계산 헬퍼
  const getDailyReturns = (items: any[], key: string, fallbackKey?: string, nestedMapKey?: string) => 
    items.slice(1).map((r, i) => {
      const getVal = (obj: any) => {
        if (nestedMapKey && obj[nestedMapKey]) return Object.values(obj[nestedMapKey])[0] as number;
        return (obj[key] ?? (fallbackKey ? obj[fallbackKey] : 0) ?? 0) as number;
      };
      return getVal(r) - getVal(items[i]);
    });

  const dailyReturns = getDailyReturns(results, 'returnRate', 'portfolioReturnRate');
  const benchmarkReturns = getDailyReturns(results, 'benchmarkReturnRate', undefined, 'benchmarkReturnRates');

  // Sharpe Ratio: 일별 수익률의 평균 / 표준편차 * sqrt(252)
  let sharpeRatio = 0;
  if (dailyReturns.length > 0) {
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
    sharpeRatio = variance > 0 ? (meanReturn / Math.sqrt(variance)) * Math.sqrt(252) : 0;
  }

  // Beta calculation
  let beta = 1;
  if (dailyReturns.length > 0 && benchmarkReturns.length > 0) {
    const meanPortfolio = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const meanBenchmark = benchmarkReturns.reduce((a, b) => a + b, 0) / benchmarkReturns.length;
    
    let covariance = 0;
    let benchmarkVariance = 0;
    for (let i = 0; i < dailyReturns.length; i++) {
      covariance += (dailyReturns[i] - meanPortfolio) * (benchmarkReturns[i] - meanBenchmark);
      benchmarkVariance += Math.pow(benchmarkReturns[i] - meanBenchmark, 2);
    }
    
    beta = benchmarkVariance > 0.000001 ? covariance / benchmarkVariance : 1;
  }

  return {
    totalReturn: +totalReturn.toFixed(1),
    benchmarkReturn: +benchmarkReturn.toFixed(1),
    outperformance: +(totalReturn - benchmarkReturn).toFixed(1),
    finalValue: last.totalValue ?? 0,
    mdd: +Math.abs(mdd).toFixed(1),
    sharpeRatio: +sharpeRatio.toFixed(2),
    cagr: +cagr.toFixed(1),
    beta: +beta.toFixed(2),
    recoveryPeriod: recoveryPeriod,
  };
}

/**
 * 활성 포트폴리오에 대한 백테스트 시뮬레이션을 실행하고 기간별 결과를 제공합니다.
 */
export function usePortfolioSimulation(period: ChartPeriod) {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  const query = useQuery<PortfolioInceptionChartResponse>({
    queryKey: ["backtest", "simulation", portfolioId], 
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
    metrics: processedResults ? computeMetrics(processedResults) : null,
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
    aiComment: data?.aiComment ?? null,
  };
}
