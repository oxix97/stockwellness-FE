import { apiClient } from "./client";
import {
  PortfolioValuationResponse,
  PortfolioDiversificationResponse,
  PortfolioRebalancingResponse,
  BacktestRequest,
  BacktestResponse,
  PortfolioResponse,
  CorrelationMatrix,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  AdviceResponse,
  DiagnosisResponse,
  AnalysisSummaryResponse,
  PortfolioInceptionChartResponse,
  CreateSimulatedPortfolioRequest,
  CreateSimulatedPortfolioResponse,
} from "@/types/api";

export const portfolioKeys = {
  all: ["portfolio"] as const,
  list: () => [...portfolioKeys.all] as const,
  detailBase: (portfolioId: string | null | undefined) => [...portfolioKeys.all, portfolioId] as const,
  summary: (portfolioId: string | null | undefined) => [...portfolioKeys.detailBase(portfolioId), "summary"] as const,
  valuation: (portfolioId: string | null | undefined) => [...portfolioKeys.detailBase(portfolioId), "valuation"] as const,
  rebalancing: (portfolioId: string | null | undefined) => [...portfolioKeys.detailBase(portfolioId), "rebalancing"] as const,
  health: (portfolioId: string | null | undefined) => [...portfolioKeys.detailBase(portfolioId), "health"] as const,
  detail: (portfolioId: string | null | undefined) => [...portfolioKeys.detailBase(portfolioId), "detail"] as const,
  advice: (portfolioId: string | null | undefined) => [...portfolioKeys.detailBase(portfolioId), "advice"] as const,
  correlation: (portfolioId: string | null | undefined) => [...portfolioKeys.detailBase(portfolioId), "correlation"] as const,
};

/**
 * 포트폴리오 관련 API 호출 객체
 */
export const portfolioApi = {
  /**
   * 포트폴리오의 건강 진단 점수를 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 진단 결과 및 건강 점수
   */
  getHealth: async (portfolioId: string): Promise<DiagnosisResponse> => {
    const data = await apiClient.get<DiagnosisResponse>(`/v1/portfolios/${portfolioId}/health`);
    return data;
  },

  /**
   * 포트폴리오 분석 요약 정보를 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 평가, 분산도 등을 종합한 분석 요약 정보
   */
  getAnalysisSummary: async (portfolioId: string): Promise<AnalysisSummaryResponse> => {
    const data = await apiClient.get<AnalysisSummaryResponse>(`/v1/portfolios/${portfolioId}/analysis/summary`);
    return data;
  },

  /**
   * 사용자의 모든 포트폴리오 목록을 조회합니다.
   * @returns 포트폴리오 리스트
   */
  getMyPortfolios: async (): Promise<PortfolioResponse[]> => {
    const data = await apiClient.get<PortfolioResponse[]>("/v1/portfolios");
    return data;
  },

  /**
   * 포트폴리오를 생성합니다.
   * @returns 생성된 포트폴리오의 ID
   */
  create: async (body: CreatePortfolioRequest): Promise<number> => {
    const data = await apiClient.post<number>("/v1/portfolios", body);
    return data;
  },

  /** 서버가 EOD 종가로 가상 수량과 매입 단가를 계산해 포트폴리오를 생성한다. */
  createSimulated: async (
    body: CreateSimulatedPortfolioRequest,
  ): Promise<CreateSimulatedPortfolioResponse> => {
    const data = await apiClient.post<CreateSimulatedPortfolioResponse>("/v1/portfolios/simulated", body);
    return data;
  },
  /**
   * 포트폴리오 상세 조회에서 보유 종목 리스트를 반환합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 보유 종목 리스트
   */
  getHoldings: async (portfolioId: string): Promise<PortfolioResponse> => {
    const data = await apiClient.get<PortfolioResponse>(`/v1/portfolios/${portfolioId}`);
    return data;
  },

  /**
   * 포트폴리오 가치 평가 데이터를 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 총 자산 가치, 수익률, MDD 등 평가 데이터
   */
  getValuation: async (portfolioId: string): Promise<PortfolioValuationResponse> => {
    const data = await apiClient.get<PortfolioValuationResponse>(`/v1/portfolios/${portfolioId}/analysis/valuation`);
    return data;
  },

  /**
   * 포트폴리오 분산도 데이터를 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 자산, 섹터, 국가별 비중 정보
   */
  getDiversification: async (portfolioId: string): Promise<PortfolioDiversificationResponse> => {
    const data = await apiClient.get<PortfolioDiversificationResponse>(`/v1/portfolios/${portfolioId}/analysis/diversification`);
    return data;
  },

  /**
   * 포트폴리오 리밸런싱 추천 데이터를 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 현재 비중과 목표 비중에 따른 리밸런싱 아이템 리스트
   */
  getRebalancing: async (portfolioId: string): Promise<PortfolioRebalancingResponse> => {
    const data = await apiClient.get<PortfolioRebalancingResponse>(`/v1/portfolios/${portfolioId}/analysis/rebalancing`);
    return data;
  },

  /**
   * 포트폴리오에 대한 최신 AI 조언을 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 포트폴리오 최적화 및 전략 제언 메시지
   */
  getAdvice: async (portfolioId: string): Promise<AdviceResponse> => {
    const data = await apiClient.get<AdviceResponse>(`/v1/portfolios/${portfolioId}/advice/latest`);
    return data;
  },

  createAdvice: async (portfolioId: string): Promise<AdviceResponse> => {
    const data = await apiClient.post<AdviceResponse>(`/v1/portfolios/${portfolioId}/advice`);
    return data;
  },

  /**
   * 전략 백테스트를 실행합니다.
   * @param portfolioId 포트폴리오 ID
   * @param params 백테스트 전략, 금액, 외부 primaryBenchmark 코드, 기간 정보
   * @returns 서버가 계산한 전략별 CAGR/XIRR/TWR 및 벤치마크 비교 결과
   */
  runBacktest: async (portfolioId: string, params: BacktestRequest): Promise<BacktestResponse> => {
    const data = await apiClient.post<BacktestResponse>(`/v1/portfolios/${portfolioId}/analysis/backtest`, params);
    return data;
  },

  /**
   * 포트폴리오 종목 간 상관관계 행렬을 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 종목 간 상관계수 행렬
   */
  getCorrelation: async (portfolioId: string): Promise<CorrelationMatrix> => {
    const data = await apiClient.get<CorrelationMatrix>(`/v1/portfolios/${portfolioId}/analysis/correlation`);
    return data;
  },

  getInceptionChart: async (portfolioId: string): Promise<PortfolioInceptionChartResponse> => {
    const data = await apiClient.get<PortfolioInceptionChartResponse>(`/v1/portfolios/${portfolioId}/analysis/performance/inception/chart`);
    return data;
  },

  /**
   * 포트폴리오를 수정합니다.
   * @param portfolioId 포트폴리오 ID
   * @param body 수정할 포트폴리오 정보
   */
  updatePortfolio: async (portfolioId: string, body: UpdatePortfolioRequest): Promise<void> => {
    await apiClient.put(`/v1/portfolios/${portfolioId}`, body);
  },

  /**
   * 포트폴리오를 삭제합니다.
   * @param portfolioId 포트폴리오 ID
   */
  deletePortfolio: async (portfolioId: string): Promise<void> => {
    await apiClient.delete(`/v1/portfolios/${portfolioId}`);
  },
};
