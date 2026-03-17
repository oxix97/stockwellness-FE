import { useQuery, useQueries } from "@tanstack/react-query";
import { sectorApi } from "@/api/sector";

/**
 * 섹터 데이터를 관리하는 커스텀 훅
 */
export function useSector() {
  // 섹터 등락률 랭킹 조회 (기본 상위 3개)
  const ranking = useQuery({
    queryKey: ["sectors", "ranking", "fluctuation"],
    queryFn: () => sectorApi.getFluctuationRanking({ limit: 3 }),
    staleTime: 5 * 60 * 1000, // 5분 동안 신선한 데이터로 간주
  });

  const sectorCodes = ranking.data?.map((s) => s.sectorCode) ?? [];

  // 상세 정보 병렬 조회 (섹터 코드가 있을 때만 실행)
  const details = useQueries({
    queries: sectorCodes.map((code) => ({
      queryKey: ["sectors", "detail", code],
      queryFn: () => sectorApi.getSectorDetail(code),
      staleTime: 5 * 60 * 1000,
      enabled: !!code,
    })),
  });

  const isLoading = ranking.isLoading || details.some((d) => d.isLoading);

  // 랭킹 데이터에 상세 진단 메시지와 주도주 정보를 결합
  const combinedData =
    ranking.data?.map((item, index) => ({
      ...item,
      diagnosisMessage: details[index]?.data?.diagnosisMessage ?? "",
      leadingStocks: details[index]?.data?.leadingStocks ?? [],
    })) ?? [];

  return {
    data: combinedData,
    isLoading,
    isError: ranking.isError || details.some((d) => d.isError),
  };
}
