import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { portfolioApi } from "@/api/portfolio";
import { useAuthStore } from "@/store/auth";
import {
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  DiagnosisResponse,
  AnalysisSummaryResponse,
  AdviceResponse,
  CorrelationMatrix,
  PortfolioValuationResponse,
} from "@/types/api";

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

    onMutate: async (newPortfolio) => {
      await queryClient.cancelQueries({ queryKey: ["portfolio", portfolioId] });
      const previousDetail = queryClient.getQueryData(["portfolio", portfolioId, "detail"]);

      queryClient.setQueryData(["portfolio", portfolioId, "detail"], (old: any) => {
        if (!old) return old;
        const updatedItems = newPortfolio.items.map((newItem: any) => {
          const existingItem = old.items?.find((i: any) => i.symbol === newItem.symbol);
          return existingItem ? { ...existingItem, ...newItem } : newItem;
        });

        return {
          ...old,
          name: newPortfolio.name,
          description: newPortfolio.description,
          items: updatedItems,
        };
      });

      return { previousDetail };
    },

    onError: (err, newPortfolio, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(["portfolio", portfolioId, "detail"], context.previousDetail);
      }
      toast.error("변경사항 저장에 실패했습니다. 복구합니다.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId] });
    },
  });
}

export function useDeletePortfolio() {
  const setPortfolioId = useAuthStore((state) => state.setPortfolioId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => portfolioApi.deletePortfolio(String(id)),
    onSuccess: () => {
      setPortfolioId(null);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
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
  const data = query.data;

  return {
    valuation: data?.valuation,
    diversification: data?.diversification,
    rebalancing: data?.rebalancing,
    itemContributions: data?.itemContributions,
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
 * 포트폴리오 리밸런싱 가이드 조회
 */
export function usePortfolioRebalancing() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  return useQuery({
    queryKey: ["portfolio", portfolioId, "rebalancing"],
    queryFn: () => portfolioApi.getRebalancing(portfolioId!),
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

export function usePortfolioAdvice() {
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const queryClient = useQueryClient();

  return useQuery<AdviceResponse>({
    queryKey: ["portfolio", portfolioId, "advice"],
    queryFn: async () => {
      try {
        return await portfolioApi.getAdvice(portfolioId!);
      } catch (error) {
        if (!isAxiosError(error) || error.response?.status !== 404) {
          throw error;
        }

        const created = await portfolioApi.createAdvice(portfolioId!);
        queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId, "advice"] });
        return created;
      }
    },
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateAdvice() {
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => portfolioApi.createAdvice(portfolioId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", portfolioId, "advice"] });
    },
  });
}

export function usePortfolioCorrelation() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  return useQuery<CorrelationMatrix>({
    queryKey: ["portfolio", portfolioId, "correlation"],
    queryFn: () => portfolioApi.getCorrelation(portfolioId!),
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 하위 호환성을 위해 유지되는 통합 훅 (점진적 교체 대상)
 */
export function usePortfolio() {
  const summary = usePortfolioSummary();
  const details = usePortfolioDetails();
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
    holdings: details.data,
    isLoading: summary.isLoading || details.isLoading || healthResult.isLoading,
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
