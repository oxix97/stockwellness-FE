import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { stockKeys, useStock, useStockSupplyRanking } from "../use-stock";
import { stockApi } from "@/api/stock";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

// stockApi 모킹
vi.mock("@/api/stock", () => ({
  stockApi: {
    getPopularSearch: vi.fn(),
    search: vi.fn(),
    getNewListings: vi.fn(),
    getSearchHistory: vi.fn(),
    deleteSearchHistory: vi.fn(),
    clearSearchHistory: vi.fn(),
    getPriceHistory: vi.fn(),
    getReturns: vi.fn(),
    getStockDetail: vi.fn(),
    getSupplyRanking: vi.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useStock hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("useHistory — DAILY 주기로 getPriceHistory를 호출한다", async () => {
    const mockData = { ticker: "005930", prices: [] };
    (stockApi.getPriceHistory as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useStock().useHistory("005930", "3M", "DAILY"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(stockApi.getPriceHistory).toHaveBeenCalledWith("005930", "3M", "DAILY");
  });

  it("useHistory — WEEKLY 주기로 getPriceHistory를 호출한다", async () => {
    const mockData = { ticker: "005930", prices: [] };
    (stockApi.getPriceHistory as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useStock().useHistory("005930", "1Y", "WEEKLY"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(stockApi.getPriceHistory).toHaveBeenCalledWith("005930", "1Y", "WEEKLY");
  });

  it("useHistory — MONTHLY 주기로 getPriceHistory를 호출한다", async () => {
    const mockData = { ticker: "005930", prices: [] };
    (stockApi.getPriceHistory as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useStock().useHistory("005930", "5Y", "MONTHLY"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(stockApi.getPriceHistory).toHaveBeenCalledWith("005930", "5Y", "MONTHLY");
  });

  it("useStockSupplyRanking — 기본값 BUY, limit 10으로 호출한다", async () => {
    const mockData = {
      requestedDate: null,
      effectiveDate: "2026-04-07",
      institutionItems: [
        {
          ticker: "005930",
          stockName: "삼성전자",
          sectorName: "반도체",
          currentPrice: 71000,
          fluctuationRate: 1.43,
          netBuyingQuantity: 12345,
          netBuyingAmount: 1,
          transactionAmount: 2,
        },
      ],
      foreignItems: [],
    };
    (stockApi.getSupplyRanking as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useStockSupplyRanking(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(stockApi.getSupplyRanking).toHaveBeenCalledWith({
      date: undefined,
      direction: "BUY",
      limit: 10,
    });
  });

  it("stockKeys.ranking.supply — direction, date, limit별로 키를 분리한다", () => {
    expect(
      stockKeys.ranking.supply({ direction: "BUY", date: "2026-04-08", limit: 10 })
    ).not.toEqual(
      stockKeys.ranking.supply({ direction: "SELL", date: "2026-04-08", limit: 10 })
    );

    expect(
      stockKeys.ranking.supply({ direction: "BUY", date: "2026-04-08", limit: 10 })
    ).not.toEqual(
      stockKeys.ranking.supply({ direction: "BUY", date: "2026-04-07", limit: 10 })
    );

    expect(
      stockKeys.ranking.supply({ direction: "BUY", date: "2026-04-08", limit: 10 })
    ).not.toEqual(
      stockKeys.ranking.supply({ direction: "BUY", date: "2026-04-08", limit: 5 })
    );
  });
});
