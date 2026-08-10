import type {
  AssetType,
  CreatePortfolioItemRequest,
  CreatePortfolioRequest,
  PortfolioDiversificationResponse,
  PortfolioResponse,
  PortfolioRebalancingResponse,
  PortfolioValuationResponse,
  UpdatePortfolioRequest,
} from "@/types/api";

/**
 * @deprecated `@/types/api`를 사용하세요.
 * 포트폴리오 타입 정의는 OpenAPI 기반 단일 타입 레이어로 통합했습니다.
 */
export type Portfolio = PortfolioResponse;
export type PortfolioItem = PortfolioResponse["items"][number];
export type PortfolioValuation = PortfolioValuationResponse;
export type Ratio = NonNullable<PortfolioDiversificationResponse["assetRatios"]>[number];
export type Diversification = PortfolioDiversificationResponse;
export type RebalancingItem = NonNullable<PortfolioRebalancingResponse["items"]>[number];
export type RebalancingGuide = PortfolioRebalancingResponse;
export type PortfolioSummary = {
  valuation: PortfolioValuationResponse;
  diversification: PortfolioDiversificationResponse;
  rebalancing: PortfolioRebalancingResponse;
  itemContributions: Record<string, number>;
};
export type {
  AssetType,
  CreatePortfolioItemRequest,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
};
