import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../client";
import { portfolioApi } from "../portfolio";
import { makeValuation, makeDiversification, makeRebalancing, makeAdvice, makePortfolio } from "@/test/fixtures";

const mockClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("portfolioApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getValuation — GET /v1/portfolios/:id/analysis/valuation 호출", async () => {
    const valuation = makeValuation();
    mockClient.get.mockResolvedValue(valuation);

    const result = await portfolioApi.getValuation("1");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/portfolios/1/analysis/valuation");
    expect(result).toEqual(valuation);
  });

  it("getDiversification — GET /v1/portfolios/:id/analysis/diversification 호출", async () => {
    const diversification = makeDiversification();
    mockClient.get.mockResolvedValue(diversification);

    const result = await portfolioApi.getDiversification("1");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/portfolios/1/analysis/diversification");
    expect(result).toEqual(diversification);
  });

  it("getRebalancing — GET /v1/portfolios/:id/analysis/rebalancing 호출", async () => {
    const rebalancing = makeRebalancing();
    mockClient.get.mockResolvedValue(rebalancing);

    const result = await portfolioApi.getRebalancing("1");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/portfolios/1/analysis/rebalancing");
    expect(result).toEqual(rebalancing);
  });

  it("getAdvice — GET /v1/portfolios/:id/advice/latest 호출 (정상)", async () => {
    const advice = makeAdvice();
    mockClient.get.mockResolvedValue(advice);

    const result = await portfolioApi.getAdvice("1");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/portfolios/1/advice/latest");
    expect(result).toEqual(advice);
  });

  it("getAdvice — 서버가 null 반환 시 null 반환", async () => {
    mockClient.get.mockResolvedValue(null);

    const result = await portfolioApi.getAdvice("1");

    expect(result).toBeNull();
  });

  it("getHoldings — GET /v1/portfolios/:id 호출", async () => {
    const portfolio = makePortfolio();
    mockClient.get.mockResolvedValue(portfolio);

    const result = await portfolioApi.getHoldings("1");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/portfolios/1");
    expect(result).toEqual(portfolio);
  });

  it("create — POST /v1/portfolios 호출 후 ID 반환", async () => {
    mockClient.post.mockResolvedValue(42);

    const id = await portfolioApi.create({ name: "테스트", description: "설명", items: [] });

    expect(mockClient.post).toHaveBeenCalledWith("/v1/portfolios", {
      name: "테스트",
      description: "설명",
      items: [],
    });
    expect(id).toBe(42);
  });

  it("runBacktest — POST /v1/portfolios/:id/analysis/backtest 호출", async () => {
    const backtest = { dailyResults: [] };
    mockClient.post.mockResolvedValue(backtest);

    const params = { strategy: "DCA" as const, amount: 1_000_000, benchmarkTicker: "SPY" };
    const result = await portfolioApi.runBacktest("1", params);

    expect(mockClient.post).toHaveBeenCalledWith("/v1/portfolios/1/analysis/backtest", params);
    expect(result).toEqual(backtest);
  });

  it("updatePortfolio — PUT /v1/portfolios/:id 호출", async () => {
    mockClient.put.mockResolvedValue(undefined);

    const body = {
      name: "수정된 포트폴리오",
      description: "수정됨",
      items: [
        { symbol: "005930", quantity: 5, purchasePrice: 70000, currency: "KRW", assetType: "STOCK" as const, targetWeight: 60 },
        { symbol: "SPY", quantity: 1, purchasePrice: 500, currency: "USD", assetType: "STOCK" as const, targetWeight: 40 },
      ],
    };
    await portfolioApi.updatePortfolio("1", body);

    expect(mockClient.put).toHaveBeenCalledWith("/v1/portfolios/1", body);
  });

  it("deletePortfolio — DELETE /v1/portfolios/:id 호출", async () => {
    mockClient.delete.mockResolvedValue(undefined);

    await portfolioApi.deletePortfolio("1");

    expect(mockClient.delete).toHaveBeenCalledWith("/v1/portfolios/1");
  });

  it("getHealth — GET /v1/portfolios/:id/health 호출", async () => {
    const health = { overallScore: 85, summary: "Good" };
    mockClient.get.mockResolvedValue(health);

    const result = await portfolioApi.getHealth("1");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/portfolios/1/health");
    expect(result).toEqual(health);
  });

  it("getAnalysisSummary — GET /v1/portfolios/:id/analysis/summary 호출", async () => {
    const summary = { valuation: {}, diversification: {} };
    mockClient.get.mockResolvedValue(summary);

    const result = await portfolioApi.getAnalysisSummary("1");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/portfolios/1/analysis/summary");
    expect(result).toEqual(summary);
  });
});
