import { apiClient } from "./client";
import { MarketDashboardResult } from "@/types/api";

/**
 * 시장 지수 관련 API 호출 객체
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
};
