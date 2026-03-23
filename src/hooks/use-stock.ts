import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockApi, StockReturnsResponse } from "@/api/stock";
import { StockSearchResponse, StockPriceHistoryResponse, NewListingStock } from "@/types/api";

/**
 * 주식 종목 데이터 조회를 위한 커스텀 훅
 */
export function useStock() {
  const queryClient = useQueryClient();

  /** 인기 검색 종목 쿼리 — 비로그인 401 시 빈 배열로 graceful fallback */
  const popular = useQuery<string[]>({
    queryKey: ["stocks", "popular"],
    queryFn: () => stockApi.getPopularSearch().catch(() => []),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  /**
   * 종목 검색 무한 쿼리 (Slice 구조 활용)
   * @param query 검색어 (2글자 이상 시 실행)
   */
  const useSearch = (query: string) => useInfiniteQuery<StockSearchResponse>({
    queryKey: ["stocks", "search", query],
    queryFn: ({ pageParam = 0 }) => stockApi.search(query, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.number + 1 : undefined),
    enabled: query.trim().length >= 2,
    staleTime: 1000 * 60 * 5, // 검색 결과는 5분 동안 유지
  });

  /** 신규 상장 종목 조회 */
  const newListings = useQuery<NewListingStock[]>({
    queryKey: ["stocks", "new-listings"],
    queryFn: () => stockApi.getNewListings(),
    staleTime: 1000 * 60 * 60, // 1시간
  });

  /** 최근 검색어 조회 */
  const searchHistory = useQuery<string[]>({
    queryKey: ["stocks", "search", "history"],
    queryFn: () => stockApi.getSearchHistory(),
    staleTime: 0, // 항상 최신 데이터
  });

  /** 검색어 개별 삭제 */
  const deleteHistory = useMutation({
    mutationFn: (keyword: string) => stockApi.deleteSearchHistory(keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks", "search", "history"] });
    },
  });

  /** 검색어 전체 삭제 */
  const clearHistory = useMutation({
    mutationFn: () => stockApi.clearSearchHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks", "search", "history"] });
    },
  });

  /**
   * 종목 과거 주가 이력 쿼리
   * @param ticker 종목 티커
   * @param period 조회 기간
   */
  const useHistory = (ticker: string, period: string, frequency = "DAILY") => useQuery<StockPriceHistoryResponse>({
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

  return {
    popular,
    useSearch,
    newListings,
    searchHistory,
    deleteHistory,
    clearHistory,
    useHistory,
    useReturns,
  };
}
