import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/api/stock";
import {
  StockPriceHistoryResponse,
  NewListingStock,
  ChartPeriod,
  ChartFrequency,
  StockDetailResult,
  StockSupplyRankingParams,
  StockSupplyRankingResponse,
  TradeDirection,
  StockReturnsResponse,
} from "@/types/api";

export const stockKeys = {
  all: ["stocks"] as const,
  newListings: () => ["stocks", "new-listings"] as const,
  ranking: {
    supply: (params: {
      date?: string;
      direction?: TradeDirection;
      limit?: number;
    }) => ["stocks", "ranking", "supply", params] as const,
  },
  detail: (ticker: string) => ["stocks", ticker, "detail"] as const,
  history: (ticker: string, period: ChartPeriod, frequency: ChartFrequency) =>
    ["stocks", ticker, "history", period, frequency] as const,
  returns: (ticker: string, period: string) => ["stocks", ticker, "returns", period] as const,
};

export function useStockSupplyRanking(params?: StockSupplyRankingParams) {
  const normalizedParams = {
    date: params?.date,
    direction: params?.direction ?? "BUY",
    limit: params?.limit ?? 10,
  };

  return useQuery<StockSupplyRankingResponse>({
    queryKey: stockKeys.ranking.supply(normalizedParams),
    queryFn: () => stockApi.getSupplyRanking(normalizedParams),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 주식 종목 데이터 조회를 위한 커스텀 훅
 */
export function useStock() {
  /** 신규 상장 종목 조회 */
  const newListings = useQuery<NewListingStock[]>({
    queryKey: stockKeys.newListings(),
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
    queryKey: stockKeys.history(ticker, period, frequency),
    queryFn: () => stockApi.getPriceHistory(ticker, period, frequency),
    enabled: !!ticker,
  });

  /**
   * 종목 수익률 데이터 쿼리
   * @param ticker 종목 티커
   * @param period 조회 기간
   */
  const useReturns = (ticker: string, period: string) => useQuery<StockReturnsResponse>({
    queryKey: stockKeys.returns(ticker, period),
    queryFn: () => stockApi.getReturns(ticker, period),
    enabled: !!ticker,
  });

  /**
   * 종목 상세 정보 쿼리
   * @param ticker 종목 티커
   */
  const useDetail = (ticker: string) => useQuery<StockDetailResult>({
    queryKey: stockKeys.detail(ticker),
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
