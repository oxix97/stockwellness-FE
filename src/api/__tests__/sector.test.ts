import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

import { apiClient } from "../client";
import { sectorApi } from "../sector";

const mockClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
};

describe("sectorApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getFluctuationRanking — GET /v1/sectors/ranking/fluctuation 호출", async () => {
    const mockData = { data: [] };
    mockClient.get.mockResolvedValue(mockData);

    const result = await sectorApi.getFluctuationRanking();

    expect(mockClient.get).toHaveBeenCalledWith("/v1/sectors/ranking/fluctuation", { params: undefined });
    expect(result).toEqual(mockData);
  });

  it("getSectorDetail — GET /v1/sectors/:code/detail 호출", async () => {
    const mockData = { sectorCode: "IT", fluctuationRate: 2.5 };
    mockClient.get.mockResolvedValue(mockData);

    const result = await sectorApi.getSectorDetail("IT");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/sectors/IT/detail", { params: { date: undefined } });
    expect(result).toEqual(mockData);
  });

  it("compareWithMarket — GET /v1/sectors/:code/comparison 호출", async () => {
    const mockData = { sectorCode: "IT", comparisonData: [] };
    mockClient.get.mockResolvedValue(mockData);

    const result = await sectorApi.compareWithMarket("IT");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/sectors/IT/comparison", { params: { date: undefined } });
    expect(result).toEqual(mockData);
  });
});
