import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockApi, StockReturnsResponse } from "@/api/stock";
import { StockSearchResponse, StockPriceHistoryResponse, NewListingStock, ChartPeriod, ChartFrequency, StockDetailResult } from "@/types/api";

/**
 * 주식 종목 데이터 조회를 위한 커스텀 훅
 */
export function useStock() {
  /** 신규 상장 종목 조회 */
  const newListings = useQuery<NewListingStock[]>({
    queryKey: ["stocks", "new-listings"],
    queryFn: () => stockApi.getNewListings(),
    select: (data) => data.slice(0, 10),
    staleTime: 1000 * 60 * 60, // 1시간
  });

  /**
   * 종목 과거 주가 이력 쿼리
   * @param ticker 종목 티커
   * @param period 조회 기간
   */
  const useHistory = (ticker: string, period: ChartPeriod, frequency: ChartFrequency = "DAILY") => useQuery<StockPriceHistoryResponse>({
    queryKey: ["stocks", ticker, "history", period, frequency],
    queryFn: () => stockApi.getPriceHistory(ticker, period, frequency),
    enabled: !!ticker,
  });

  /**
   * 종목 수익률 데이터 쿼리
   * @param ticker 종목 티커
   * @param period 조회 기간
   */
  const useReturns = (ticker: string, period: string) => useQuery<StockReturnsResponse>({
    queryKey: ["stocks", ticker, "returns", period],
    queryFn: () => stockApi.getReturns(ticker, period),
    enabled: !!ticker,
  });

  /**
   * 종목 상세 정보 쿼리
   * @param ticker 종목 티커
   */
  const useDetail = (ticker: string) => useQuery<StockDetailResult>({
    queryKey: ["stocks", ticker, "detail"],
    queryFn: () => stockApi.getStockDetail(ticker),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 60, // 상세 정보는 1시간 동안 유지
  });

  return {
    newListings,
    useHistory,
    useReturns,
    useDetail,
  };
}
