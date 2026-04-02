import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useStock } from "../use-stock";
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

    const { result } = renderHook(() => useStock().useHistory("005930", "6M", "WEEKLY"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(stockApi.getPriceHistory).toHaveBeenCalledWith("005930", "6M", "WEEKLY");
  });

  it("useHistory — MONTHLY 주기로 getPriceHistory를 호출한다", async () => {
    const mockData = { ticker: "005930", prices: [] };
    (stockApi.getPriceHistory as any).mockResolvedValue(mockData);

    const { result } = renderHook(() => useStock().useHistory("005930", "ALL", "MONTHLY"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(stockApi.getPriceHistory).toHaveBeenCalledWith("005930", "ALL", "MONTHLY");
  });
});
