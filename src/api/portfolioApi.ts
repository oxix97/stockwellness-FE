import { apiClient } from "./client";
import {
  Portfolio,
  PortfolioValuation,
  Diversification,
  RebalancingGuide,
  PortfolioSummary,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
} from "../types/portfolio";
import {
  AdviceResponse,
  DiagnosisResponse,
  BacktestResponse,
  BacktestRequest,
  CorrelationMatrix,
  PortfolioInceptionChartResponse,
} from "../types/api";

export const portfolioApi = {
  // 포트폴리오 관리
  getPortfolios: () => apiClient.get<Portfolio[]>("/v1/portfolios"),
  createPortfolio: (data: CreatePortfolioRequest) =>
    apiClient.post<Portfolio>("/v1/portfolios", data),
  getPortfolio: (id: number) =>
    apiClient.get<Portfolio>(`/v1/portfolios/${id}`),
  updatePortfolio: (id: number, data: UpdatePortfolioRequest) =>
    apiClient.put<Portfolio>(`/v1/portfolios/${id}`, data),
  deletePortfolio: (id: number) => apiClient.delete(`/v1/portfolios/${id}`),

  // 포트폴리오 분석
  getValuation: (id: number) =>
    apiClient.get<PortfolioValuation>(`/v1/portfolios/${id}/analysis/valuation`),
  getDiversification: (id: number) =>
    apiClient.get<Diversification>(
      `/v1/portfolios/${id}/analysis/diversification`
    ),
  getRebalancing: (id: number) =>
    apiClient.get<RebalancingGuide>(
      `/v1/portfolios/${id}/analysis/rebalancing`
    ),
  getSummary: (id: number) =>
    apiClient.get<PortfolioSummary>(`/v1/portfolios/${id}/analysis/summary`),
  backtest: (id: number, data: BacktestRequest) =>
    apiClient.post<BacktestResponse>(
      `/v1/portfolios/${id}/analysis/backtest`,
      data
    ),
  getCorrelation: (id: number) =>
    apiClient.get<CorrelationMatrix>(
      `/v1/portfolios/${id}/analysis/correlation`
    ),

  // 성과 분석
  getPerformanceInception: (id: number) =>
    apiClient.get<DiagnosisResponse>(
      `/v1/portfolios/${id}/analysis/performance/inception`
    ),
  getPerformanceInceptionChart: (id: number) =>
    apiClient.get<PortfolioInceptionChartResponse>(
      `/v1/portfolios/${id}/analysis/performance/inception/chart`
    ),

  // 건강 진단 및 AI 조언
  getHealth: (id: number) =>
    apiClient.get<DiagnosisResponse>(`/v1/portfolios/${id}/health`),
  getLatestAdvice: (id: number) =>
    apiClient.get<AdviceResponse>(`/v1/portfolios/${id}/advice/latest`),
};
