import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithQuery } from "@/test/test-utils";
import type { BacktestResponse, BacktestRouteState } from "@/types/api";
import { BacktestResult } from "../BacktestResult";

const mockNavigate = vi.fn();
const mockRun = vi.fn();
const mockUseBacktest = vi.fn();
const routeState: BacktestRouteState = {
  strategy: "DCA",
  amount: 1_000_000,
  primaryBenchmark: "SP500",
  period: "1Y",
  rebalancingPeriod: "NONE",
  dividendReinvested: true,
  weights: { "005930": 100 },
};

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: routeState }),
  };
});

vi.mock("@/hooks/use-backtest", () => ({
  useBacktest: (...args: unknown[]) => mockUseBacktest(...args),
}));

function makeResponse(overrides: Partial<BacktestResponse> = {}): BacktestResponse {
  return {
    dailyResults: [{
      date: "2025-01-01",
      totalValue: 1_100_000,
      totalInvested: 1_000_000,
      returnRate: 10,
      benchmarkReturnRate: 5,
      benchmarkReturnRates: { SP500: 5 },
    }],
    primaryBenchmark: "SP500",
    cagr: null,
    xirr: 8.5,
    timeWeightedReturnRate: 9,
    calculationMethod: "DCA_XIRR_TWR",
    mdd: -2,
    relativeMdd: -1,
    sharpeRatio: 1.2,
    sortinoRatio: null,
    recoveryPeriod: null,
    totalReturnRate: 10,
    alpha: 2,
    beta: 0.9,
    comparisons: [{ benchmarkCode: "SP500", indexName: "S&P500", totalReturn: 5, alpha: 2, relativeMdd: -1, beta: 0.9 }],
    aiComment: null,
    ...overrides,
  };
}

describe("BacktestResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBacktest.mockReturnValue({
      run: mockRun,
      data: makeResponse(),
      isLoading: false,
      isError: false,
      errorCode: null,
      metrics: {
        totalReturn: 10,
        benchmarkReturn: 5,
        outperformance: 2,
        finalValue: 1_100_000,
        mdd: -2,
        relativeMdd: -1,
        sharpeRatio: 1.2,
        sortinoRatio: null,
        cagr: null,
        xirr: 8.5,
        timeWeightedReturnRate: 9,
        beta: 0.9,
        alpha: 2,
        recoveryPeriod: null,
      },
      serverMetrics: null,
      comparison: makeResponse().comparisons[0],
      aiComment: null,
    });
  });

  it("DCA는 XIRR을 표시하고 null 지표를 0으로 바꾸지 않는다", () => {
    renderWithQuery(<BacktestResult />);

    expect(screen.getByText("XIRR")).toBeInTheDocument();
    expect(screen.queryByText("CAGR")).not.toBeInTheDocument();
    expect(screen.getAllByText("데이터 없음").length).toBeGreaterThan(0);
    expect(screen.getAllByText("S&P500").length).toBeGreaterThan(0);
  });

  it("S002는 EOD 데이터 안내와 설정 변경 CTA를 제공한다", () => {
    mockUseBacktest.mockReturnValue({
      run: mockRun,
      data: undefined,
      isLoading: false,
      isError: true,
      errorCode: "S002",
      metrics: null,
      serverMetrics: null,
      comparison: null,
      aiComment: null,
    });

    renderWithQuery(<BacktestResult />);

    expect(screen.getAllByText(/EOD 시세 데이터/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "설정 변경" }));
    expect(mockNavigate).toHaveBeenCalledWith("/backtest/setup");
  });
});
