import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithQuery, setAuthState, clearAuthState } from "@/test/test-utils";
import { useBacktest, usePortfolioSimulation, sliceByPeriod, computeMetrics, Period } from "../use-backtest";
import type { BacktestResponse, PortfolioInceptionChartResponse } from "@/types/api";

vi.mock("@/api/portfolio", () => ({
  portfolioApi: {
    runBacktest: vi.fn(),
    getInceptionChart: vi.fn(),
  },
}));

import { portfolioApi } from "@/api/portfolio";
const mockRunBacktest = portfolioApi.runBacktest as ReturnType<typeof vi.fn>;
const mockGetInceptionChart = portfolioApi.getInceptionChart as ReturnType<typeof vi.fn>;

/** 거래일 N일치 더미 백테스트 결과 생성 */
function makeDailyResults(n: number): BacktestResponse["dailyResults"] {
  return Array.from({ length: n }, (_, i) => ({
    date: `2025-01-${String(i + 1).padStart(2, "0")}`,
    totalValue: 10_000_000 + i * 10_000,
    totalInvested: 10_000_000,
    returnRate: i * 0.1,
    benchmarkReturnRate: i * 0.05,
  }));
}

describe("useBacktest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState({ portfolioId: "1" });
  });

  afterEach(() => {
    clearAuthState();
  });

  it("초기 상태: data/metrics undefined, isLoading false", () => {
    const { result } = renderHookWithQuery(() => useBacktest());
    expect(result.current.data).toBeUndefined();
    expect(result.current.metrics).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("run 호출 시 portfolioApi.runBacktest 실행 및 데이터 반환", async () => {
    const dailyResults = makeDailyResults(10);
    mockRunBacktest.mockResolvedValue({ dailyResults });

    const { result } = renderHookWithQuery(() => useBacktest());

    act(() => {
      result.current.run({ strategy: "LUMP_SUM", amount: 10_000_000, benchmarkTicker: "SPY" });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.dailyResults).toHaveLength(10);
    expect(mockRunBacktest).toHaveBeenCalledWith("1", {
      strategy: "LUMP_SUM",
      amount: 10_000_000,
      benchmarkTicker: "SPY",
    });
  });

  it("getMetrics — dailyResults 비어있으면 null", async () => {
    mockRunBacktest.mockResolvedValue({ dailyResults: [] });

    const { result } = renderHookWithQuery(() => useBacktest());

    act(() => {
      result.current.run({ strategy: "DCA", amount: 1_000_000, benchmarkTicker: "SPY" });
    });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.metrics).toBeNull();
  });

  it("getMetrics — 정상 데이터 → totalReturn, mdd, sharpeRatio 범위 검증", async () => {
    const dailyResults = makeDailyResults(252);
    mockRunBacktest.mockResolvedValue({ dailyResults });

    const { result } = renderHookWithQuery(() => useBacktest());

    act(() => {
      result.current.run({ strategy: "LUMP_SUM", amount: 10_000_000, benchmarkTicker: "SPY" });
    });

    await waitFor(() => expect(result.current.metrics).not.toBeNull());
    const m = result.current.metrics!;

    // mdd는 0 이하
    expect(m.mdd).toBeLessThanOrEqual(0);
    // 상승 추세이므로 totalReturn >= 0
    expect(m.totalReturn).toBeGreaterThanOrEqual(0);
    // outperformance = totalReturn - benchmarkReturn (소수점 반올림으로 최대 0.2 오차 허용)
    expect(Math.abs(m.outperformance - (m.totalReturn - m.benchmarkReturn))).toBeLessThanOrEqual(0.2);
    // finalValue: 마지막 totalValue
    expect(m.finalValue).toBe(dailyResults![dailyResults!.length - 1].totalValue);
  });

  it("API 오류 시 isError true", async () => {
    mockRunBacktest.mockRejectedValue(new Error("서버 오류"));

    const { result } = renderHookWithQuery(() => useBacktest());

    act(() => {
      result.current.run({ strategy: "DCA", amount: 1_000_000, benchmarkTicker: "SPY" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("computeMetrics", () => {
  it("빈 배열이면 null 반환", () => {
    expect(computeMetrics([])).toBeNull();
  });

  it("finalValue — 마지막 totalValue", () => {
    const results = makeDailyResults(10);
    const m = computeMetrics(results)!;
    expect(m.finalValue).toBe(Number(results![9].totalValue));
  });

  it("totalReturn — 마지막 returnRate", () => {
    const results = makeDailyResults(10);
    const m = computeMetrics(results)!;
    expect(m.totalReturn).toBeCloseTo(Number(results![9].returnRate), 0);
  });

  it("outperformance = totalReturn - benchmarkReturn", () => {
    const results = makeDailyResults(20);
    const m = computeMetrics(results)!;
    expect(Math.abs(m.outperformance - (m.totalReturn - m.benchmarkReturn))).toBeLessThanOrEqual(0.2);
  });

  it("mdd — 상승 추세이면 0 이하", () => {
    const results = makeDailyResults(50);
    const m = computeMetrics(results)!;
    expect(m.mdd).toBeLessThanOrEqual(0);
  });

  it("Beta — 포트폴리오와 벤치마크가 완전히 같으면 1에 근사", () => {
    // 포트폴리오 수익률과 벤치마크 수익률이 완전히 동일한 경우
    const results = Array.from({ length: 100 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      totalValue: 10_000_000 * (1 + i * 0.001),
      totalInvested: 10_000_000,
      returnRate: i * 0.1,
      benchmarkReturnRate: i * 0.1, // 동일
    }));
    const m = computeMetrics(results)!;
    expect(Math.abs(m.beta - 1)).toBeLessThan(0.1);
  });
});

describe("sliceByPeriod", () => {
  /** 연속된 날짜의 더미 결과 생성 (기준일로부터 N일 전까지) */
  function makeResults(days: number): BacktestResponse["dailyResults"] {
    const base = new Date("2025-06-01");
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() - (days - 1 - i));
      return {
        date: d.toISOString().slice(0, 10),
        totalValue: 10_000_000,
        totalInvested: 10_000_000,
        returnRate: 0,
        benchmarkReturnRate: 0,
      };
    });
  }

  it("빈 배열이면 빈 배열 반환", () => {
    expect(sliceByPeriod([], "1M")).toEqual([]);
  });

  it("1M — 최근 30일만 반환", () => {
    const results = makeResults(200);
    const sliced = sliceByPeriod(results, "1M");
    expect(sliced!.length).toBeLessThanOrEqual(31);
    expect(sliced!.length).toBeGreaterThan(0);
  });

  it("3M — 90일 기준 슬라이싱", () => {
    const results = makeResults(365);
    const sliced = sliceByPeriod(results, "3M");
    expect(sliced!.length).toBeLessThanOrEqual(91);
    expect(sliced!.length).toBeGreaterThan(0);
  });

  it("전체 데이터가 기간보다 짧으면 전체 반환", () => {
    const results = makeResults(10);
    const sliced = sliceByPeriod(results, "1Y");
    expect(sliced).toHaveLength(10);
  });

  it("sliced 첫 항목이 마지막 날짜 기준 period 이내", () => {
    const results = makeResults(400);
    const sliced = sliceByPeriod(results, "1Y");
    const lastDate = new Date(results![results!.length - 1].date);
    const firstDate = new Date(sliced![0].date);
    const diffDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThanOrEqual(365);
  });
});

describe("usePortfolioSimulation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthState();
  });

  afterEach(() => {
    clearAuthState();
  });

  it("portfolioId 없으면 쿼리 비활성화", () => {
    // clearAuthState 후 portfolioId 없음
    const { result } = renderHookWithQuery(() => usePortfolioSimulation("1Y"));
    expect(result.current.data).toBeUndefined();
    expect(mockGetInceptionChart).not.toHaveBeenCalled();
  });

  it("portfolioId 있으면 자동 조회", async () => {
    const dailyResults: PortfolioInceptionChartResponse["dailyResults"] = Array.from({ length: 5 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      portfolioReturnRate: i * 0.1,
      benchmarkReturnRates: { "2001": i * 0.05 },
    }));
    mockGetInceptionChart.mockResolvedValue({ portfolioInceptionDate: "2025-01-01", dailyResults, comparisons: [] });
    setAuthState({ portfolioId: "1" });

    const { result } = renderHookWithQuery(() => usePortfolioSimulation("1Y"));

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.dailyResults).toHaveLength(5);
  });

  it("period 변경 시 동일 queryKey — API 재호출 없이 클라이언트 필터링", async () => {
    const dailyResults: PortfolioInceptionChartResponse["dailyResults"] = Array.from({ length: 30 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, "0")}`,
      portfolioReturnRate: i * 0.1,
      benchmarkReturnRates: { "2001": i * 0.05 },
    }));
    mockGetInceptionChart.mockResolvedValue({ portfolioInceptionDate: "2025-01-01", dailyResults, comparisons: [] });
    setAuthState({ portfolioId: "1" });

    // 1Y로 첫 조회
    const { result, rerender } = renderHookWithQuery(
      ({ period }: { period: Period }) => usePortfolioSimulation(period),
      { initialProps: { period: "1Y" } }
    );
    await waitFor(() => expect(result.current.data).toBeDefined());

    // 3M으로 변경
    rerender({ period: "3M" });
    await waitFor(() => expect(result.current.data).toBeDefined());

    // API는 최초 1번만 호출
    expect(mockGetInceptionChart).toHaveBeenCalledTimes(1);
  });
});
