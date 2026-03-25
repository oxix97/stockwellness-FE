import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import { useAuthStore } from "@/store/auth";
import { CreatePortfolioRequest, UpdatePortfolioRequest } from "@/types/api";

export function useCreatePortfolio() {
  const setPortfolioId = useAuthStore((state) => state.setPortfolioId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreatePortfolioRequest) => portfolioApi.create(body),
    onSuccess: (id: number) => {
      setPortfolioId(String(id));
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useUpdatePortfolio() {
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdatePortfolioRequest) =>
      portfolioApi.updatePortfolio(portfolioId!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
    },
  });
}

/**
 * 포트폴리오 요약 정보 및 건강 점수 조회
 */
export function usePortfolioSummary() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  const queryConfig = {
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 5,
  };

  const valuation = useQuery({
    queryKey: ["portfolio", portfolioId, "valuation"],
    queryFn: () => portfolioApi.getValuation(portfolioId!),
    ...queryConfig,
  });

  const diversification = useQuery({
    queryKey: ["portfolio", portfolioId, "diversification"],
    queryFn: () => portfolioApi.getDiversification(portfolioId!),
    ...queryConfig,
  });

  const getHealthScore = () => {
    if (!valuation.data || !diversification.data) {
      return { radarData: [], overallScore: 0 };
    }
    
    const v = valuation.data;
    const d = diversification.data;

    const attack = Math.min(100, Math.max(0, (v.totalReturnRate ?? 0) * 5 + 50));
    const defense = Math.min(100, Math.max(0, 100 - (v.mdd ?? 0)));
    const balance = Math.min(100, (d.sectorRatios?.length ?? 0) * 20);
    const agility = Math.min(100, (v.sharpeRatio ?? 0) * 40);
    const cash = d.assetRatios?.find((a: any) => a.name === "CASH")?.value ?? 0;

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
    health: getHealthScore(),
    isLoading: valuation.isLoading || diversification.isLoading,
  };
}

/**
 * 포트폴리오 보유 종목 상세 내역 조회
 */
export function usePortfolioDetails() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  return useQuery({
    queryKey: ["portfolio", portfolioId, "detail"],
    queryFn: () => portfolioApi.getHoldings(portfolioId!),
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 포트폴리오 분석 정보 (AI 조언, 상관관계, 리밸런싱) 조회
 */
export function usePortfolioAnalysis() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  const queryConfig = {
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 5,
  };

  const advice = useQuery({
    queryKey: ["portfolio", portfolioId, "advice"],
    queryFn: () => portfolioApi.getAdvice(portfolioId!),
    ...queryConfig,
  });

  const correlation = useQuery({
    queryKey: ["portfolio", portfolioId, "correlation"],
    queryFn: () => portfolioApi.getCorrelation(portfolioId!),
    ...queryConfig,
  });

  const rebalancing = useQuery({
    queryKey: ["portfolio", portfolioId, "rebalancing"],
    queryFn: () => portfolioApi.getRebalancing(portfolioId!),
    ...queryConfig,
  });

  return {
    advice: advice.data,
    correlation: correlation.data,
    rebalancing: rebalancing.data,
    isLoading: advice.isLoading || correlation.isLoading || rebalancing.isLoading,
  };
}

/**
 * 하위 호환성을 위해 유지되는 통합 훅 (점진적 교체 대상)
 */
export function usePortfolio() {
  const summary = usePortfolioSummary();
  const details = usePortfolioDetails();
  const analysis = usePortfolioAnalysis();

  return {
    valuation: summary.valuation,
    diversification: summary.diversification,
    advice: analysis.advice,
    holdings: details.data,
    correlation: analysis.correlation,
    isLoading: summary.isLoading || details.isLoading || analysis.isLoading,
    health: summary.health,
  };
}
