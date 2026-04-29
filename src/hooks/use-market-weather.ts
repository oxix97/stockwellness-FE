import { useQuery } from "@tanstack/react-query";
import { marketWeatherApi, marketWeatherKeys } from "@/api/marketWeatherApi";

/**
 * 증시 기상도 데이터를 관리하는 커스텀 훅
 */
export function useMarketWeather() {
  return useQuery({
    queryKey: marketWeatherKeys.latest(),
    queryFn: () => marketWeatherApi.getLatest(),
    staleTime: 10 * 60 * 1000, // 10분 동안 신선한 데이터로 간주
  });
}
