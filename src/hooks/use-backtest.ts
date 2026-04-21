import { useMutation, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { BacktestRequest, ChartPeriod, PortfolioInceptionChartResponse } from "@/types/api";
import { useAuthStore } from "@/store/auth";

export type Period = ChartPeriod;

/**
 * 백테스트 일별 결과로부터 성과 지표를 계산합니다. (서버 지표가 없을 때를 위한 폴백)
 */
export function computeMetrics(results: any[] | undefined) {
  if (!results || results.length === 0) return null;

  const last = results[results.length - 1];

  // 필드명 호환성 처리 (Backtest vs InceptionChart)
  const totalReturn = last.returnRate ?? last.portfolioReturnRate ?? 0;
  const benchmarkReturn = last.benchmarkReturnRate ?? (last.benchmarkReturnRates ? Object.values(last.benchmarkReturnRates)[0] : 0) ?? 0;
  
  return {
    totalReturn: +totalReturn.toFixed(1),
    benchmarkReturn: +benchmarkReturn.toFixed(1),
    outperformance: +(totalReturn - benchmarkReturn).toFixed(1),
    finalValue: last.totalValue ?? 0,
    mdd: 0,
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
    metrics: data ? {
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
