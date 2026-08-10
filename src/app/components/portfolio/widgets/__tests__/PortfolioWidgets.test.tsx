import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithQuery } from "@/test/test-utils";
import { makeDiversification, makeRebalancing } from "@/test/fixtures";
import { DiversificationWidget } from "../DiversificationWidget";
import { RebalancingWidget } from "../RebalancingWidget";
import { SimulationWidget } from "../SimulationWidget";

vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolioSummary: vi.fn(),
}));

vi.mock("@/hooks/use-backtest", () => ({
  usePortfolioSimulation: vi.fn(),
  computeMetrics: vi.fn(),
}));

vi.mock("../AIAdviceWidget", () => ({
  AIAdviceWidget: () => <div>AIAdviceWidget</div>,
}));

vi.mock("recharts", () => {
  const Base = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Base,
    PieChart: Base,
    LineChart: Base,
    Tooltip: Base,
    Legend: Base,
    CartesianGrid: Base,
    XAxis: Base,
    YAxis: Base,
    Cell: () => <div />,
    Pie: ({ dataKey, nameKey }: { dataKey?: string; nameKey?: string }) => (
      <div data-testid="pie-props" data-data-key={dataKey} data-name-key={nameKey} />
    ),
    Line: ({ dataKey, name }: { dataKey?: string; name?: string }) => (
      <div data-testid="line-props" data-data-key={String(dataKey)} data-name={name} />
    ),
  };
});

import { usePortfolioSummary } from "@/hooks/use-portfolio";
import { usePortfolioSimulation, computeMetrics } from "@/hooks/use-backtest";

const mockUsePortfolioSummary = vi.mocked(usePortfolioSummary);
const mockUsePortfolioSimulation = vi.mocked(usePortfolioSimulation);
const mockComputeMetrics = vi.mocked(computeMetrics);

describe("Portfolio widgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("DiversificationWidget는 백엔드 name/value 스키마를 사용한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      diversification: makeDiversification(),
      isLoading: false,
    } as ReturnType<typeof usePortfolioSummary>);

    renderWithQuery(<DiversificationWidget />);

    const pie = screen.getAllByTestId("pie-props")[0];
    expect(pie).toHaveAttribute("data-data-key", "value");
    expect(pie).toHaveAttribute("data-name-key", "name");
  });

  it("RebalancingWidget는 lastUpdated 없이도 리밸런싱 정보를 렌더링한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      rebalancing: makeRebalancing(),
      isLoading: false,
    } as ReturnType<typeof usePortfolioSummary>);

    renderWithQuery(<RebalancingWidget />);

    expect(screen.getByText("현재 목표 비중 대비 이탈 현황")).toBeInTheDocument();
    expect(screen.getByText("삼성전자")).toBeInTheDocument();
    expect(screen.queryByText(/정보 없음/)).not.toBeInTheDocument();
  });

  it("SimulationWidget는 benchmark line의 dataKey로 ticker를 사용한다", () => {
    mockUsePortfolioSimulation.mockReturnValue({
      data: {
        portfolioInceptionDate: "2026-01-01",
        daysElapsed: 1,
        dailyResults: [
          {
            date: "2026-01-01",
            portfolioReturnRate: 1.2,
            benchmarkReturnRates: { SPX: 0.9 },
          },
        ],
        comparisons: [
          {
            ticker: "SPX",
            indexName: "S&P 500",
            totalReturn: 0.9,
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePortfolioSimulation>);
    mockComputeMetrics.mockReturnValue({
      totalReturn: 1.2,
      benchmarkReturn: 0.9,
      outperformance: 0.3,
      finalValue: 11200000,
      mdd: 0.5,
      sharpeRatio: 1.1,
      sortinoRatio: 0.8,
      cagr: 1.2,
      beta: 1.0,
      recoveryPeriod: 0,
    });

    renderWithQuery(<SimulationWidget />);

    const lines = screen.getAllByTestId("line-props");
    expect(lines[0]).toHaveAttribute("data-data-key", "portfolio");
    expect(lines[0]).toHaveAttribute("data-name", "내 포트폴리오");

    const benchmarkLine = lines[1];
    expect(benchmarkLine).toHaveAttribute("data-data-key", "SPX");
    expect(benchmarkLine).toHaveAttribute("data-name", "S&P 500");
  });
});
