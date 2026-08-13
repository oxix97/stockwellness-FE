import { useMemo } from "react";
import { isAxiosError } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { portfolioApi } from "@/api/portfolio";
import {
  BacktestRequest,
  BacktestResponse,
  BacktestRunInput,
  BenchmarkCode,
  ChartPeriod,
  PortfolioInceptionChartResponse,
} from "@/types/api";
import { useAuthStore } from "@/store/auth";

export type Period = ChartPeriod;

export const backtestKeys = {
  simulation: (portfolioId: string | null | undefined) =>
    ["backtest", "simulation", portfolioId] as const,
};

/** 기간(Period) 문자열에 따라 데이터 배열을 슬라이싱합니다. */
export function sliceByPeriod<T extends { date: string }>(items: T[] | undefined, period: Period): T[] {
  if (!items || items.length === 0) return [];
  if (period === "ALL") return items;

  const lastDate = new Date(items[items.length - 1].date);
  const startDate = new Date(lastDate);

  switch (period) {
    case "1W": startDate.setDate(lastDate.getDate() - 7); break;
    case "1M": startDate.setDate(lastDate.getDate() - 30); break;
    case "3M": startDate.setDate(lastDate.getDate() - 90); break;
    case "6M": startDate.setDate(lastDate.getDate() - 180); break;
    case "1Y": startDate.setDate(lastDate.getDate() - 365); break;
    case "3Y": startDate.setDate(lastDate.getDate() - 365 * 3); break;
    case "5Y": startDate.setDate(lastDate.getDate() - 365 * 5); break;
    default: return items;
  }

  return items.filter((item) => new Date(item.date) >= startDate);
}

interface LegacyMetricPoint {
  date: string;
  totalValue?: number | null;
  returnRate?: number | null;
  portfolioReturnRate?: number | null;
  benchmarkReturnRate?: number | null;
  benchmarkReturnRates?: Record<string, number>;
}

/**
 * 포트폴리오 요약 위젯의 과거 응답을 위한 보조 계산기입니다.
 * 백테스트 결과 화면은 서버 지표만 사용하고 이 함수로 금융 지표를 재계산하지 않습니다.
 */
export function computeMetrics(results: LegacyMetricPoint[] | undefined) {
  if (!results || results.length === 0) return null;

  const last = results[results.length - 1];
  const totalReturn = last.returnRate ?? last.portfolioReturnRate;
  const benchmarkReturn = last.benchmarkReturnRate ?? (last.benchmarkReturnRates ? Object.values(last.benchmarkReturnRates)[0] : null);
  if (totalReturn == null) return null;

  let maxVal = -Infinity;
  let maxDrawdown = 0;
  const portfolioReturns: number[] = [];
  const benchmarkReturns: number[] = [];
  results.forEach((result) => {
    const value = result.totalValue ?? (result.returnRate != null ? 1 + result.returnRate / 100 : null);
    if (value == null || !Number.isFinite(value) || value <= 0) return;
    if (value > maxVal) maxVal = value;
    const drawdown = (maxVal - value) / maxVal;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    const portfolioReturn = result.returnRate ?? result.portfolioReturnRate;
    const benchmarkValue = result.benchmarkReturnRate ?? (result.benchmarkReturnRates ? Object.values(result.benchmarkReturnRates)[0] : null);
    if (portfolioReturn != null && benchmarkValue != null) {
      portfolioReturns.push(portfolioReturn);
      benchmarkReturns.push(benchmarkValue);
    }
  });

  const beta = (() => {
    if (portfolioReturns.length < 2 || benchmarkReturns.length !== portfolioReturns.length) return null;
    const benchmarkMean = benchmarkReturns.reduce((sum, value) => sum + value, 0) / benchmarkReturns.length;
    const portfolioMean = portfolioReturns.reduce((sum, value) => sum + value, 0) / portfolioReturns.length;
    const covariance = portfolioReturns.reduce((sum, value, index) => sum + (value - portfolioMean) * (benchmarkReturns[index] - benchmarkMean), 0);
    const variance = benchmarkReturns.reduce((sum, value) => sum + (value - benchmarkMean) ** 2, 0);
    return variance === 0 ? null : +(covariance / variance).toFixed(2);
  })();

  return {
    totalReturn: +totalReturn.toFixed(1),
    benchmarkReturn: +(benchmarkReturn ?? 0).toFixed(1),
    outperformance: +(totalReturn - (benchmarkReturn ?? 0)).toFixed(1),
    finalValue: last.totalValue ?? 0,
    mdd: +(maxDrawdown * 100).toFixed(1),
    sharpeRatio: 0,
    sortinoRatio: 0,
    cagr: 0,
    beta: beta ?? 1,
    recoveryPeriod: 0,
  };
}

/** 기본값을 서버 외부 계약에 맞춰 대문자 코드로 정규화합니다. */
export function normalizeBacktestRequest(input: BacktestRunInput): BacktestRequest {
  return {
    strategy: input.strategy,
    amount: input.amount,
    primaryBenchmark: input.primaryBenchmark ?? "KOSPI",
    period: input.period ?? "1Y",
    rebalancingPeriod: input.rebalancingPeriod ?? "NONE",
    dividendReinvested: input.dividendReinvested ?? true,
    ...(input.weights ? { weights: input.weights } : {}),
  };
}

export interface BacktestMetrics {
  totalReturn: number | null;
  benchmarkReturn: number | null;
  outperformance: number | null;
  finalValue: number | null;
  mdd: number | null;
  relativeMdd: number | null;
  sharpeRatio: number | null;
  sortinoRatio: number | null;
  cagr: number | null;
  xirr: number | null;
  timeWeightedReturnRate: number | null;
  beta: number | null;
  alpha: number | null;
  recoveryPeriod: number | null;
}

function comparisonCode(comparison: BacktestResponse["comparisons"][number]): BenchmarkCode | null {
  if (comparison.benchmarkCode === "KOSPI" || comparison.benchmarkCode === "KOSDAQ" || comparison.benchmarkCode === "SP500") {
    return comparison.benchmarkCode;
  }
  if (comparison.ticker === "KOSPI" || comparison.ticker === "KOSDAQ" || comparison.ticker === "SP500") {
    return comparison.ticker;
  }
  // 과거 응답이 내부 지수 식별자를 반환하는 동안에도 primary 외부 계약과 연결한다.
  if (comparison.ticker === "SPX") return "SP500";
  if (comparison.ticker === "2001") return "KOSPI";
  if (comparison.ticker === "1001") return "KOSDAQ";
  return null;
}

function readErrorCode(error: unknown): string | null {
  if (isAxiosError(error)) {
    const payload = error.response?.data as { code?: unknown; error?: { code?: unknown } } | undefined;
    if (typeof payload?.code === "string") return payload.code;
    if (typeof payload?.error?.code === "string") return payload.error.code;
  }
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

/** 활성 포트폴리오에 대한 백테스트 요청 훅입니다. */
export function useBacktest(_period?: string) {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  const mutation = useMutation<BacktestResponse, unknown, BacktestRunInput>({
    mutationFn: (input) => {
      if (!portfolioId) throw new Error("포트폴리오가 선택되지 않았습니다.");
      return portfolioApi.runBacktest(portfolioId, normalizeBacktestRequest(input));
    },
  });

  const data = mutation.data;
  const primaryComparison = useMemo(() => {
    if (!data) return null;
    const comparisons = data.comparisons ?? [];
    return comparisons.find((comparison) => comparisonCode(comparison) === data.primaryBenchmark) ??
      (data.primaryBenchmark ? null : comparisons[0] ?? null);
  }, [data]);

  const metrics = useMemo<BacktestMetrics | null>(() => {
    if (!data || data.dailyResults.length === 0) return null;
    return {
      totalReturn: data.totalReturnRate,
      benchmarkReturn: primaryComparison?.totalReturn ?? null,
      outperformance: primaryComparison?.alpha ?? data.alpha ??
        (data.totalReturnRate != null && primaryComparison?.totalReturn != null
          ? data.totalReturnRate - primaryComparison.totalReturn
          : null),
      finalValue: data.dailyResults[data.dailyResults.length - 1]?.totalValue ?? null,
      mdd: data.mdd,
      relativeMdd: primaryComparison?.relativeMdd ?? data.relativeMdd ?? null,
      sharpeRatio: data.sharpeRatio,
      sortinoRatio: data.sortinoRatio,
      cagr: data.cagr,
      xirr: data.xirr,
      timeWeightedReturnRate: data.timeWeightedReturnRate,
      beta: primaryComparison?.beta ?? data.beta,
      alpha: primaryComparison?.alpha ?? data.alpha,
      recoveryPeriod: data.recoveryPeriod,
    };
  }, [data, primaryComparison]);

  return {
    run: mutation.mutate,
    runAsync: mutation.mutateAsync,
    reset: mutation.reset,
    retry: mutation.mutate,
    data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    errorCode: readErrorCode(mutation.error),
    metrics,
    comparison: primaryComparison,
    serverMetrics: data
      ? {
          primaryBenchmark: data.primaryBenchmark,
          cagr: data.cagr,
          xirr: data.xirr,
          timeWeightedReturnRate: data.timeWeightedReturnRate,
          mdd: data.mdd,
          relativeMdd: data.relativeMdd ?? null,
          sharpeRatio: data.sharpeRatio,
          sortinoRatio: data.sortinoRatio,
          recoveryPeriod: data.recoveryPeriod,
          beta: primaryComparison?.beta ?? data.beta,
          alpha: primaryComparison?.alpha ?? data.alpha,
          totalReturnRate: data.totalReturnRate,
          bestYearRate: data.bestYearRate ?? null,
          worstYearRate: data.worstYearRate ?? null,
        }
      : null,
    aiComment: data?.aiComment ?? null,
  };
}

/** 포트폴리오 성과 탭에서 사용하는 inception 차트 훅입니다. */
export function usePortfolioSimulation(period: ChartPeriod) {
  const portfolioId = useAuthStore((state) => state.portfolioId);

  const query = useQuery<PortfolioInceptionChartResponse>({
    queryKey: backtestKeys.simulation(portfolioId),
    queryFn: () => portfolioApi.getInceptionChart(portfolioId!),
    enabled: !!portfolioId,
    staleTime: 1000 * 60 * 10,
  });

  const filteredData = useMemo(() => {
    if (!query.data) return query.data;
    return {
      ...query.data,
      dailyResults: sliceByPeriod(query.data.dailyResults, period),
    };
  }, [query.data, period]);

  return { ...query, data: filteredData };
}
