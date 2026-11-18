import { describe, expectTypeOf, it } from "vitest";
import type { operations, paths } from "@/types/schema";
import type {
  AnalysisSummaryResponse,
  AuthExchangeRequest,
  BacktestResponse,
  E2eAttestationResponse,
  PortfolioDiversificationResponse,
  PortfolioRebalancingResponse,
  PortfolioValuationResponse,
  RebalancingItem,
} from "@/types/api";
import type {
  PortfolioSummary,
  RebalancingGuide,
  RebalancingItem as DeprecatedRebalancingItem,
} from "@/types/portfolio";

describe("generated OpenAPI contract", () => {
  it("exposes the security and simulation paths through stable operation IDs", () => {
    expectTypeOf<paths["/api/v1/auth/exchange"]["post"]>().toMatchTypeOf<
      operations["auth-exchange"]
    >();
    expectTypeOf<paths["/api/v1/test-support/attestation"]["post"]>().toMatchTypeOf<
      operations["test-support-e2e-attestation"]
    >();
    expectTypeOf<paths["/api/v1/portfolios/simulated"]["post"]>().toMatchTypeOf<
      operations["portfolio-simulated-create"]
    >();
  });

  it("keeps the nullable valuation, diversification, rebalancing, and cash-flow performance fields typed", () => {
    expectTypeOf<AuthExchangeRequest>().toHaveProperty("code").toBeString();
    expectTypeOf<E2eAttestationResponse>().toHaveProperty("isolated").toBeBoolean();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("currentTotalValue").toEqualTypeOf<
      number | null
    >();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("totalProfitLoss").toEqualTypeOf<
      number | null
    >();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("totalReturnRate").toEqualTypeOf<
      number | null
    >();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("dailyProfitLoss").toEqualTypeOf<
      number | null
    >();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("dailyReturnRate").toEqualTypeOf<
      number | null
    >();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("cagr").toEqualTypeOf<number | null>();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("volatility").toEqualTypeOf<number | null>();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("alpha").toEqualTypeOf<number | null>();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("mdd").toEqualTypeOf<number | null>();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("sharpeRatio").toEqualTypeOf<number | null>();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("beta").toEqualTypeOf<number | null>();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("asOfDate").toEqualTypeOf<string | null>();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("valuationStatus").toEqualTypeOf<
      "COMPLETE" | "PARTIAL" | "UNAVAILABLE"
    >();

    expectTypeOf<PortfolioDiversificationResponse>().toHaveProperty("totalValue").toEqualTypeOf<
      number | null
    >();

    expectTypeOf<PortfolioRebalancingResponse>().toHaveProperty("totalValue").toEqualTypeOf<
      number | null
    >();
    expectTypeOf<RebalancingItem>().toHaveProperty("recommendedQuantity").toEqualTypeOf<number | null>();
    expectTypeOf<RebalancingItem>().toHaveProperty("expectedTradeAmount").toEqualTypeOf<number | null>();
    expectTypeOf<PortfolioRebalancingResponse["items"][number]>().toEqualTypeOf<RebalancingItem>();
    expectTypeOf<DeprecatedRebalancingItem>().toEqualTypeOf<RebalancingItem>();
    expectTypeOf<RebalancingGuide>().toEqualTypeOf<PortfolioRebalancingResponse>();

    expectTypeOf<AnalysisSummaryResponse>().toHaveProperty("valuation").toEqualTypeOf<
      PortfolioValuationResponse
    >();
    expectTypeOf<AnalysisSummaryResponse>().toHaveProperty("diversification").toEqualTypeOf<
      PortfolioDiversificationResponse
    >();
    expectTypeOf<AnalysisSummaryResponse>().toHaveProperty("rebalancing").toEqualTypeOf<
      PortfolioRebalancingResponse
    >();
    expectTypeOf<PortfolioSummary>().toEqualTypeOf<AnalysisSummaryResponse>();

    type RawSummaryData = NonNullable<
      operations["portfolio-analysis-summary"]["responses"][200]["content"]["application/json"]["data"]
    >;
    expectTypeOf<RawSummaryData["valuation"]["mdd"]>().toEqualTypeOf<number | null>();
    expectTypeOf<RawSummaryData["valuation"]["sharpeRatio"]>().toEqualTypeOf<number | null>();
    expectTypeOf<RawSummaryData["valuation"]["cagr"]>().toEqualTypeOf<number | null>();
    expectTypeOf<RawSummaryData["valuation"]["volatility"]>().toEqualTypeOf<number | null>();
    expectTypeOf<RawSummaryData["valuation"]["alpha"]>().toEqualTypeOf<number | null>();
    expectTypeOf<RawSummaryData["valuation"]["beta"]>().toEqualTypeOf<number | null>();
    expectTypeOf<RawSummaryData["diversification"]>().toEqualTypeOf<PortfolioDiversificationResponse>();
    expectTypeOf<RawSummaryData["rebalancing"]>().toEqualTypeOf<PortfolioRebalancingResponse>();

    expectTypeOf<BacktestResponse>().toHaveProperty("xirr").toEqualTypeOf<number | null>();
    expectTypeOf<operations["portfolio-analysis-backtest"]["responses"]>().toHaveProperty(400);
  });

  it("does not include the removed raw login path", () => {
    expectTypeOf<"/api/v1/auth/login">().not.toMatchTypeOf<keyof paths>();
  });
});
