import { apiClient } from "./client";
import {
  MarketDashboardResult,
  MarketWeatherLatestResponse,
  MarketWeatherMarketType,
} from "@/types/api";

/**
 * 시장 지수 및 기상도 관련 API 호출 객체
 */
export const marketApi = {
  /**
   * 주요 시장 지수(KOSPI, KOSDAQ, S&P500 등) 정보를 조회합니다.
   * @returns 시장 지수 리스트
   */
  getMarketIndexes: async (): Promise<MarketDashboardResult> => {
    const data = await apiClient.get<MarketDashboardResult>("/v1/market/indexes");
    return data;
  },

  /**
   * 최신 완전 EOD 기준 시장 기상도를 조회합니다. (기본값 KOSPI, 지원 값: KOSPI/KOSDAQ)
   * 데이터가 없거나 미지원 시장일 경우 서버가 S000 + data 생략(null)을 반환합니다.
   */
  getLatestWeather: async (
    marketType: MarketWeatherMarketType = "KOSPI",
  ): Promise<MarketWeatherLatestResponse | null> => {
    const normalizedMarketType: MarketWeatherMarketType =
      marketType === "KOSDAQ" ? "KOSDAQ" : "KOSPI";
    const data = await apiClient.get<MarketWeatherLatestResponse | null>(
      "/v1/market-weather/latest",
      {
        params: { marketType: normalizedMarketType },
      },
    );
    if (!data) {
      return null;
    }
    if (data.marketType && data.marketType !== normalizedMarketType) {
      return null;
    }
    return data;
  },
};
