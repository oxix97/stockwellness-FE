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

  return {
    ranking,
  };
}
