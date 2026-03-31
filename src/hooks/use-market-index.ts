import { useQuery } from "@tanstack/react-query";
import { marketApi } from "@/api/market";
import { MarketIndexResult } from "@/types/api";

/**
 * 시장 지수 데이터 훅 (KOSPI / KOSDAQ / S&P500).
 * BE: GET /api/v1/market/indexes — MarketIndexService → LoadBenchmarkPort
 */
export function useMarketIndex() {
  return useQuery<MarketIndexResult[]>({
    queryKey: ["market", "indexes"],
    queryFn: () => marketApi.getMarketIndexes(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
