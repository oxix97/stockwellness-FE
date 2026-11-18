import { useQuery } from "@tanstack/react-query";
import { marketApi } from "@/api/market";
import {
  MarketDashboardResult,
  MarketWeatherLatestResponse,
  MarketWeatherMarketType,
} from "@/types/api";

export const marketKeys = {
  indexes: () => ["market", "indexes"] as const,
  weather: (marketType: MarketWeatherMarketType = "KOSPI") => ["market", "weather", marketType] as const,
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

/**
 * 최신 시장 기상도 훅 (KOSPI 기본 / KOSDAQ).
 * BE: GET /api/v1/market-weather/latest?marketType=KOSPI|KOSDAQ
 */
export function useMarketWeather(marketType: MarketWeatherMarketType = "KOSPI") {
  const normalizedMarketType: MarketWeatherMarketType =
    marketType === "KOSDAQ" ? "KOSDAQ" : "KOSPI";

  return useQuery<MarketWeatherLatestResponse | null>({
    queryKey: marketKeys.weather(normalizedMarketType),
    queryFn: () => marketApi.getLatestWeather(normalizedMarketType),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
