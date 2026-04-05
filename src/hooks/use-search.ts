import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { stockApi } from "@/api/stock";
import { StockSearchResponse } from "@/types/api";

const HISTORY_KEY = ["stocks", "search", "history"];
const POPULAR_KEY = ["stocks", "popular"];

/**
 * 종목 검색 기능을 위한 통합 커스텀 훅
 * - 인기 검색어 / 최근 검색어 / 실시간 자동완성 (debounced)
 */
export function useSearch(initialKeyword: string = "") {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState(initialKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialKeyword);

  // 300ms 디바운스 적용
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 인기 검색 종목 쿼리
  const popular = useQuery<string[]>({
    queryKey: POPULAR_KEY,
    queryFn: () => stockApi.getPopularSearch().catch(() => []),
    staleTime: 1000 * 60 * 60,
    retry: false,
  });

  // 최근 검색어 조회 쿼리
  const history = useQuery<string[]>({
    queryKey: HISTORY_KEY,
    queryFn: () => stockApi.getSearchHistory().catch(() => []),
    staleTime: 0,
  });

  // 실시간 검색 (무한 스크롤 지원)
  const autocomplete = useInfiniteQuery<StockSearchResponse>({
    queryKey: ["stocks", "search", debouncedKeyword],
    queryFn: ({ pageParam = 0 }) => stockApi.search(debouncedKeyword, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage: StockSearchResponse) => (lastPage.hasNext ? lastPage.number + 1 : undefined),
    enabled: debouncedKeyword.length >= 2,
    staleTime: 1000 * 60 * 5,
  });

  // 검색어 개별 삭제
  const deleteHistory = useMutation({
    mutationFn: (keyword: string) => stockApi.deleteSearchHistory(keyword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
    },
  });

  // 검색어 전체 삭제
  const clearHistory = useMutation({
    mutationFn: () => stockApi.clearSearchHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
    },
  });

  return {
    keyword,
    setKeyword,
    debouncedKeyword,
    popular,
    history,
    autocomplete,
    deleteHistory,
    clearHistory,
  };
}
