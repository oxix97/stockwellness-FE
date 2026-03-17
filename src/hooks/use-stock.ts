import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/api/stock";

/**
 * 주식 종목 데이터 조회를 위한 커스텀 훅
 */
export function useStock() {
  /** 인기 검색 종목 쿼리 */
  const popular = useQuery({
    queryKey: ["stocks", "popular"],
    queryFn: () => stockApi.getPopularSearch(),
  });

  /**
   * 종목 검색 쿼리
   * @param query 검색어 (2글자 이상 시 실행)
   */
  const useSearch = (query: string) => useQuery({
    queryKey: ["stocks", "search", query],
    queryFn: () => stockApi.search(query),
    enabled: query.length >= 2,
  });

  /**
   * 종목 과거 주가 이력 쿼리
   * @param ticker 종목 티커
   * @param period 조회 기간
   */
  const useHistory = (ticker: string, period: string) => useQuery({
    queryKey: ["stocks", ticker, "history", period],
    queryFn: () => stockApi.getPriceHistory(ticker, period),
    enabled: !!ticker,
  });

  /**
   * 종목 수익률 데이터 쿼리
   * @param ticker 종목 티커
   * @param period 조회 기간
   */
  const useReturns = (ticker: string, period: string) => useQuery({
    queryKey: ["stocks", ticker, "returns", period],
    queryFn: () => stockApi.getReturns(ticker, period),
    enabled: !!ticker,
  });

  /** 
   * 추천 섹터
   */
  const recommendedSectors = useQuery({
    queryKey: ["stocks", "sectors", "recommended"],
    queryFn: () => stockApi.getRecommendedSectors(),
  });

  return {
    popular,
    useSearch,
    useHistory,
    useReturns,
    recommendedSectors,
  };
}
