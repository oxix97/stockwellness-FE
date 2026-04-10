import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../client";
import { marketApi } from "../market";

const mockClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe("marketApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getMarketIndexes — GET /v1/market/indexes 호출", async () => {
    const mockData = {
      indexes: [
        { ticker: "^KS11", name: "KOSPI", currentPrice: 2750.5, fluctuationRate: 1.2, fluctuationAmount: 32.5 },
      ],
      weather: {
        weatherLevel: "SUNNY",
        weatherMessage: "오늘의 증시는 맑음이에요",
        weatherDescription: "주요 지수가 안정적으로 오르며 투자심리가 비교적 좋은 편이에요",
        reasonCode: "STEADY_ADVANCE",
        asOfDate: "2026-04-08",
      },
    };
    mockClient.get.mockResolvedValue(mockData);

    const result = await marketApi.getMarketIndexes();

    expect(mockClient.get).toHaveBeenCalledWith("/v1/market/indexes");
    expect(result).toEqual(mockData);
  });
});
