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
    const mockData = [
      { ticker: "^KS11", name: "KOSPI", currentPrice: 2750.5, fluctuationRate: 1.2, fluctuationAmount: 32.5 },
    ];
    mockClient.get.mockResolvedValue(mockData);

    const result = await marketApi.getMarketIndexes();

    expect(mockClient.get).toHaveBeenCalledWith("/v1/market/indexes");
    expect(result).toEqual(mockData);
  });
});
