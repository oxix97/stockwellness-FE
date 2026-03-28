import { apiClient } from "./client";
import { StockPriceHistoryResponse, StockSearchResponse, NewListingStock, ChartPeriod, ChartFrequency } from "@/types/api";

/** 종목 수익률 응답 타입 */
export interface StockReturnsResponse {
  /** 종목 티커 */
  ticker: string;
  /** 조회 기간 */
  period: string;
  /** 종목 수익률 (%) */
  stockReturnRate: number;
  /** 벤치마크 수익률 (%) */
  benchmarkReturnRate: number;
}

/**
 * 주식 종목 관련 API 호출 객체
 */
export const stockApi = {
  /**
   * 인기 검색 종목 리스트를 조회합니다.
   * @returns 인기 검색어(티커/종목명) 리스트
   */
  getPopularSearch: async (): Promise<string[]> => {
    const data = await apiClient.get<string[]>("/v1/stocks/popular-search");
    return data as unknown as string[];
  },

  /**
   * 검색어로 주식 종목을 검색합니다.
   * @param keyword 검색어 (종목명 또는 티커)
   * @param page 페이지 번호 (0부터 시작)
   * @returns 검색 결과 리스트 (Slice 형태)
   */
  search: async (keyword: string, page = 0): Promise<StockSearchResponse> => {
    const data = await apiClient.get<StockSearchResponse>("/v1/stocks/search", {
      params: { keyword, page, size: 20 },
    });
    return data as unknown as StockSearchResponse;
  },

  /**
   * 신규 상장 종목 목록을 조회합니다.
   * @returns 신규 상장 종목 리스트
   */
  getNewListings: async (): Promise<NewListingStock[]> => {
    const data = await apiClient.get("/v1/stocks/new-listings");
    return data as unknown as NewListingStock[];
  },

  /**
   * 최근 검색어 목록을 조회합니다.
   * @returns 최근 검색어 리스트
   */
  getSearchHistory: async (): Promise<string[]> => {
    const data = await apiClient.get("/v1/stocks/search/history");
    return data as unknown as string[];
  },

  /**
   * 특정 검색어를 최근 검색어에서 삭제합니다.
   * @param keyword 삭제할 검색어
   */
  deleteSearchHistory: async (keyword: string): Promise<void> => {
    await apiClient.delete("/v1/stocks/search/history", {
      params: { keyword },
    });
  },

  /**
   * 최근 검색어를 전체 삭제합니다.
   */
  clearSearchHistory: async (): Promise<void> => {
    await apiClient.delete("/v1/stocks/search/history/all");
  },

  /**
   * 특정 종목의 과거 주가 이력 데이터를 조회합니다.
   * @param ticker 종목 티커
   * @param period 조회 기간 (기본값: 1Y)
   * @returns 일별 주가 이력 및 벤치마크 데이터
   */
  getPriceHistory: async (ticker: string, period: ChartPeriod = "1Y", frequency: ChartFrequency = "DAILY"): Promise<StockPriceHistoryResponse> => {
    const data = await apiClient.get(`/v1/stocks/${ticker}/prices/history`, {
      params: { period, frequency, includeBenchmark: true },
    });
    return data as unknown as StockPriceHistoryResponse;
  },

  /**
   * 특정 종목의 기간별 수익률 데이터를 조회합니다.
   * @param ticker 종목 티커
   * @param period 조회 기간 (기본값: 1Y)
   * @returns 해당 기간 내 종목 수익률 정보
   */
  getReturns: async (ticker: string, period = "1Y"): Promise<StockReturnsResponse> => {
    const data = await apiClient.get(`/v1/stocks/${ticker}/returns`, {
      params: { period },
    });
    return data as unknown as StockReturnsResponse;
  },
};
