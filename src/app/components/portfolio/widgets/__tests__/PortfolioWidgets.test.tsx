import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithQuery } from "@/test/test-utils";
import { makeDiversification, makeRebalancing, makeRebalancingItem, makeValuation } from "@/test/fixtures";
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
      valuation: makeValuation(),
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

  it("DiversificationWidget는 PARTIAL/UNAVAILABLE 상태에서 빈 화면 대신 사유를 안내한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      valuation: {
        valuationStatus: "PARTIAL",
        missingSymbols: ["964002"],
      },
      diversification: {
        totalValue: null,
        assetRatios: [],
        sectorRatios: [],
        countryRatios: [],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    renderWithQuery(<DiversificationWidget />);

    expect(screen.getByText(/가격을 확인할 수 없는 종목\(964002\)이 있어 분산도를 계산할 수 없습니다/)).toBeInTheDocument();
  });

  it("DiversificationWidget는 COMPLETE 0원 상태에서 빈 화면 대신 안내를 표시한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      valuation: {
        valuationStatus: "COMPLETE",
        missingSymbols: [],
      },
      diversification: {
        totalValue: 0,
        assetRatios: [],
        sectorRatios: [],
        countryRatios: [],
      },
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    renderWithQuery(<DiversificationWidget />);

    expect(screen.getByText(/분산도 차트를 표시할 자산 비중 데이터가 없습니다/)).toBeInTheDocument();
  });

  it("RebalancingWidget는 PARTIAL·UNAVAILABLE 및 rebalancing.totalValue=null에서 무권고 대신 계산 불가를 안내한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      valuation: makeValuation({
        valuationStatus: "PARTIAL",
        missingSymbols: ["000660"],
        currentTotalValue: null,
      }),
      rebalancing: makeRebalancing({
        totalValue: null,
        items: [],
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    const { rerender } = renderWithQuery(<RebalancingWidget />);

    expect(screen.getByText("리밸런싱을 계산할 수 없습니다")).toBeInTheDocument();
    expect(screen.getByText(/000660/)).toBeInTheDocument();
    expect(screen.queryByText("리밸런싱이 필요한 항목이 없습니다.")).not.toBeInTheDocument();

    mockUsePortfolioSummary.mockReturnValue({
      valuation: makeValuation({
        valuationStatus: "UNAVAILABLE",
        missingSymbols: [],
        currentTotalValue: null,
      }),
      rebalancing: makeRebalancing({
        totalValue: null,
        items: [],
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    rerender(<RebalancingWidget />);
    expect(screen.getByText("리밸런싱을 계산할 수 없습니다")).toBeInTheDocument();
    expect(screen.queryByText("리밸런싱이 필요한 항목이 없습니다.")).not.toBeInTheDocument();

    mockUsePortfolioSummary.mockReturnValue({
      valuation: makeValuation({ valuationStatus: "COMPLETE", currentTotalValue: 11_000_000 }),
      rebalancing: makeRebalancing({
        totalValue: null,
        items: [],
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    rerender(<RebalancingWidget />);
    expect(screen.getByText("리밸런싱을 계산할 수 없습니다")).toBeInTheDocument();
    expect(screen.queryByText("리밸런싱이 필요한 항목이 없습니다.")).not.toBeInTheDocument();
  });

  it("RebalancingWidget는 정상 COMPLETE 빈 결과는 기존 무권고 상태를 유지하고 총액 0원은 분모 없음 안내를 표시한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      valuation: makeValuation({ valuationStatus: "COMPLETE", currentTotalValue: 11_000_000 }),
      rebalancing: makeRebalancing({ totalValue: 11_000_000, items: [] }),
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    const { rerender } = renderWithQuery(<RebalancingWidget />);
    expect(screen.getByText("리밸런싱이 필요한 항목이 없습니다.")).toBeInTheDocument();

    mockUsePortfolioSummary.mockReturnValue({
      valuation: makeValuation({ valuationStatus: "COMPLETE", currentTotalValue: 0 }),
      rebalancing: makeRebalancing({ totalValue: 0, items: [] }),
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    rerender(<RebalancingWidget />);
    expect(screen.getByText("비중·매매 판단을 산출할 수 없습니다")).toBeInTheDocument();
    expect(screen.getByText(/총 평가액이 0원/)).toBeInTheDocument();
    expect(screen.queryByText("리밸런싱이 필요한 항목이 없습니다.")).not.toBeInTheDocument();
  });

  it("RebalancingWidget는 현재가 0원과 양의 가격에서 산출된 수량 0을 0주 매도로 표시하지 않고 정상 양·음수를 유지한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      valuation: makeValuation({ valuationStatus: "COMPLETE", currentTotalValue: 1_000_000 }),
      rebalancing: makeRebalancing({
        totalValue: 1_000_000,
        items: [
          makeRebalancingItem({
            symbol: "005930",
            name: "영원종목",
            currentPrice: 0,
            recommendedQuantity: 0,
          }),
          makeRebalancingItem({
            symbol: "000660",
            name: "무변동종목",
            currentPrice: 75_000,
            recommendedQuantity: 0,
          }),
          makeRebalancingItem({
            symbol: "035420",
            name: "매수종목",
            currentPrice: 50_000,
            recommendedQuantity: 4,
          }),
          makeRebalancingItem({
            symbol: "035720",
            name: "매도종목",
            currentPrice: 40_000,
            recommendedQuantity: -3,
          }),
        ],
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    renderWithQuery(<RebalancingWidget />);

    expect(screen.getByText("수량 계산 불가")).toBeInTheDocument();
    expect(screen.getByText("추가 매매 없음")).toBeInTheDocument();
    expect(screen.getByText("+4주 매수")).toBeInTheDocument();
    expect(screen.getByText("3주 매도")).toBeInTheDocument();
    expect(screen.queryByText("0주 매도")).not.toBeInTheDocument();
  });

  it("RebalancingWidget는 valuation 자체가 없고 rebalancing.totalValue만 남은 비정상 응답에서 계산 불가를 표시한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      valuation: undefined,
      rebalancing: makeRebalancing({ totalValue: 11_000_000 }),
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    renderWithQuery(<RebalancingWidget />);

    expect(screen.getByText("리밸런싱을 계산할 수 없습니다")).toBeInTheDocument();
    expect(screen.queryByText("삼성전자")).not.toBeInTheDocument();
    expect(screen.queryByText(/매수/)).not.toBeInTheDocument();
  });

  it("RebalancingWidget는 currentPrice가 null이거나 생략된 항목에서 양의 recommendedQuantity가 와도 매수를 권고하지 않고 수량 계산 불가를 표시한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      valuation: makeValuation({ valuationStatus: "COMPLETE", currentTotalValue: 1_000_000 }),
      rebalancing: makeRebalancing({
        totalValue: 1_000_000,
        items: [
          makeRebalancingItem({
            symbol: "005930",
            name: "널가격종목",
            currentPrice: null as unknown as number,
            recommendedQuantity: 5,
          }),
          makeRebalancingItem({
            symbol: "000660",
            name: "생략가격종목",
            currentPrice: undefined as unknown as number,
            recommendedQuantity: 7,
          }),
        ],
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    renderWithQuery(<RebalancingWidget />);

    expect(screen.getAllByText("수량 계산 불가")).toHaveLength(2);
    expect(screen.queryByText(/매수/)).not.toBeInTheDocument();
  });

  it("RebalancingWidget는 양의 가격에서도 recommendedQuantity가 null·생략이면 수량 계산 불가를 표시하고 0원 종목+양의 현금을 구분한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      valuation: makeValuation({ valuationStatus: "COMPLETE", currentTotalValue: 1_000_000 }),
      rebalancing: makeRebalancing({
        totalValue: 1_000_000,
        items: [
          makeRebalancingItem({
            symbol: "005930",
            name: "널수량양수가격",
            currentPrice: 75_000,
            recommendedQuantity: null,
            expectedTradeAmount: 150_000,
          }),
          makeRebalancingItem({
            symbol: "000660",
            name: "생략수량양수가격",
            currentPrice: 75_000,
            recommendedQuantity: undefined as unknown as number | null,
            expectedTradeAmount: null,
          }),
          makeRebalancingItem({
            symbol: "964003",
            name: "영원종목",
            currentPrice: 0,
            recommendedQuantity: null,
            expectedTradeAmount: null,
          }),
          makeRebalancingItem({
            symbol: "KRW",
            name: "현금",
            currentPrice: 1,
            recommendedQuantity: -500_000,
            expectedTradeAmount: -500_000,
          }),
        ],
      }),
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioSummary>);

    renderWithQuery(<RebalancingWidget />);

    expect(screen.getAllByText("수량 계산 불가")).toHaveLength(3);
    expect(screen.getByText("500000주 매도")).toBeInTheDocument();
    expect(screen.queryByText("+0주 매수")).not.toBeInTheDocument();
    expect(screen.queryByText("0주 매도")).not.toBeInTheDocument();
  });
});
