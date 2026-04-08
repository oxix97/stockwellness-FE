import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { portfolioApi } from "@/api/portfolio";
import { useAuthStore } from "@/store/auth";
import { CreatePortfolioRequest, UpdatePortfolioRequest, AssetRatio, DiagnosisResponse, AnalysisSummaryResponse } from "@/types/api";

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
 * 포트폴리오 요약 정보 조회 (가치 평가 + 분산도 + 최신 조언)
 */
export function usePortfolioSummary() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  const query = useQuery<AnalysisSummaryResponse>({
    queryKey: ["portfolio", portfolioId, "summary"],
    queryFn: () => portfolioApi.getAnalysisSummary(portfolioId!),
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 5,
  });

  // API 응답 구조가 { valuation: ... } 형태가 아니라 평면적인 PortfolioValuationResponse일 경우를 대비
  const data = query.data;
  
  // 1. data.valuation이 있으면 그것을 사용
  // 2. data.valuation은 없지만 data 자체가 totalReturnRate를 가지고 있으면 data 자체를 사용
  const valuation = data?.valuation 
    ? data.valuation 
    : (data && (data as any).totalReturnRate !== undefined) 
      ? (data as unknown as AnalysisSummaryResponse["valuation"]) 
      : undefined;

  return {
    valuation,
    diversification: data?.diversification,
    advice: data?.advice,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * 포트폴리오 가치 평가 정보 조회
 */
export function usePortfolioValuation() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  return useQuery<PortfolioValuationResponse>({
    queryKey: ["portfolio", portfolioId, "valuation"],
    queryFn: () => portfolioApi.getValuation(portfolioId!),
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 포트폴리오 건강 진단 결과 조회
 */
export function usePortfolioHealth() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  return useQuery<DiagnosisResponse>({
    queryKey: ["portfolio", portfolioId, "health"],
    queryFn: () => portfolioApi.getHealth(portfolioId!),
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 5,
  });
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
    queryFn: () =>
      portfolioApi.getAdvice(portfolioId!).catch((error) => {
        // 아직 AI 조언이 생성되지 않은 경우 (매주 월요일 배치 전) → null로 처리
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }),
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
  const healthResult = usePortfolioHealth();

  const getHealthScore = () => {
    if (healthResult.data) {
      const categories = healthResult.data.categories as Record<string, number>;
      const radarData = Object.entries(categories || {}).map(([key, value]) => ({
        metric: key,
        value: value,
      }));
      return {
        radarData: radarData.length > 0 ? radarData : [],
        overallScore: healthResult.data.overallScore,
      };
    }
    return { radarData: [], overallScore: undefined };
  };

  return {
    valuation: summary.valuation,
    diversification: summary.diversification,
    advice: analysis.advice,
    holdings: details.data,
    correlation: analysis.correlation,
    isLoading: summary.isLoading || details.isLoading || analysis.isLoading || healthResult.isLoading,
    health: getHealthScore(),
  };
}

/** 로그인 직후 포트폴리오 ID를 동기화하는 imperative 헬퍼 훅 */
export function usePortfolioSync() {
  const setPortfolioId = useAuthStore((state) => state.setPortfolioId);

  const syncPortfolio = async () => {
    try {
      const portfolios = await portfolioApi.getMyPortfolios();
      if (portfolios && portfolios.length > 0) {
        const firstPortfolioId = String(portfolios[0].id);
        setPortfolioId(firstPortfolioId);
        return firstPortfolioId;
      } else {
        setPortfolioId(null);
        return null;
      }
    } catch {
      setPortfolioId(null);
      return null;
    }
  };

  return { syncPortfolio };
}
