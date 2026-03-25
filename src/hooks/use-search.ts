import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { stockApi } from "@/api/stock";
import { StockSearchResponse } from "@/types/api";

const HISTORY_KEY = ["search", "history"];
const POPULAR_KEY = ["search", "popular"];

/**
 * 전체화면 검색 오버레이에서 사용하는 훅.
 * - 인기 검색어 / 최근 검색어 / 실시간 자동완성 (300ms debounce + 무한 스크롤)
 */
export function useSearch() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const history = useQuery({
    queryKey: HISTORY_KEY,
    queryFn: stockApi.getSearchHistory,
  });

  const popular = useQuery({
    queryKey: POPULAR_KEY,
    queryFn: stockApi.getPopularSearch,
    staleTime: 1000 * 60 * 5,
  });

  const autocomplete = useInfiniteQuery({
    queryKey: ["search", "autocomplete", debouncedKeyword],
    queryFn: ({ pageParam = 0 }) => stockApi.search(debouncedKeyword, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage: StockSearchResponse) => (lastPage.hasNext ? lastPage.number + 1 : undefined),
    enabled: debouncedKeyword.length >= 1,
  });

  const deleteHistory = useMutation({
    mutationFn: stockApi.deleteSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HISTORY_KEY }),
  });

  const clearHistory = useMutation({
    mutationFn: stockApi.clearSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: HISTORY_KEY }),
  });

  return {
    keyword,
    setKeyword,
    history,
    popular,
    autocomplete,
    deleteHistory,
    clearHistory,
  };
}
