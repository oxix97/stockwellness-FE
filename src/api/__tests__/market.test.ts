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

  it("getLatestWeather — 기본 KOSPI와 명시 KOSDAQ, 빈 null 응답을 처리한다", async () => {
    const kospiWeather = {
      baseDate: "2026-11-16",
      marketType: "KOSPI",
      weatherScore: 48,
      weatherState: "CLOUDY",
      weatherEmoji: "⛅",
      aiSummary: null,
      topSectors: [],
      bottomSectors: [],
    };
    mockClient.get.mockResolvedValueOnce(kospiWeather);
    const defaultResult = await marketApi.getLatestWeather();
    expect(mockClient.get).toHaveBeenCalledWith("/v1/market-weather/latest", {
      params: { marketType: "KOSPI" },
    });
    expect(defaultResult).toEqual(kospiWeather);

    mockClient.get.mockResolvedValueOnce(null);
    const emptyKosdaqResult = await marketApi.getLatestWeather("KOSDAQ");
    expect(mockClient.get).toHaveBeenCalledWith("/v1/market-weather/latest", {
      params: { marketType: "KOSDAQ" },
    });
    expect(emptyKosdaqResult).toBeNull();
  });

  it("getLatestWeather — 요청 시장과 다른 marketType 응답이나 undefined는 null로 처리한다", async () => {
    mockClient.get.mockResolvedValueOnce({
      baseDate: "2026-11-16",
      marketType: "KOSPI",
      weatherScore: 48,
      weatherState: "CLOUDY",
      weatherEmoji: "⛅",
      aiSummary: null,
      topSectors: [],
      bottomSectors: [],
    });

    const mismatched = await marketApi.getLatestWeather("KOSDAQ");
    expect(mismatched).toBeNull();

    mockClient.get.mockResolvedValueOnce(undefined);
    const undefinedResult = await marketApi.getLatestWeather("KOSPI");
    expect(undefinedResult).toBeNull();
  });
});
