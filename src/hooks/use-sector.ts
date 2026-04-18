import { useQuery, useQueries } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { sectorApi } from "@/api/sector";
import { SectorComparisonResponse } from "@/types/api";

/**
 * 섹터 데이터를 관리하는 커스텀 훅
 */
export function useSector(limit = 10) {
  // 섹터 등락률 랭킹 조회
  const ranking = useQuery({
    queryKey: ["sectors", "ranking", "fluctuation", limit],
    queryFn: () => sectorApi.getFluctuationRanking({ limit }),
    staleTime: 5 * 60 * 1000, // 5분 동안 신선한 데이터로 간주
  });

  const sectorCodes = ranking.data?.map((s) => s.sectorCode) ?? [];

  // 상세 정보 병렬 조회 (섹터 코드가 있을 때만 실행)
  const details = useQueries({
    queries: sectorCodes.map((code) => ({
      queryKey: ["sectors", "detail", code],
      queryFn: () =>
        sectorApi.getSectorDetail(code).catch((error) => {
          // 당일 배치 미실행 시 detail 데이터 없음 → null로 처리 (ranking은 fallback 있으나 detail은 없음)
          if (isAxiosError(error) && error.response?.status === 404) return null;
          throw error;
        }),
      staleTime: 5 * 60 * 1000,
      enabled: !!code,
    })),
  });

  const isLoading = ranking.isLoading || details.some((d) => d.isLoading);

  // 랭킹 데이터가 배열인지 확인 (API 레이어에서 언래핑하나 타입 안전성 위해 체크)
  const rankingList = Array.isArray(ranking.data) ? ranking.data : [];

  // 1. 등락률 랭킹 아이템과 상세 정보를 매핑
  const combinedData = rankingList.map((item, index) => {
    const detail = details[index];
    const isDetailError = detail?.isError ?? false;
    const detailData = detail?.data;

    return {
      ...item,
      fluctuationRate: item.fluctuationRate ?? 0,
      diagnosisMessage: isDetailError
        ? "진단 정보를 불러오지 못했습니다."
        : detailData?.diagnosisMessage ?? "",
      leadingStocks: isDetailError
        ? []
        : detailData?.leadingStocks ?? [],
      technicalIndicators: isDetailError
        ? null
        : detailData?.technicalIndicators ?? null,
      detailLoading: detail?.isLoading ?? false,
      detailError: isDetailError,
      // 바텀시트에서 개별 상세 조회가 필요한 경우를 대비해 원본 보관 (백엔드 통합 시 1개 요소만 가짐)
      originGroup: [item]
    };
  });

  /**
   * 섹터 시장 비교 데이터 쿼리
  ...
   * @param date 조회 기준 날짜
   */
  const useComparison = (sectorCode: string, date?: string) => useQuery<SectorComparisonResponse>({
    queryKey: ["sectors", sectorCode, "comparison", date],
    queryFn: () => sectorApi.compareWithMarket(sectorCode, date),
    enabled: !!sectorCode,
    staleTime: 1000 * 60 * 60, // 1시간
  });

  return {
    data: combinedData,
    isLoading,
    isError: ranking.isError,
    isPartialError: details.some((d) => d.isError),
    useComparison,
  };
}

/**
 * 특정 섹터의 상세 정보만 조회하는 훅
 */
export function useSectorDetail(sectorCode: string | null, date?: string) {
  return useQuery({
    queryKey: ["sectors", "detail", sectorCode, date],
    queryFn: () => sectorApi.getSectorDetail(sectorCode!, date),
    enabled: !!sectorCode,
    staleTime: 5 * 60 * 1000,
  });
}
