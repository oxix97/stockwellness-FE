import { useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { useAuthStore } from "@/store/auth";

export function usePortfolio() {
  const portfolioId = useAuthStore((state) => state.portfolioId) || "1";

  const valuation = useQuery({
    queryKey: ["portfolio", portfolioId, "valuation"],
    queryFn: () => portfolioApi.getValuation(portfolioId),
    enabled: !!portfolioId,
  });

  const diversification = useQuery({
    queryKey: ["portfolio", portfolioId, "diversification"],
    queryFn: () => portfolioApi.getDiversification(portfolioId),
    enabled: !!portfolioId,
  });

  const advice = useQuery({
    queryKey: ["portfolio", portfolioId, "advice"],
    queryFn: () => portfolioApi.getAdvice(portfolioId),
    enabled: !!portfolioId,
  });

  const holdings = useQuery({
    queryKey: ["portfolio", portfolioId, "holdings"],
    queryFn: () => portfolioApi.getHoldings(portfolioId),
    enabled: !!portfolioId,
  });

  const isLoading = valuation.isLoading || diversification.isLoading || advice.isLoading || holdings.isLoading;

  // 방사형 차트와 종합 점수를 위한 건강 지표 도출
  const getHealthScore = () => {
    if (!valuation.data || !diversification.data) {
      return { radarData: [], overallScore: 0 };
    }
    
    const attack = Math.min(100, Math.max(0, (valuation.data.totalReturnRate ?? 0) * 5 + 50));
    const defense = Math.min(100, Math.max(0, 100 - (valuation.data.mdd ?? 0)));
    const balance = Math.min(100, (diversification.data.sectorRatios.length ?? 0) * 20);
    const agility = Math.min(100, (valuation.data.sharpeRatio ?? 0) * 40);
    const cash = diversification.data.assetRatios.find(a => a.name === "CASH")?.value ?? 0;

    const radarData = [
      { metric: "수익성\n(Attack)", value: attack },
      { metric: "안전성\n(Defense)", value: defense },
      { metric: "분산도\n(Balance)", value: balance },
      { metric: "민첩성\n(Agility)", value: agility },
      { metric: "현금\n(Cash)", value: cash },
    ];

    const overallScore = Math.round(radarData.reduce((acc, curr) => acc + curr.value, 0) / 5);

    return { radarData, overallScore };
  };

  return {
    valuation: valuation.data,
    diversification: diversification.data,
    advice: advice.data,
    holdings: holdings.data,
    isLoading,
    health: getHealthScore(),
  };
}
