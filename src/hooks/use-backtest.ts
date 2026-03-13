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
    const last = results[results.length - 1];

    const totalReturn = last.returnRate;
    const benchmarkReturn = last.benchmarkReturnRate;
    const finalValue = last.totalValue;

    // UI를 위한 간소화된 지표 계산
    return {
      finalValue,
      totalReturn,
      benchmarkReturn,
      outperformance: totalReturn - benchmarkReturn,
      // 실제 앱에서는 MDD/CAGR/Sharpe 지표가 백엔드에서 오거나 여기서 계산됨
      mdd: -15.4, 
      sharpeRatio: 1.2,
      cagr: 12.5,
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
