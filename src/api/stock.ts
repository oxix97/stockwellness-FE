import { apiClient } from "./client";
import {
  StockPriceHistoryResponse,
  StockSearchResponse,
  NewListingStock,
  ChartPeriod,
  ChartFrequency,
  StockDetailResult,
  StockSupplyRankingParams,
  StockSupplyRankingResponse,
  StockReturnsResponse,
} from "@/types/api";

/**
 * 주식 종목 관련 API 호출 객체
 */
export const stockApi = {
  /**
   * 종목 상세 정보를 조회합니다.
   * @param ticker 종목 티커
   * @returns 종목 상세 정보
   */
  getStockDetail: async (ticker: string): Promise<StockDetailResult> => {
    const data = await apiClient.get<StockDetailResult>(`/v1/stocks/${ticker}`);
    return data;
  },

  /**
   * 인기 검색 종목 리스트를 조회합니다.
   * @returns 인기 검색어(티커/종목명) 리스트
   */
  getPopularSearch: async (): Promise<string[]> => {
    const data = await apiClient.get<string[]>("/v1/stocks/popular-search");
    return data;
  },

  /**
   * 검색어로 주식 종목을 검색합니다.
   * @param keyword 검색어 (종목명 또는 티커)
   * @param page 페이지 번호 (0부터 시작)
   * @param sectorCode 업종 코드 (필요 시)
   * @param sectorName 업종명 (필요 시, 코스피/코스닥 통합 검색용)
   * @returns 검색 결과 리스트 (Slice 형태)
   */
  search: async (keyword: string, page = 0, sectorCode?: string, sectorName?: string): Promise<StockSearchResponse> => {
    const data = await apiClient.get<StockSearchResponse>("/v1/stocks/search", {
      params: { keyword, page, sectorCode, sectorName, size: 20 },
    });
    return data;
  },

  /**
   * 신규 상장 종목 목록을 조회합니다.
   * @returns 신규 상장 종목 리스트
   */
  getNewListings: async (): Promise<NewListingStock[]> => {
    const data = await apiClient.get<NewListingStock[]>("/v1/stocks/new-listings");
    return data;
  },

  /**
   * 종목 수급 랭킹을 조회합니다.
   * @param params 조회 조건
   * @returns 기관/외국인 수급 랭킹
   */
  getSupplyRanking: async (
    params?: StockSupplyRankingParams
  ): Promise<StockSupplyRankingResponse> => {
    const data = await apiClient.get<StockSupplyRankingResponse>("/v1/stocks/ranking/supply", { params });
    return data;
  },

  /**
   * 최근 검색어 목록을 조회합니다.
   * @returns 최근 검색어 리스트
   */
  getSearchHistory: async (): Promise<string[]> => {
    const data = await apiClient.get<string[]>("/v1/stocks/search/history");
    return data;
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
    const data = await apiClient.get<StockPriceHistoryResponse>(`/v1/stocks/${ticker}/prices/history`, {
      params: { period, frequency, includeBenchmark: true },
    });
    return data;
  },

  /**
   * 특정 종목의 기간별 수익률 데이터를 조회합니다.
   * @param ticker 종목 티커
   * @param period 조회 기간 (기본값: 1Y)
   * @returns 해당 기간 내 종목 수익률 정보
   */
  getReturns: async (ticker: string, period = "1Y"): Promise<StockReturnsResponse> => {
    const data = await apiClient.get<StockReturnsResponse>(`/v1/stocks/${ticker}/returns`, {
      params: { period },
    });
    return data;
  },
};
