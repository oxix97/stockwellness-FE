import { describe, expectTypeOf, it } from "vitest";
import type { operations, paths } from "@/types/schema";
import type {
  AuthExchangeRequest,
  BacktestResponse,
  E2eAttestationResponse,
  PortfolioValuationResponse,
} from "@/types/api";

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

  it("keeps the nullable valuation and cash-flow performance fields typed", () => {
    expectTypeOf<AuthExchangeRequest>().toHaveProperty("code").toBeString();
    expectTypeOf<E2eAttestationResponse>().toHaveProperty("isolated").toBeBoolean();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("currentTotalValue").toEqualTypeOf<
      number | null
    >();
    expectTypeOf<PortfolioValuationResponse>().toHaveProperty("valuationStatus").toEqualTypeOf<
      "COMPLETE" | "PARTIAL" | "UNAVAILABLE"
    >();
    expectTypeOf<BacktestResponse>().toHaveProperty("xirr").toEqualTypeOf<number | null>();
    expectTypeOf<operations["portfolio-analysis-backtest"]["responses"]>().toHaveProperty(400);
  });

  it("does not include the removed raw login path", () => {
    expectTypeOf<"/api/v1/auth/login">().not.toMatchTypeOf<keyof paths>();
  });
});
