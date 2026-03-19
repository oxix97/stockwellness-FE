import { apiClient } from "./client";
import {
  PortfolioValuationResponse,
  PortfolioDiversificationResponse,
  PortfolioRebalancingResponse,
  BacktestRequest,
  BacktestResponse,
  PortfolioItemResponse,
  PortfolioResponse,
  CorrelationMatrix,
  CreatePortfolioRequest,
} from "@/types/api";

/**
 * 포트폴리오 관련 API 호출 객체
 */
export const portfolioApi = {
  /**
   * 사용자의 모든 포트폴리오 목록을 조회합니다.
   * @returns 포트폴리오 리스트
   */
  getMyPortfolios: async (): Promise<PortfolioResponse[]> => {
    const { data } = await apiClient.get("/v1/portfolios");
    return data;
  },

  /**
   * 포트폴리오를 생성합니다.
   * @returns 생성된 포트폴리오의 ID
   */
  create: async (body: CreatePortfolioRequest): Promise<number> => {
    const { data } = await apiClient.post("/v1/portfolios", body);
    return data;
  },
  /**
   * 포트폴리오 상세 조회에서 보유 종목 리스트를 반환합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 보유 종목 리스트
   */
  getHoldings: async (portfolioId: string): Promise<PortfolioItemResponse[]> => {
    const { data } = await apiClient.get<PortfolioResponse>(`/v1/portfolios/${portfolioId}`);
    return data.items;
  },

  /**
   * 포트폴리오 가치 평가 데이터를 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 총 자산 가치, 수익률, MDD 등 평가 데이터
   */
  getValuation: async (portfolioId: string): Promise<PortfolioValuationResponse> => {
    const { data } = await apiClient.get(`/v1/portfolios/${portfolioId}/analysis/valuation`);
    return data;
  },

  /**
   * 포트폴리오 분산도 데이터를 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 자산, 섹터, 국가별 비중 정보
   */
  getDiversification: async (portfolioId: string): Promise<PortfolioDiversificationResponse> => {
    const { data } = await apiClient.get(`/v1/portfolios/${portfolioId}/analysis/diversification`);
    return data;
  },

  /**
   * 포트폴리오 리밸런싱 추천 데이터를 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 현재 비중과 목표 비중에 따른 리밸런싱 아이템 리스트
   */
  getRebalancing: async (portfolioId: string): Promise<PortfolioRebalancingResponse> => {
    const { data } = await apiClient.get(`/v1/portfolios/${portfolioId}/analysis/rebalancing`);
    return data;
  },

  /**
   * 포트폴리오에 대한 최신 AI 조언을 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 포트폴리오 최적화 및 전략 제언 메시지
   */
  getAdvice: async (portfolioId: string) => {
    const { data } = await apiClient.get(`/v1/portfolios/${portfolioId}/advice/latest`);
    return data;
  },

  /**
   * 전략 백테스트를 실행합니다.
   * @param portfolioId 포트폴리오 ID
   * @param params 백테스트 전략, 금액, 벤치마크 정보
   * @returns 일별 결과, 수익률 등 백테스트 실행 결과
   */
  runBacktest: async (portfolioId: string, params: BacktestRequest): Promise<BacktestResponse> => {
    const { data } = await apiClient.post(`/v1/portfolios/${portfolioId}/analysis/backtest`, params);
    return data;
  },

  /**
   * 포트폴리오 종목 간 상관관계 행렬을 조회합니다.
   * @param portfolioId 포트폴리오 ID
   * @returns 종목 간 상관계수 행렬
   */
  getCorrelation: async (portfolioId: string): Promise<CorrelationMatrix> => {
    const { data } = await apiClient.get(`/v1/portfolios/${portfolioId}/analysis/correlation`);
    return data;
  },
};
