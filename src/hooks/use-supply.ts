import { useQuery } from "@tanstack/react-query";
import { sectorApi, sectorKeys } from "@/api/sector";

/**
 * 섹터 수급 랭킹 훅 — 기관/외국인 연속 매수 상위 섹터
 */
export function useSupply(limit = 5) {
  return useQuery({
    queryKey: sectorKeys.ranking.supply(limit),
    queryFn: () => sectorApi.getSupplyRanking({ limit }),
    staleTime: 1000 * 60 * 5,
  });
}
