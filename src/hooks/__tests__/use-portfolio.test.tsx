import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithQuery, setAuthState, clearAuthState } from "@/test/test-utils";
import { makeValuation, makeDiversification, makePortfolio, makeRebalancing } from "@/test/fixtures";
import { usePortfolio, useCreatePortfolio, useCreateSimulatedPortfolio, useUpdatePortfolio, usePortfolioSummary } from "../use-portfolio";

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/api/portfolio", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/portfolio")>();
  return {
    ...actual,
    portfolioApi: {
      getValuation: vi.fn(),
      getDiversification: vi.fn(),
      getAdvice: vi.fn(),
      createAdvice: vi.fn(),
      getHoldings: vi.fn(),
      getCorrelation: vi.fn(),
      getRebalancing: vi.fn(),
      getAnalysisSummary: vi.fn(),
      getHealth: vi.fn(),
      create: vi.fn(),
      createSimulated: vi.fn(),
      updatePortfolio: vi.fn(),
    },
  };
});

import { portfolioApi } from "@/api/portfolio";
import { toast } from "sonner";

const mockPortfolioApi = portfolioApi as unknown as {
  getValuation: ReturnType<typeof vi.fn>;
  getDiversification: ReturnType<typeof vi.fn>;
  getAdvice: ReturnType<typeof vi.fn>;
  createAdvice: ReturnType<typeof vi.fn>;
  getHoldings: ReturnType<typeof vi.fn>;
  getCorrelation: ReturnType<typeof vi.fn>;
  getRebalancing: ReturnType<typeof vi.fn>;
  getAnalysisSummary: ReturnType<typeof vi.fn>;
  getHealth: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  createSimulated: ReturnType<typeof vi.fn>;
  updatePortfolio: ReturnType<typeof vi.fn>;
};

describe("usePortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearAuthState();
  });

  it("portfolioId 없으면 모든 쿼리 비활성화 — isLoading false, 데이터 undefined", () => {
    // portfolioId 없는 상태 (clearAuthState 후 기본값)
    const { result } = renderHookWithQuery(() => usePortfolio());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.valuation).toBeUndefined();
    expect(result.current.diversification).toBeUndefined();
    expect(result.current.holdings).toBeUndefined();
    expect(mockPortfolioApi.getValuation).not.toHaveBeenCalled();
  });

  it("portfolioId 있으면 valuation 정상 응답", async () => {
    const valuation = makeValuation();
    mockPortfolioApi.getAnalysisSummary.mockResolvedValue({
      valuation,
      diversification: makeDiversification(),
      rebalancing: makeRebalancing(),
      itemContributions: {},
    });
    mockPortfolioApi.getHoldings.mockResolvedValue(makePortfolio());
    mockPortfolioApi.getHealth.mockResolvedValue({ overallScore: 80, categories: {} });

    setAuthState({ portfolioId: "1" });
    const { result } = renderHookWithQuery(() => usePortfolio());

    await waitFor(() => expect(result.current.valuation).toBeDefined());
    expect(result.current.valuation).toEqual(valuation);
    expect(mockPortfolioApi.getAnalysisSummary).toHaveBeenCalledWith("1");
  });

  it("getHealthScore — 정상 데이터 → overallScore 0~100 범위", async () => {
    const valuation = makeValuation({
      totalReturnRate: 10,
      mdd: -5,
      sharpeRatio: 1.5,
    });
    mockPortfolioApi.getAnalysisSummary.mockResolvedValue({ 
      valuation,
      diversification: makeDiversification({
        sectorRatios: [
          { name: "전기전자", value: 50 },
          { name: "바이오", value: 40 },
          { name: "금융", value: 10 },
        ],
        assetRatios: [
          { name: "STOCK", value: 85 },
          { name: "CASH", value: 15 },
        ],
      }),
      rebalancing: makeRebalancing(),
      itemContributions: {}
    });
    mockPortfolioApi.getHealth.mockResolvedValue({
      overallScore: 85,
      categories: { "수익성": 90, "안정성": 80, "효율성": 85, "분산도": 70, "시장민감도": 95 }
    });
    mockPortfolioApi.getHoldings.mockResolvedValue(makePortfolio());

    setAuthState({ portfolioId: "1" });
    const { result } = renderHookWithQuery(() => usePortfolio());

    await waitFor(() => expect(result.current.valuation).toBeDefined());
    await waitFor(() => expect(result.current.diversification).toBeDefined());

    const { overallScore, radarData } = result.current.health;
    expect(overallScore).toBe(85);
    expect(radarData).toHaveLength(5);
  });

  it("getHealthScore — valuation 없으면 radarData 빈 배열, overallScore undefined", () => {
    // portfolioId 없는 상태 → 쿼리 비활성 → data undefined
    const { result } = renderHookWithQuery(() => usePortfolio());

    const { overallScore, radarData } = result.current.health;
    expect(overallScore).toBeUndefined();
    expect(radarData).toEqual([]);
  });

  it("usePortfolio는 advice를 반환하지 않고 holdings/valuation만 유지한다", async () => {
    mockPortfolioApi.getAnalysisSummary.mockResolvedValue({ 
      valuation: makeValuation(),
      diversification: makeDiversification(),
      rebalancing: makeRebalancing(),
      itemContributions: {}
    });
    mockPortfolioApi.getHoldings.mockResolvedValue(makePortfolio());
    mockPortfolioApi.getHealth.mockResolvedValue({ overallScore: 80, categories: {} });

    setAuthState({ portfolioId: "1" });
    const { result } = renderHookWithQuery(() => usePortfolio());

    await waitFor(() => expect(result.current.valuation).toBeDefined());
    expect("advice" in result.current).toBe(false);
    expect(result.current.holdings?.items).toHaveLength(1);
  });

  it("usePortfolio는 AI 조언 조회 없이 기본 데이터만 로딩한다", async () => {
    mockPortfolioApi.getAnalysisSummary.mockResolvedValue({
      valuation: makeValuation(),
      diversification: makeDiversification(),
      rebalancing: makeRebalancing(),
      itemContributions: {}
    });
    mockPortfolioApi.getHoldings.mockResolvedValue(makePortfolio());
    mockPortfolioApi.getHealth.mockResolvedValue({ overallScore: 80, categories: {} });

    setAuthState({ portfolioId: "1" });
    const { result } = renderHookWithQuery(() => usePortfolio());

    await waitFor(() => expect(result.current.holdings).toBeDefined());
    expect(mockPortfolioApi.getAdvice).not.toHaveBeenCalled();
    expect(mockPortfolioApi.createAdvice).not.toHaveBeenCalled();
  });
});

describe("usePortfolioSummary — valuation 상태 계약", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState({ portfolioId: "1" });
  });

  afterEach(() => {
    clearAuthState();
  });

  it("PARTIAL 응답의 null 집계값과 기준일을 가공하지 않고 노출한다", async () => {
    const valuation = makeValuation({
      valuationStatus: "PARTIAL",
      asOfDate: "2026-08-07",
      missingSymbols: ["000660"],
      currentTotalValue: null,
      totalProfitLoss: null,
      totalReturnRate: null,
    });
    mockPortfolioApi.getAnalysisSummary.mockResolvedValue({
      valuation,
      diversification: makeDiversification(),
      rebalancing: makeRebalancing(),
      itemContributions: {},
    });

    const { result } = renderHookWithQuery(() => usePortfolioSummary());

    await waitFor(() => expect(result.current.valuation?.valuationStatus).toBe("PARTIAL"));
    expect(result.current.valuation?.currentTotalValue).toBeNull();
    expect(result.current.valuation?.asOfDate).toBe("2026-08-07");
    expect(result.current.valuation?.missingSymbols).toEqual(["000660"]);
  });
});

describe("useCreatePortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState({ portfolioId: undefined });
  });

  afterEach(() => {
    clearAuthState();
  });

  it("create 성공 시 portfolioId 스토어에 저장", async () => {
    mockPortfolioApi.create.mockResolvedValue(42);

    const { result } = renderHookWithQuery(() => useCreatePortfolio());

    result.current.mutate({
      name: "테스트",
      description: "설명",
      items: [],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const { useAuthStore } = await import("@/store/auth");
    expect(useAuthStore.getState().portfolioId).toBe("42");
  });
});

describe("useCreateSimulatedPortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState({ portfolioId: undefined });
  });

  afterEach(() => {
    clearAuthState();
  });

  it("생성 성공 시 서버가 반환한 portfolioId를 스토어에 저장한다", async () => {
    mockPortfolioApi.createSimulated.mockResolvedValue({ portfolioId: 42, asOfDate: "2026-08-07" });
    const { result } = renderHookWithQuery(() => useCreateSimulatedPortfolio());

    result.current.mutate({
      name: "가상 포트폴리오",
      description: "",
      totalAmount: 10_000_000,
      items: [{ symbol: "005930", targetWeight: 100 }],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPortfolioApi.createSimulated).toHaveBeenCalledWith({
      name: "가상 포트폴리오",
      description: "",
      totalAmount: 10_000_000,
      items: [{ symbol: "005930", targetWeight: 100 }],
    });
    const { useAuthStore } = await import("@/store/auth");
    expect(useAuthStore.getState().portfolioId).toBe("42");
  });

  it.each([
    ["P006", "환율 지원 전에는 원화 종목만 포트폴리오에 담을 수 있습니다."],
    ["S002", "가격 정보를 확인할 수 없는 종목이 있어 가상 포트폴리오를 만들 수 없습니다."],
  ])("%s 오류를 원시 서버 메시지 없이 안전한 안내로 표시한다", async (code, message) => {
    mockPortfolioApi.createSimulated.mockRejectedValue({
      isAxiosError: true,
      response: { data: { code } },
    });
    const { result } = renderHookWithQuery(() => useCreateSimulatedPortfolio());

    result.current.mutate({
      name: "가상 포트폴리오",
      description: "",
      totalAmount: 10_000_000,
      items: [{ symbol: "005930", targetWeight: 100 }],
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).toHaveBeenCalledWith(message);
  });
});

describe("useUpdatePortfolio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState({ portfolioId: "1" });
  });

  afterEach(() => {
    clearAuthState();
  });

  it("updatePortfolio 성공 시 portfolio 쿼리 무효화", async () => {
    mockPortfolioApi.updatePortfolio.mockResolvedValue(undefined);
    // 쿼리 무효화 후 재조회를 위해 getValuation 등 mock
    mockPortfolioApi.getValuation.mockResolvedValue(makeValuation({ totalReturnRate: 20 }));
    mockPortfolioApi.getDiversification.mockResolvedValue(makeDiversification());
    mockPortfolioApi.getAdvice.mockResolvedValue(null);
    mockPortfolioApi.getHoldings.mockResolvedValue(makePortfolio());
    mockPortfolioApi.getCorrelation.mockResolvedValue({});
    mockPortfolioApi.getRebalancing.mockResolvedValue(makeRebalancing());

    const { result } = renderHookWithQuery(() => ({
      portfolio: usePortfolio(),
      update: useUpdatePortfolio(),
    }));

    act(() => {
      result.current.update.mutate({
        name: "수정된 포트폴리오",
        description: "수정됨",
        items: [
          { symbol: "005930", quantity: 10, purchasePrice: 70000, currency: "KRW", assetType: "STOCK", targetWeight: 100 },
        ],
      });
    });

    await waitFor(() => expect(result.current.update.isSuccess).toBe(true));
    expect(mockPortfolioApi.updatePortfolio).toHaveBeenCalledWith("1", expect.objectContaining({
      name: "수정된 포트폴리오",
    }));
  });

  it("portfolioId 없으면 mutate 호출 시 오류", async () => {
    clearAuthState(); // portfolioId 제거
    mockPortfolioApi.updatePortfolio.mockRejectedValue(new Error("portfolioId 없음"));

    const { result } = renderHookWithQuery(() => useUpdatePortfolio());

    act(() => {
      result.current.mutate({ name: "테스트", description: "", items: [] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
