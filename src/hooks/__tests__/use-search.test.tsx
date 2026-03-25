import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithQuery } from "@/test/test-utils";
import { useSearch } from "../use-search";
import { stockApi } from "@/api/stock";

// API Mock
vi.mock("@/api/stock", () => ({
  stockApi: {
    getSearchHistory: vi.fn(),
    getPopularSearch: vi.fn(),
    search: vi.fn(),
    deleteSearchHistory: vi.fn(),
    clearSearchHistory: vi.fn(),
  },
}));

describe("useSearch (Infinite Query 리팩토링 검증)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("키워드 입력 시 300ms 디바운스 후 첫 페이지(0)를 요청한다", async () => {
    (stockApi.search as any).mockResolvedValue({
      content: [{ ticker: "AAPL", name: "Apple Inc." }],
      number: 0,
      hasNext: true,
    });

    const { result } = renderHookWithQuery(() => useSearch());

    // 키워드 입력
    act(() => {
      result.current.setKeyword("Apple");
    });

    // 디바운스 대기 및 API 호출 확인
    await waitFor(() => {
      expect(stockApi.search).toHaveBeenCalledWith("Apple", 0);
    });

    // 데이터가 성공적으로 로드되었는지 확인
    expect(result.current.autocomplete.data?.pages[0].content[0].ticker).toBe("AAPL");
  });

  it("fetchNextPage 호출 시 다음 페이지(1)를 요청한다", async () => {
    // 첫 페이지 응답
    (stockApi.search as any)
      .mockResolvedValueOnce({
        content: [{ ticker: "AAPL", name: "Apple Inc." }],
        number: 0,
        hasNext: true,
      })
      // 두 번째 페이지 응답
      .mockResolvedValueOnce({
        content: [{ ticker: "MSFT", name: "Microsoft" }],
        number: 1,
        hasNext: false,
      });

    const { result } = renderHookWithQuery(() => useSearch());

    // 키워드 입력 후 첫 페이지 로드 대기
    act(() => {
      result.current.setKeyword("Tech");
    });
    await waitFor(() => expect(result.current.autocomplete.isSuccess).toBe(true));

    // 다음 페이지 요청
    act(() => {
      result.current.autocomplete.fetchNextPage();
    });

    // 1페이지 호출 및 데이터 통합 확인
    await waitFor(() => {
      expect(stockApi.search).toHaveBeenCalledWith("Tech", 1);
      const allStocks = result.current.autocomplete.data?.pages.flatMap(p => p.content);
      expect(allStocks).toHaveLength(2);
    });

    const allStocks = result.current.autocomplete.data?.pages.flatMap(p => p.content);
    expect(allStocks?.[1].ticker).toBe("MSFT");
  });
});
