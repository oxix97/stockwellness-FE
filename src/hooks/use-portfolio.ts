import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { portfolioApi, portfolioKeys } from "@/api/portfolio";
import {
  applyOptimisticQueryUpdate,
  rollbackOptimisticQueryUpdate,
} from "@/hooks/query-cache";
import { useAuthStore } from "@/store/auth";
import {
  CreatePortfolioRequest,
  CreateSimulatedPortfolioRequest,
  CreateSimulatedPortfolioResponse,
  UpdatePortfolioRequest,
  DiagnosisResponse,
  AnalysisSummaryResponse,
  AdviceResponse,
  CorrelationMatrix,
  PortfolioValuationResponse,
} from "@/types/api";

function simulatedPortfolioErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const response = error.response?.data as { code?: string } | undefined;

    if (response?.code === "P006") {
      return "환율 지원 전에는 원화 종목만 포트폴리오에 담을 수 있습니다.";
    }
    if (response?.code === "S002") {
      return "가격 정보를 확인할 수 없는 종목이 있어 가상 포트폴리오를 만들 수 없습니다.";
    }
  }

  return "가상 포트폴리오 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
}

export function useCreatePortfolio() {
  const setPortfolioId = useAuthStore((state) => state.setPortfolioId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreatePortfolioRequest) => portfolioApi.create(body),
    onMutate: async (newPortfolio) => {
      return applyOptimisticQueryUpdate<any[]>(
        queryClient,
        portfolioKeys.list(),
        (old) => [
          ...(old || []),
          { id: "temp-id", ...newPortfolio, createdAt: new Date().toISOString() },
        ],
      );
    },
    onError: (_err, _newPortfolio, context) => {
      rollbackOptimisticQueryUpdate(queryClient, context);
      toast.error("포트폴리오 생성에 실패했습니다.");
    },
    onSuccess: (id: number) => {
      setPortfolioId(String(id));
      toast.success("새로운 포트폴리오가 생성되었습니다!");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.list() });
    },
  });
}

export function useCreateSimulatedPortfolio() {
  const setPortfolioId = useAuthStore((state) => state.setPortfolioId);
  const queryClient = useQueryClient();

  return useMutation<CreateSimulatedPortfolioResponse, unknown, CreateSimulatedPortfolioRequest>({
    mutationFn: (body) => portfolioApi.createSimulated(body),
    onError: (error) => {
      toast.error(simulatedPortfolioErrorMessage(error));
    },
    onSuccess: ({ portfolioId }) => {
      setPortfolioId(String(portfolioId));
      toast.success("가상 포트폴리오가 생성되었습니다.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.list() });
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
      return applyOptimisticQueryUpdate<any>(
        queryClient,
        portfolioKeys.detail(portfolioId),
        (old) => {
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
        },
      );
    },

    onError: (_err, _newPortfolio, context) => {
      rollbackOptimisticQueryUpdate(queryClient, context);
      toast.error("변경사항 저장에 실패했습니다. 복구합니다.");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.detailBase(portfolioId) });
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
      queryClient.invalidateQueries({ queryKey: portfolioKeys.list() });
    },
  });
}

/**
 * 포트폴리오 요약 정보 조회 (가치 평가 + 분산도 + 최신 조언)
 */
export function usePortfolioSummary() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  const query = useQuery<AnalysisSummaryResponse>({
    queryKey: portfolioKeys.summary(portfolioId),
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
    queryKey: portfolioKeys.valuation(portfolioId),
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
    queryKey: portfolioKeys.rebalancing(portfolioId),
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
    queryKey: portfolioKeys.health(portfolioId),
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
    queryKey: portfolioKeys.detail(portfolioId),
    queryFn: () => portfolioApi.getHoldings(portfolioId!),
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 5,
  });
}

export function usePortfolioAdvice() {
  const portfolioId = useAuthStore((state) => state.portfolioId);
  const queryClient = useQueryClient();

  return useQuery<AdviceResponse>({
    queryKey: portfolioKeys.advice(portfolioId),
    queryFn: async () => {
      try {
        return await portfolioApi.getAdvice(portfolioId!);
      } catch (error) {
        if (!isAxiosError(error) || error.response?.status !== 404) {
          throw error;
        }

        const created = await portfolioApi.createAdvice(portfolioId!);
        queryClient.invalidateQueries({ queryKey: portfolioKeys.advice(portfolioId) });
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
      queryClient.invalidateQueries({ queryKey: portfolioKeys.advice(portfolioId) });
    },
  });
}

export function usePortfolioCorrelation() {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  return useQuery<CorrelationMatrix>({
    queryKey: portfolioKeys.correlation(portfolioId),
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
