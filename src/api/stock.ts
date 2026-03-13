import { apiClient } from "./client";
import { StockPriceHistoryResponse } from "@/types/api";

/**
 * 주식 종목 관련 API 호출 객체
 */
export const stockApi = {
  /**
   * 인기 검색 종목 리스트를 조회합니다.
   * @returns 인기 검색어(티커/종목명) 리스트
   */
  getPopularSearch: async (): Promise<string[]> => {
    const { data } = await apiClient.get("/v1/stocks/popular");
    return data;
  },

  /**
   * 검색어로 주식 종목을 검색합니다.
   * @param keyword 검색어 (종목명 또는 티커)
   * @returns 검색 결과 리스트
   */
  search: async (keyword: string) => {
    const { data } = await apiClient.get("/v1/stocks/search", {
      params: { keyword },
    });
    return data;
  },

  /**
   * 특정 종목의 과거 주가 이력 데이터를 조회합니다.
   * @param ticker 종목 티커
   * @param period 조회 기간 (기본값: 1Y)
   * @returns 일별 주가 이력 및 벤치마크 데이터
   */
  getPriceHistory: async (ticker: string, period = "1Y"): Promise<StockPriceHistoryResponse> => {
    const { data } = await apiClient.get(`/v1/stocks/${ticker}/prices/history`, {
      params: { period },
    });
    return data;
  },

  /**
   * 특정 종목의 기간별 수익률 데이터를 조회합니다.
   * @param ticker 종목 티커
   * @param period 조회 기간 (기본값: 1Y)
   * @returns 해당 기간 내 종목 수익률 정보
   */
  getReturns: async (ticker: string, period = "1Y") => {
    const { data } = await apiClient.get(`/v1/stocks/${ticker}/returns`, {
      params: { period },
    });
    return data;
  }
};
