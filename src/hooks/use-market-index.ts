import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

export interface MarketIndex {
  name: string;       // "KOSPI" | "KOSDAQ" | "S&P500"
  currentPrice: number;
  fluctuationRate: number;  // %
  // 미니 차트용 히스토리 (최근 7일)
  history: { date: string; close: number }[];
}

/**
 * 시장 지수 데이터 훅 (KOSPI / KOSDAQ / S&P500).
 * 백엔드 API: GET /v1/market/indexes
 * — 엔드포인트 확정 후 연동 (#67 참고)
 */
export function useMarketIndex() {
  return useQuery<MarketIndex[]>({
    queryKey: ["market", "indexes"],
    queryFn: async () => {
      const data = await apiClient.get("/v1/market/indexes");
      return data as unknown as MarketIndex[];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
