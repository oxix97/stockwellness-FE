import { apiClient } from "./client";
import { SectorRankingResponse, SectorDetailResponse, SectorSupplyResponse, SectorComparisonResponse } from "@/types/api";

type MaybeNestedData<T> = T | { data: T };

function unwrapMaybeNested<T>(data: MaybeNestedData<T>): T {
  return typeof data === "object" && data !== null && "data" in data
    ? data.data
    : data;
}

export const sectorKeys = {
  all: ["sectors"] as const,
  ranking: {
    fluctuation: (limit: number) => [...sectorKeys.all, "ranking", "fluctuation", limit] as const,
    supply: (limit: number) => [...sectorKeys.all, "ranking", "supply", limit] as const,
  },
  detail: (sectorCode: string | null | undefined, date?: string) =>
    [...sectorKeys.all, "detail", sectorCode, date] as const,
  comparison: (sectorCode: string, date?: string) =>
    [...sectorKeys.all, sectorCode, "comparison", date] as const,
};

/**
 * 섹터 관련 API 호출 객체
 */
export const sectorApi = {
  /**
   * 섹터 등락률 랭킹을 조회합니다.
   * @param params 날짜, 시장 구분, 조회 개수 등 쿼리 파라미터
   * @returns 섹터 랭킹 리스트
   */
  getFluctuationRanking: async (params?: { 
    date?: string; 
    marketType?: string; 
    limit?: number 
  }): Promise<SectorRankingResponse> => {
    const data = await apiClient.get<MaybeNestedData<SectorRankingResponse>>(
      "/v1/sectors/ranking/fluctuation",
      { params },
    );
    // SuccessEnvelope.data.data (중첩 엔벨로프) 대응
    return unwrapMaybeNested(data);
  },

  /**
   * 섹터 수급 랭킹을 조회합니다.
   * 외국인/기관 순매수 금액 및 연속 매수 일수 기반의 섹터 순위를 반환합니다.
   * @param params 날짜, 시장 구분, 조회 개수 등 쿼리 파라미터
   * @returns 섹터 수급 랭킹 리스트
   */
  getSupplyRanking: async (params?: {
    date?: string;
    marketType?: string;
    limit?: number;
  }): Promise<SectorSupplyResponse> => {
    const data = await apiClient.get<MaybeNestedData<SectorSupplyResponse>>(
      "/v1/sectors/ranking/supply",
      { params },
    );
    return unwrapMaybeNested(data);
  },

  /**
   * 특정 섹터의 상세 정보를 조회합니다.
   * @param sectorCode 섹터 코드
   * @param date 조회 날짜 (yyyy-MM-dd)
   * @returns 섹터 상세 인사이트, 기술적 지표, 주도주 정보
   */
  getSectorDetail: async (sectorCode: string, date?: string): Promise<SectorDetailResponse> => {
    const data = await apiClient.get<MaybeNestedData<SectorDetailResponse>>(`/v1/sectors/${sectorCode}/detail`, {
      params: { date } 
    });
    return unwrapMaybeNested(data);
  },

  /**
   * 특정 섹터와 전체 시장(KOSPI 등)의 수익률을 비교 조회합니다.
   * @param sectorCode 섹터 코드
   * @param date 조회 기준 날짜
   * @returns 섹터 vs 시장 비교 데이터
   */
  compareWithMarket: async (sectorCode: string, date?: string): Promise<SectorComparisonResponse> => {
    const data = await apiClient.get<SectorComparisonResponse>(`/v1/sectors/${sectorCode}/comparison`, {
      params: { date }
    });
    return data;
  },
};
