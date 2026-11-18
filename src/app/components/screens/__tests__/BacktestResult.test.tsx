import React, { createContext, useContext } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen, within } from "@testing-library/react";
import { renderWithQuery } from "@/test/test-utils";
import type { BacktestResponse, BacktestRouteState } from "@/types/api";
import { BacktestResult, buildBacktestChartData } from "../BacktestResult";

const mockNavigate = vi.fn();
const mockRun = vi.fn();
const mockUseBacktest = vi.fn();
let currentRouteState: BacktestRouteState = {
  strategy: "DCA",
  amount: 1_000_000,
  primaryBenchmark: "SP500",
  period: "1Y",
  rebalancingPeriod: "NONE",
  dividendReinvested: true,
  weights: { "005930": 100 },
};

const ChartDataContext = createContext<Array<Record<string, unknown>>>([]);

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: currentRouteState }),
  };
});

vi.mock("@/hooks/use-backtest", () => ({
  useBacktest: (...args: unknown[]) => mockUseBacktest(...args),
}));

vi.mock("recharts", () => {
  const ResponsiveContainer = ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="recharts-responsive-container">{children}</div>
  );
  const ComposedChart = ({
    data = [],
    children,
  }: {
    data?: Array<Record<string, unknown>>;
    children?: React.ReactNode;
  }) => (
    <ChartDataContext.Provider value={data}>
      <div data-testid="recharts-composed-chart" data-point-count={data.length}>
        {children}
      </div>
    </ChartDataContext.Provider>
  );
  const Tooltip = ({
    content,
  }: {
    content?: (props: { active: boolean; payload: Array<{ payload: Record<string, unknown> }> }) => React.ReactNode;
  }) => {
    const data = useContext(ChartDataContext);
    if (!content || data.length === 0) return null;
    return (
      <div data-testid="recharts-tooltip-list">
        {data.map((point, index) => (
          <div key={String(point.date ?? index)} data-testid={`chart-tooltip-point-${String(point.date ?? index)}`}>
            {content({ active: true, payload: [{ payload: point }] })}
          </div>
        ))}
      </div>
    );
  };
  const Line = ({
    dataKey,
    name,
    isAnimationActive,
  }: {
    dataKey?: string;
    name?: string;
    isAnimationActive?: boolean;
  }) => (
    <div
      data-testid={`recharts-line-${String(dataKey)}`}
      data-name={name}
      data-animation-active={String(isAnimationActive)}
    />
  );
  const XAxis = () => <div data-testid="recharts-xaxis" />;

  return {
    ResponsiveContainer,
    ComposedChart,
    Tooltip,
    Line,
    XAxis,
  };
});

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

const representativeDailyResults: BacktestResponse["dailyResults"] = [
  {
    date: "2025-11-18",
    totalValue: 10_000_000,
    totalInvested: 10_000_000,
    returnRate: 0,
    benchmarkReturnRate: 0,
    benchmarkReturnRates: { KOSPI: 0, KOSDAQ: 0, SP500: 0 },
  },
  {
    date: "2025-11-19",
    totalValue: 9_933_683,
    totalInvested: 10_000_000,
    returnRate: -0.6632,
    benchmarkReturnRate: 0.378,
    benchmarkReturnRates: { KOSPI: 0.378, KOSDAQ: 0.5197, SP500: 0.6162 },
  },
  {
    date: "2026-11-13",
    totalValue: 10_840_429,
    totalInvested: 10_000_000,
    returnRate: 9.128,
    benchmarkReturnRate: 28.6385,
    benchmarkReturnRates: { KOSPI: 28.6385, KOSDAQ: -22.3724, SP500: 15.761 },
  },
  {
    date: "2026-11-16",
    totalValue: 10_840_429,
    totalInvested: 10_000_000,
    returnRate: 0,
    benchmarkReturnRate: 28.6837,
    benchmarkReturnRates: { KOSPI: 28.6837, KOSDAQ: -21.466, SP500: 15.761 },
  },
  {
    date: "2026-11-17",
    totalValue: 8_484_175,
    totalInvested: 10_000_000,
    returnRate: -21.7358,
    benchmarkReturnRate: 29.0165,
    benchmarkReturnRates: { KOSPI: 29.0165, KOSDAQ: -21.8528, SP500: 16.3772 },
  },
];

describe("buildBacktestChartData", () => {
  it("일간 수익률을 단순 합산이 아니라 복리로 누적한다", () => {
    const chartData = buildBacktestChartData(
      [
        {
          date: "2026-11-10",
          totalValue: 10_000_000,
          totalInvested: 10_000_000,
          returnRate: 0,
          benchmarkReturnRate: 0,
          benchmarkReturnRates: { KOSPI: 0 },
        },
        {
          date: "2026-11-11",
          totalValue: 11_000_000,
          totalInvested: 10_000_000,
          returnRate: 10,
          benchmarkReturnRate: 2,
          benchmarkReturnRates: { KOSPI: 2 },
        },
        {
          date: "2026-11-12",
          totalValue: 9_900_000,
          totalInvested: 10_000_000,
          returnRate: -10,
          benchmarkReturnRate: 1,
          benchmarkReturnRates: { KOSPI: 1 },
        },
      ],
      "KOSPI",
    );

    expect(chartData.map((point) => point.date)).toEqual(["2026-11-10", "2026-11-11", "2026-11-12"]);
    expect(chartData[0].returnRate).toBeCloseTo(0, 6);
    expect(chartData[1].returnRate).toBeCloseTo(10, 6);
    expect(chartData[2].returnRate).toBeCloseTo(-1, 6);
  });

  it("대표 11/17 거치식·DCA 시계열에서 일간 TWR을 복리 누적해 -15.1582%와 주 벤치마크 누적 수익률을 반환한다", () => {
    const lumpChart = buildBacktestChartData(representativeDailyResults, "KOSPI");
    expect(lumpChart[0]).toEqual({ date: "2025-11-18", returnRate: 0, benchmarkReturnRate: 0 });
    expect(lumpChart[2].returnRate).toBeCloseTo(8.4043, 3);
    expect(lumpChart[2].benchmarkReturnRate).toBeCloseTo(28.6385, 4);
    expect(lumpChart[4].returnRate).toBeCloseTo(-15.1582, 3);
    expect(lumpChart[4].benchmarkReturnRate).toBeCloseTo(29.0165, 4);

    const dcaDailyResults: BacktestResponse["dailyResults"] = representativeDailyResults.map((item, idx) => ({
      ...item,
      totalInvested: (idx + 1) * 10_000_000,
      totalValue: idx === 4 ? 106_498_577 : item.totalValue * (idx + 1),
    }));
    const dcaKosdaqChart = buildBacktestChartData(dcaDailyResults, "KOSDAQ");
    expect(dcaKosdaqChart[4].returnRate).toBeCloseTo(-15.1582, 3);
    expect(dcaKosdaqChart[4].benchmarkReturnRate).toBeCloseTo(-21.8528, 4);
  });

  it("0% 벤치마크 보존, 폴백, 비정상(NaN/null) 결측 처리 및 API 명시 누적값 우선 사용을 보장한다", () => {
    const chartData = buildBacktestChartData(
      [
        {
          date: "2026-11-10",
          totalValue: 10_000_000,
          totalInvested: 10_000_000,
          returnRate: 0,
          benchmarkReturnRate: 99,
          benchmarkReturnRates: { SP500: 0 },
        },
        {
          date: "2026-11-11",
          totalValue: 10_000_000,
          totalInvested: 10_000_000,
          returnRate: Number.NaN,
          benchmarkReturnRate: 3.5,
          benchmarkReturnRates: {},
        },
        {
          date: "2026-11-12",
          totalValue: 11_000_000,
          totalInvested: 10_000_000,
          returnRate: 10,
          benchmarkReturnRate: null,
          benchmarkReturnRates: { SP500: -4.2 },
        },
        {
          date: "2026-11-13",
          totalValue: 12_000_000,
          totalInvested: 10_000_000,
          returnRate: 5,
          cumulativeReturnRate: 15.1582,
          benchmarkReturnRate: null,
          benchmarkReturnRates: { SP500: 1.5 },
        } as BacktestResponse["dailyResults"][number],
      ],
      "SP500",
    );

    expect(chartData[0]).toEqual({ date: "2026-11-10", returnRate: 0, benchmarkReturnRate: 0 });
    expect(chartData[1]).toEqual({ date: "2026-11-11", returnRate: null, benchmarkReturnRate: 3.5 });
    expect(chartData[2].returnRate).toBeCloseTo(10, 6);
    expect(chartData[2].benchmarkReturnRate).toBeCloseTo(-4.2, 6);
    expect(chartData[3].returnRate).toBeCloseTo(15.1582, 6);
    expect(chartData[3].benchmarkReturnRate).toBeCloseTo(1.5, 6);
  });
});

describe("BacktestResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentRouteState = {
      strategy: "DCA",
      amount: 1_000_000,
      primaryBenchmark: "SP500",
      period: "1Y",
      rebalancingPeriod: "NONE",
      dividendReinvested: true,
      weights: { "005930": 100 },
    };
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

  it("거치식(LUMP_SUM)+KOSPI 차트 툴팁은 11/13·11/17에 일간 TWR 대신 복리 누적 수익률과 부호, CAGR 스칼라를 표시한다", () => {
    currentRouteState = {
      strategy: "LUMP_SUM",
      amount: 10_000_000,
      primaryBenchmark: "KOSPI",
      period: "1Y",
      rebalancingPeriod: "NONE",
      dividendReinvested: false,
      weights: { "964001": 100 },
    };
    const kospiComparison = {
      benchmarkCode: "KOSPI" as const,
      indexName: "코스피",
      totalReturn: 29.0165,
      alpha: -44.1748,
      relativeMdd: 19.7457,
      beta: -0.0329,
    };
    mockUseBacktest.mockReturnValue({
      run: mockRun,
      data: makeResponse({
        dailyResults: representativeDailyResults,
        primaryBenchmark: "KOSPI",
        cagr: -15.1966,
        xirr: null,
        timeWeightedReturnRate: -15.1582,
        calculationMethod: "LUMP_SUM_CAGR_TWR",
        mdd: 21.7358,
        relativeMdd: 19.7457,
        totalReturnRate: -15.1582,
        alpha: -44.1748,
        beta: -0.0329,
        comparisons: [kospiComparison],
      }),
      isLoading: false,
      isError: false,
      errorCode: null,
      metrics: {
        totalReturn: -15.1582,
        benchmarkReturn: 29.0165,
        outperformance: -44.1748,
        finalValue: 8_484_175,
        mdd: 21.7358,
        relativeMdd: 19.7457,
        sharpeRatio: 0,
        sortinoRatio: 0,
        cagr: -15.1966,
        xirr: null,
        timeWeightedReturnRate: -15.1582,
        beta: -0.0329,
        alpha: -44.1748,
        recoveryPeriod: null,
      },
      serverMetrics: { primaryBenchmark: "KOSPI" },
      comparison: kospiComparison,
      aiComment: null,
    });

    renderWithQuery(<BacktestResult />);

    const day0Tooltip = screen.getByTestId("chart-tooltip-point-2025-11-18");
    expect(within(day0Tooltip).getByText("Nov 18")).toBeInTheDocument();
    expect(within(day0Tooltip).getAllByLabelText("보합 0.00%")).toHaveLength(2);

    const nov13Tooltip = screen.getByTestId("chart-tooltip-point-2026-11-13");
    expect(within(nov13Tooltip).getByText("Nov 13")).toBeInTheDocument();
    expect(within(nov13Tooltip).getByText(/내 포트폴리오:/)).toHaveTextContent("내 포트폴리오: ▲ 8.4%");
    expect(within(nov13Tooltip).getByText(/KOSPI:/)).toHaveTextContent("KOSPI: ▲ 28.6%");

    const nov17Tooltip = screen.getByTestId("chart-tooltip-point-2026-11-17");
    expect(within(nov17Tooltip).getByText("Nov 17")).toBeInTheDocument();
    expect(within(nov17Tooltip).getByText(/내 포트폴리오:/)).toHaveTextContent("내 포트폴리오: ▼ 15.2%");
    expect(within(nov17Tooltip).getByText(/내 포트폴리오:/)).not.toHaveTextContent("21.7%");
    expect(within(nov17Tooltip).getByLabelText("하락 ▼ 15.2%")).toHaveClass("text-down");
    expect(within(nov17Tooltip).getByText(/KOSPI:/)).toHaveTextContent("KOSPI: ▲ 29.0%");
    expect(within(nov17Tooltip).getByLabelText("상승 ▲ 29.0%")).toHaveClass("text-up");

    expect(screen.getByText("CAGR")).toBeInTheDocument();
    expect(screen.queryByText("XIRR")).not.toBeInTheDocument();
    expect(screen.getByText("10,000,000원이")).toBeInTheDocument();
    expect(screen.getByText("₩ 8,484,175")).toBeInTheDocument();
    expect(screen.getByText("되었을 거예요!")).toBeInTheDocument();
    expect(screen.queryByText(/월 적립액/)).not.toBeInTheDocument();
    expect(screen.queryByText(/총 납입액/)).not.toBeInTheDocument();
    expect(screen.getByText(/EOD 시세로 계산한/)).toBeInTheDocument();
  });

  it("적립식(DCA)+KOSDAQ 차트 툴팁은 복리 누적 수익률(-15.2%)과 음수 벤치마크 부호(▼ 21.9%), XIRR 스칼라를 보존한다", () => {
    currentRouteState = {
      strategy: "DCA",
      amount: 10_000_000,
      primaryBenchmark: "KOSDAQ",
      period: "1Y",
      rebalancingPeriod: "NONE",
      dividendReinvested: false,
      weights: { "964001": 100 },
    };
    const kosdaqComparison = {
      benchmarkCode: "KOSDAQ" as const,
      indexName: "코스닥",
      totalReturn: -21.8528,
      alpha: 6.6945,
      relativeMdd: -1.0379,
      beta: 0.0229,
    };
    mockUseBacktest.mockReturnValue({
      run: mockRun,
      data: makeResponse({
        dailyResults: representativeDailyResults.map((item, idx) => ({
          ...item,
          totalInvested: (idx + 1) * 10_000_000,
          totalValue: idx === 4 ? 106_498_577 : item.totalValue * (idx + 1),
        })),
        primaryBenchmark: "KOSDAQ",
        cagr: null,
        xirr: -31.707,
        timeWeightedReturnRate: -15.1582,
        calculationMethod: "DCA_XIRR_TWR",
        mdd: 21.7358,
        relativeMdd: -1.0379,
        totalReturnRate: -15.1582,
        alpha: 6.6945,
        beta: 0.0229,
        comparisons: [kosdaqComparison],
      }),
      isLoading: false,
      isError: false,
      errorCode: null,
      metrics: {
        totalReturn: -15.1582,
        benchmarkReturn: -21.8528,
        outperformance: 6.6945,
        finalValue: 106_498_577,
        mdd: 21.7358,
        relativeMdd: -1.0379,
        sharpeRatio: 0,
        sortinoRatio: 0,
        cagr: null,
        xirr: -31.707,
        timeWeightedReturnRate: -15.1582,
        beta: 0.0229,
        alpha: 6.6945,
        recoveryPeriod: null,
      },
      serverMetrics: { primaryBenchmark: "KOSDAQ" },
      comparison: kosdaqComparison,
      aiComment: null,
    });

    renderWithQuery(<BacktestResult />);

    const nov17Tooltip = screen.getByTestId("chart-tooltip-point-2026-11-17");
    expect(within(nov17Tooltip).getByText("Nov 17")).toBeInTheDocument();
    expect(within(nov17Tooltip).getByText(/내 포트폴리오:/)).toHaveTextContent("내 포트폴리오: ▼ 15.2%");
    expect(within(nov17Tooltip).getByText(/KOSDAQ:/)).toHaveTextContent("KOSDAQ: ▼ 21.9%");
    expect(within(nov17Tooltip).getByLabelText("하락 ▼ 21.9%")).toHaveClass("text-down");

    const xirrCard = screen.getByText("XIRR").closest("div")?.parentElement;
    expect(xirrCard).toHaveTextContent("▼ 31.7%");
    expect(screen.queryByText("CAGR")).not.toBeInTheDocument();
  });

  it("적립식(DCA) 히어로는 월 적립액과 최종 평가액을 구분하고 서버 총 납입액(130,000,000원)을 추정 없이 표시한다", () => {
    currentRouteState = {
      strategy: "DCA",
      amount: 10_000_000,
      primaryBenchmark: "KOSDAQ",
      period: "1Y",
      rebalancingPeriod: "NONE",
      dividendReinvested: false,
      weights: { "964001": 100 },
    };
    mockUseBacktest.mockReturnValue({
      run: mockRun,
      data: makeResponse({
        dailyResults: representativeDailyResults.map((item, idx) => ({
          ...item,
          totalInvested: idx === 4 ? 130_000_000 : (idx + 1) * 10_000_000,
          totalValue: idx === 4 ? 106_498_577 : item.totalValue * (idx + 1),
        })),
        primaryBenchmark: "KOSDAQ",
        cagr: null,
        xirr: -31.707,
        timeWeightedReturnRate: -15.1582,
        calculationMethod: "DCA_XIRR_TWR",
        totalReturnRate: -15.1582,
      }),
      isLoading: false,
      isError: false,
      errorCode: null,
      metrics: {
        totalReturn: -15.1582,
        benchmarkReturn: -21.8528,
        outperformance: 6.6945,
        finalValue: 106_498_577,
        mdd: 21.7358,
        relativeMdd: -1.0379,
        sharpeRatio: 0,
        sortinoRatio: 0,
        cagr: null,
        xirr: -31.707,
        timeWeightedReturnRate: -15.1582,
        beta: 0.0229,
        alpha: 6.6945,
        recoveryPeriod: null,
      },
      serverMetrics: { primaryBenchmark: "KOSDAQ" },
      comparison: null,
      aiComment: null,
    });

    renderWithQuery(<BacktestResult />);

    expect(screen.getByText("월 적립액 10,000,000원")).toBeInTheDocument();
    expect(screen.getByText("총 납입액 130,000,000원")).toBeInTheDocument();
    expect(screen.getByText("최종 평가액")).toBeInTheDocument();
    expect(screen.getByText("₩ 106,498,577")).toBeInTheDocument();
    expect(screen.queryByText("10,000,000원이")).not.toBeInTheDocument();
    expect(screen.queryByText("되었을 거예요!")).not.toBeInTheDocument();
    expect(screen.getByText(/EOD 시세로 계산한/)).toBeInTheDocument();
  });

  it("적립식(DCA)에서 서버 총 납입액이 없거나 유효하지 않으면 날짜·회차로 추정해 총 납입액을 표시하지 않는다", () => {
    currentRouteState = {
      strategy: "DCA",
      amount: 10_000_000,
      primaryBenchmark: "SP500",
      period: "1Y",
      rebalancingPeriod: "NONE",
      dividendReinvested: false,
      weights: { "964001": 100 },
    };
    mockUseBacktest.mockReturnValue({
      run: mockRun,
      data: makeResponse({
        dailyResults: representativeDailyResults.map((item, idx) => ({
          ...item,
          totalInvested: 0,
          totalValue: idx === 4 ? 106_498_577 : item.totalValue,
        })),
        primaryBenchmark: "SP500",
        cagr: null,
        xirr: -31.707,
        timeWeightedReturnRate: -15.1582,
        calculationMethod: "DCA_XIRR_TWR",
        totalReturnRate: -15.1582,
      }),
      isLoading: false,
      isError: false,
      errorCode: null,
      metrics: {
        totalReturn: -15.1582,
        benchmarkReturn: 16.3772,
        outperformance: -31.5355,
        finalValue: 106_498_577,
        mdd: 21.7358,
        relativeMdd: 15.348,
        sharpeRatio: 0,
        sortinoRatio: 0,
        cagr: null,
        xirr: -31.707,
        timeWeightedReturnRate: -15.1582,
        beta: -0.0123,
        alpha: -31.5355,
        recoveryPeriod: null,
      },
      serverMetrics: { primaryBenchmark: "SP500" },
      comparison: null,
      aiComment: null,
    });

    renderWithQuery(<BacktestResult />);

    expect(screen.getByText("월 적립액 10,000,000원")).toBeInTheDocument();
    expect(screen.getByText("최종 평가액")).toBeInTheDocument();
    expect(screen.getByText("₩ 106,498,577")).toBeInTheDocument();
    expect(screen.queryByText(/총 납입액/)).not.toBeInTheDocument();
    expect(screen.queryByText("10,000,000원이")).not.toBeInTheDocument();
  });
});
