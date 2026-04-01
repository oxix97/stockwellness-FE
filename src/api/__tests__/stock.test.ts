import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../client";
import { stockApi } from "../stock";

const mockClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("stockApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getStockDetail — GET /v1/stocks/:ticker 호출", async () => {
    const mockData = { ticker: "005930", name: "삼성전자", closePrice: 75000 };
    mockClient.get.mockResolvedValue(mockData);

    const result = await stockApi.getStockDetail("005930");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/stocks/005930");
    expect(result).toEqual(mockData);
  });

  it("getPopularSearch — GET /v1/stocks/popular-search 호출", async () => {
    const mockData = ["삼성전자", "SK하이닉스"];
    mockClient.get.mockResolvedValue(mockData);

    const result = await stockApi.getPopularSearch();

    expect(mockClient.get).toHaveBeenCalledWith("/v1/stocks/popular-search");
    expect(result).toEqual(mockData);
  });

  it("search — GET /v1/stocks/search 호출", async () => {
    const mockData = { content: [], hasNext: false };
    mockClient.get.mockResolvedValue(mockData);

    const result = await stockApi.search("삼성", 0);

    expect(mockClient.get).toHaveBeenCalledWith("/v1/stocks/search", {
      params: { keyword: "삼성", page: 0, size: 20 },
    });
    expect(result).toEqual(mockData);
  });

  it("getPriceHistory — GET /v1/stocks/:ticker/prices/history (DAILY) 호출", async () => {
    const mockData = { ticker: "005930", prices: [] };
    mockClient.get.mockResolvedValue(mockData);

    const result = await stockApi.getPriceHistory("005930", "1Y", "DAILY");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/stocks/005930/prices/history", {
      params: { period: "1Y", frequency: "DAILY", includeBenchmark: true },
    });
    expect(result).toEqual(mockData);
  });

  it("getPriceHistory — GET /v1/stocks/:ticker/prices/history (WEEKLY) 호출", async () => {
    const mockData = { 
      ticker: "005930", 
      prices: [
        { date: "2024-03-25", open: 70000, close: 75000, high: 76000, low: 69000, volume: 1000000 },
        { date: "2024-04-01", open: 75000, close: 78000, high: 79000, low: 74000, volume: 1200000 }
      ],
      benchmarks: []
    };
    mockClient.get.mockResolvedValue(mockData);

    const result = await stockApi.getPriceHistory("005930", "6M", "WEEKLY");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/stocks/005930/prices/history", {
      params: { period: "6M", frequency: "WEEKLY", includeBenchmark: true },
    });
    expect(result).toEqual(mockData);
  });
});
