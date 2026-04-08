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

  it("getFluctuationRanking — GET /v1/sectors/ranking/fluctuation 호출 및 언래핑 확인", async () => {
    const mockResponse = { 
      code: "COMMON-200",
      data: [
        { sectorCode: "IT", sectorName: "정보기술", fluctuationRate: 2.5 }
      ],
      success: true 
    };
    mockClient.get.mockResolvedValue(mockResponse);

    const result = await sectorApi.getFluctuationRanking();

    expect(mockClient.get).toHaveBeenCalledWith("/v1/sectors/ranking/fluctuation", { params: undefined });
    // 인터셉터에서 한 번 언래핑된 mockResponse가 들어오고, API에서 data를 한 번 더 언래핑함
    expect(result).toEqual(mockResponse.data);
  });

  it("getSectorDetail — GET /v1/sectors/:code/detail 호출 및 언래핑 확인", async () => {
    const mockResponse = {
      code: "COMMON-200",
      data: { sectorCode: "IT", diagnosisMessage: "긍정적" },
      success: true
    };
    mockClient.get.mockResolvedValue(mockResponse);

    const result = await sectorApi.getSectorDetail("IT");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/sectors/IT/detail", { params: { date: undefined } });
    expect(result).toEqual(mockResponse.data);
  });

  it("compareWithMarket — GET /v1/sectors/:code/comparison 호출", async () => {
    const mockData = { sectorCode: "IT", comparisonData: [] };
    mockClient.get.mockResolvedValue(mockData);

    const result = await sectorApi.compareWithMarket("IT");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/sectors/IT/comparison", { params: { date: undefined } });
    expect(result).toEqual(mockData);
  });
});
