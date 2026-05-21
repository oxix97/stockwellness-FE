import { useMutation, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { BacktestRequest, ChartPeriod, PortfolioInceptionChartResponse } from "@/types/api";
import { useAuthStore } from "@/store/auth";

export type Period = ChartPeriod;

/**
 * 기간(Period) 문자열에 따라 데이터 배열을 슬라이싱합니다.
 */
export function sliceByPeriod<T extends { date: string }>(items: T[] | undefined, period: Period): T[] {
  if (!items || items.length === 0) return [];
  if (period === "ALL") return items;

  const lastDate = new Date(items[items.length - 1].date);
  const startDate = new Date(lastDate);

  switch (period) {
    case "1W": startDate.setDate(lastDate.getDate() - 7); break;
    case "1M": startDate.setDate(lastDate.getDate() - 30); break;
    case "3M": startDate.setDate(lastDate.getDate() - 90); break;
    case "6M": startDate.setDate(lastDate.getDate() - 180); break;
    case "1Y": startDate.setDate(lastDate.getDate() - 365); break;
    case "3Y": startDate.setDate(lastDate.getDate() - 365 * 3); break;
    case "5Y": startDate.setDate(lastDate.getDate() - 365 * 5); break;
    default: return items;
  }

  return items.filter(item => new Date(item.date) >= startDate);
}

/**
 * 백테스트 일별 결과로부터 성과 지표를 계산합니다. (서버 지표가 없을 때를 위한 폴백)
 */
export function computeMetrics(results: any[] | undefined) {
  if (!results || results.length === 0) return null;

  const last = results[results.length - 1];

  // 필드명 호환성 처리 (Backtest vs InceptionChart)
  const totalReturn = last.returnRate ?? last.portfolioReturnRate ?? 0;
  const benchmarkReturn = last.benchmarkReturnRate ?? (last.benchmarkReturnRates ? Object.values(last.benchmarkReturnRates)[0] : 0) ?? 0;
  
  // MDD 계산 (간단 버전)
  let maxVal = -Infinity;
  let maxDrawdown = 0;
  results.forEach(r => {
    const val = r.totalValue ?? (1 + (r.returnRate ?? r.portfolioReturnRate ?? 0) / 100);
    if (val > maxVal) maxVal = val;
    const dd = (maxVal - val) / maxVal;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  return {
    totalReturn: +totalReturn.toFixed(1),
    benchmarkReturn: +benchmarkReturn.toFixed(1),
    outperformance: +(totalReturn - benchmarkReturn).toFixed(1),
    finalValue: last.totalValue ?? 0,
    mdd: +(maxDrawdown * 100).toFixed(1),
    sharpeRatio: 0,
    sortinoRatio: 0,
    cagr: 0,
    beta: 1,
    recoveryPeriod: 0,
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

  return query;
}

export function useBacktest(period?: string) {
  const portfolioId = useAuthStore((state) => state.portfolioId) || "1";

  const mutation = useMutation({
    mutationFn: (params: BacktestRequest) => portfolioApi.runBacktest(portfolioId, params),
  });

  const data = mutation.data;

  return {
    run: mutation.mutate,
    runAsync: mutation.mutateAsync,
    data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    metrics: data && data.totalReturnRate !== undefined ? {
        totalReturn: data.totalReturnRate,
        benchmarkReturn: data.comparisons?.[0]?.totalReturn ?? 0,
        outperformance: data.alpha,
        finalValue: data.dailyResults?.[data.dailyResults.length - 1]?.totalValue ?? 0,
        mdd: data.mdd,
        sharpeRatio: data.sharpeRatio,
        sortinoRatio: 0, // BE에서 아직 미지원 시 0
        cagr: data.cagr,
        beta: data.beta,
        recoveryPeriod: 0,
    } : null,
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
