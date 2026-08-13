import { useQuery } from "@tanstack/react-query";
import { marketApi } from "@/api/market";
import { MarketDashboardResult } from "@/types/api";

export const marketKeys = {
  indexes: () => ["market", "indexes"] as const,
};

/**
 * 시장 지수 데이터 훅 (KOSPI / KOSDAQ / S&P500).
 * BE: GET /api/v1/market/indexes — MarketIndexService → LoadBenchmarkPort
 */
export function useMarketIndex() {
  return useQuery<MarketDashboardResult>({
    queryKey: marketKeys.indexes(),
    queryFn: () => marketApi.getMarketIndexes(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
