import { useMutation } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { BacktestRequest, BacktestResponse } from "@/types/api";
import { useAuthStore } from "@/store/auth";

export function useBacktest() {
  const portfolioId = useAuthStore((state) => state.portfolioId) || "1";

  const mutation = useMutation({
    mutationFn: (params: BacktestRequest) => portfolioApi.runBacktest(portfolioId, params),
  });

  const getMetrics = (data: BacktestResponse | undefined) => {
    if (!data || data.dailyResults.length === 0) return null;

    const results = data.dailyResults;
    const first = results[0];
    const last = results[results.length - 1];

    const totalReturn = last.returnRate;
    const benchmarkReturn = last.benchmarkReturnRate;
    const finalValue = last.totalValue;

    // MDD: 구간 최고점 대비 최대 낙폭
    let peak = first.totalValue;
    let mdd = 0;
    for (const r of results) {
      if (r.totalValue > peak) peak = r.totalValue;
      const drawdown = (r.totalValue - peak) / peak;
      if (drawdown < mdd) mdd = drawdown;
    }

    // CAGR: 연평균 성장률 (거래일 252일 기준)
    const years = results.length / 252;
    const cagr = years > 0
      ? (Math.pow(finalValue / first.totalInvested, 1 / years) - 1) * 100
      : 0;

    // Sharpe Ratio: 일별 수익률의 평균 / 표준편차 * sqrt(252)
    const dailyReturns = results.slice(1).map((r, i) => {
      const prev = results[i].totalValue;
      return prev > 0 ? (r.totalValue - prev) / prev : 0;
    });
    const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length;
    const sharpeRatio = variance > 0 ? (meanReturn / Math.sqrt(variance)) * Math.sqrt(252) : 0;

    // Beta: 포트폴리오 일별 수익률과 벤치마크 일별 수익률의 공분산 / 벤치마크 분산
    const benchmarkDailyReturns = results.slice(1).map((r, i) => {
      const prevRate = results[i].benchmarkReturnRate;
      return typeof r.benchmarkReturnRate === "number" && typeof prevRate === "number"
        ? r.benchmarkReturnRate - prevRate
        : 0;
    });
    const meanBenchmark = benchmarkDailyReturns.reduce((a, b) => a + b, 0) / benchmarkDailyReturns.length;
    const covariance = dailyReturns.reduce((acc, r, i) =>
      acc + (r - meanReturn) * (benchmarkDailyReturns[i] - meanBenchmark), 0
    ) / dailyReturns.length;
    const benchmarkVariance = benchmarkDailyReturns.reduce((a, b) =>
      a + Math.pow(b - meanBenchmark, 2), 0
    ) / benchmarkDailyReturns.length;
    const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;

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
  };

  return {
    run: mutation.mutate,
    runAsync: mutation.mutateAsync,
    data: mutation.data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    metrics: getMetrics(mutation.data),
  };
}
