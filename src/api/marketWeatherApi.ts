import { apiClient } from "./client";

export interface MarketWeatherResponse {
  baseDate: string;
  marketType: string;
  weatherScore: number;
  weatherState: string;
  weatherEmoji: string;
  aiSummary: string;
  topSectors: SectorWeatherDto[];
  bottomSectors: SectorWeatherDto[];
}

export interface SectorWeatherDto {
  sectorCode: string;
  sectorName: string;
  score: number;
  state: string;
  emoji: string;
  aiTitle: string;
  aiInsight: string;
}

export const marketWeatherKeys = {
  all: ["market-weather"] as const,
  latest: () => [...marketWeatherKeys.all, "latest"] as const,
};

export const marketWeatherApi = {
  getLatest: async (): Promise<MarketWeatherResponse> => {
    return await apiClient.get("/v1/market-weather/latest");
  },
};
