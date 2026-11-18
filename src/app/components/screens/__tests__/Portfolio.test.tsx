import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { renderWithQuery, clearAuthState, setAuthState } from "@/test/test-utils";
import { makeDiversification, makeRebalancing, makeRebalancingItem, makeValuation, makePortfolio } from "@/test/fixtures";
import { Portfolio } from "../Portfolio";
import type { PortfolioResponse, PortfolioValuationResponse } from "@/types/api";

const summaryRefetch = vi.fn();
const detailRefetch = vi.fn();
const healthRefetch = vi.fn();
const wizardCreate = vi.hoisted(() => vi.fn());

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolioSummary: vi.fn(),
  usePortfolioDetails: vi.fn(),
  usePortfolioHealth: vi.fn(),
  usePortfolioAdvice: vi.fn(),
}));

vi.mock("@/hooks/use-backtest", () => ({
  usePortfolioSimulation: vi.fn(() => ({ data: undefined, isLoading: false, isError: false })),
}));

vi.mock("@/app/components/portfolio/PortfolioBottomSheet", () => ({
  PortfolioBottomSheet: () => null,
}));
vi.mock("@/app/components/portfolio/PortfolioEditSheet", () => ({
  PortfolioEditSheet: () => null,
}));
vi.mock("@/app/components/portfolio/PortfolioHoldingsSheet", () => ({
  PortfolioHoldingsSheet: () => null,
}));
vi.mock("@/app/components/portfolio/wizard/PortfolioWizard", async () => {
  const React = await vi.importActual<typeof import("react")>("react");
  return {
    PortfolioWizard: () => {
      const [step, setStep] = React.useState(3);
      return (
        <div>
          <p>Phase {step}</p>
          <button onClick={() => { setStep(4); wizardCreate(); }}>Create successfully</button>
        </div>
      );
    },
  };
});

import {
  usePortfolioAdvice,
  usePortfolioDetails,
  usePortfolioHealth,
  usePortfolioSummary,
} from "@/hooks/use-portfolio";

const mockUsePortfolioSummary = vi.mocked(usePortfolioSummary);
const mockUsePortfolioDetails = vi.mocked(usePortfolioDetails);
const mockUsePortfolioHealth = vi.mocked(usePortfolioHealth);
const mockUsePortfolioAdvice = vi.mocked(usePortfolioAdvice);

function renderPortfolio() {
  return renderWithQuery(
    <MemoryRouter>
      <Portfolio />
    </MemoryRouter>,
  );
}

function defaultSummary(valuation: PortfolioValuationResponse = makeValuation()) {
  return {
    valuation,
    diversification: makeDiversification(),
    rebalancing: makeRebalancing({ items: [] }),
    itemContributions: {},
    isLoading: false,
    isError: false,
    error: null,
    refetch: summaryRefetch,
  };
}

function defaultDetails(portfolio: PortfolioResponse = makePortfolio()) {
  return {
    data: portfolio,
    isLoading: false,
    isError: false,
    error: null,
    refetch: detailRefetch,
  };
}

function defaultHealth() {
  return {
    data: { overallScore: 80, categories: {}, nextSteps: [] },
    isLoading: false,
    isError: false,
    error: null,
    refetch: healthRefetch,
  };
}

function installDefaultMocks(valuation?: PortfolioValuationResponse, portfolio?: PortfolioResponse) {
  mockUsePortfolioSummary.mockReturnValue(defaultSummary(valuation));
  mockUsePortfolioDetails.mockReturnValue(defaultDetails(portfolio) as unknown as ReturnType<typeof usePortfolioDetails>);
  mockUsePortfolioHealth.mockReturnValue(defaultHealth() as unknown as ReturnType<typeof usePortfolioHealth>);
  mockUsePortfolioAdvice.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof usePortfolioAdvice>);
}

describe("Portfolio valuation states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState({ portfolioId: "1" });
    installDefaultMocks();
  });

  afterEach(() => {
    clearAuthState();
  });

  it("loading state is announced to assistive technology", () => {
    mockUsePortfolioSummary.mockReturnValue({ ...defaultSummary(), isLoading: true });
    mockUsePortfolioDetails.mockReturnValue({ ...defaultDetails(), isLoading: true } as unknown as ReturnType<typeof usePortfolioDetails>);
    mockUsePortfolioHealth.mockReturnValue({ ...defaultHealth(), isLoading: true } as unknown as ReturnType<typeof usePortfolioHealth>);

    renderPortfolio();

    expect(screen.getByRole("status", { name: "포트폴리오 불러오는 중" })).toBeInTheDocument();
  });

  it("API 오류는 재시도 CTA를 제공하고 0원·위험 기본값을 표시하지 않는다", () => {
    mockUsePortfolioSummary.mockReturnValue({ ...defaultSummary(), valuation: undefined, isError: true });
    mockUsePortfolioDetails.mockReturnValue({ ...defaultDetails(), data: undefined, isError: true } as unknown as ReturnType<typeof usePortfolioDetails>);
    mockUsePortfolioHealth.mockReturnValue({ ...defaultHealth(), data: undefined, isError: true } as unknown as ReturnType<typeof usePortfolioHealth>);

    renderPortfolio();

    expect(screen.getByRole("alert")).toHaveTextContent("포트폴리오 정보를 불러오지 못했습니다");
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.queryByText(/₩0/)).not.toBeInTheDocument();
    expect(screen.queryByText(/위험/)).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.00%/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(summaryRefetch).toHaveBeenCalledTimes(1);
    expect(detailRefetch).toHaveBeenCalledTimes(1);
    expect(healthRefetch).toHaveBeenCalledTimes(1);
  });

  it("PARTIAL은 누락된 종목과 집계 불가를 명시하고 EOD 기준일을 표시한다", () => {
    const valuation = makeValuation({
      valuationStatus: "PARTIAL",
      asOfDate: "2026-08-07",
      missingSymbols: ["000660"],
      currentTotalValue: null,
      totalProfitLoss: null,
      totalReturnRate: null,
    });
    const portfolio = makePortfolio({
      items: [
        makePortfolio().items[0],
        {
          ...makePortfolio().items[0],
          symbol: "000660",
          name: "SK하이닉스",
          currentPrice: null,
          currentValue: null,
          returnRate: null,
          priceStatus: "MISSING",
          priceAsOfDate: null,
        },
      ],
    });
    installDefaultMocks(valuation, portfolio);

    renderPortfolio();

    expect(screen.getAllByText(/2026\.08\.07 종가/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("평가할 수 없음").length).toBeGreaterThan(0);
    expect(screen.getByText(/000660.*가격 정보를 확인할 수 없습니다/)).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText(/일부 종목의 가격을 확인할 수 없습니다/)).toBeInTheDocument();
  });

  it("COMPLETE은 명시된 0과 음수 수익률을 그대로 표시하고 실시간 표현을 사용하지 않는다", () => {
    const valuation = makeValuation({
      valuationStatus: "COMPLETE",
      asOfDate: "2026-08-07",
      totalReturnRate: 0,
      totalProfitLoss: 0,
      dailyReturnRate: -1.25,
      dailyProfitLoss: -10_000,
    });
    const portfolio = makePortfolio({
      items: [
        {
          ...makePortfolio().items[0],
          currentPrice: 0,
          currentValue: 0,
          returnRate: -2.5,
          priceStatus: "AVAILABLE",
          priceAsOfDate: "2026-08-07",
        },
      ],
    });
    installDefaultMocks(valuation, portfolio);

    renderPortfolio();

    expect(screen.getAllByText(/2026\.08\.07 종가/).length).toBeGreaterThan(0);
    expect(screen.getByText(/직전 영업일 대비/)).toBeInTheDocument();
    expect(screen.getByText("₩0")).toBeInTheDocument();
    expect(screen.queryByText(/오늘/)).not.toBeInTheDocument();
    expect(screen.queryByText("현재가")).not.toBeInTheDocument();
  });

  it("no portfolio shows an empty-state action", () => {
    clearAuthState();

    renderPortfolio();

    expect(screen.getByText("포트폴리오 만들기")).toBeInTheDocument();
  });

  it("keeps the creation result mounted when the new portfolio becomes selected", () => {
    clearAuthState();
    wizardCreate.mockImplementation(() => setAuthState({ portfolioId: "42" }));
    renderPortfolio();

    fireEvent.click(screen.getByText("포트폴리오 만들기"));
    act(() => fireEvent.click(screen.getByRole("button", { name: "Create successfully" })));

    expect(screen.getByText("Phase 4")).toBeInTheDocument();
  });

  it("PARTIAL·UNAVAILABLE 및 rebalancing.totalValue=null이면 요약 카드와 보유 항목 안내를 계산 불가로 표시한다", () => {
    const partialValuation = makeValuation({
      valuationStatus: "PARTIAL",
      asOfDate: "2026-08-07",
      missingSymbols: ["000660"],
      currentTotalValue: null,
      totalProfitLoss: null,
      totalReturnRate: null,
    });
    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(partialValuation),
      rebalancing: makeRebalancing({
        totalValue: null,
        items: [],
      }),
    });

    const { rerender } = renderPortfolio();

    expect(screen.getAllByText("계산 불가").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("0개 종목")).not.toBeInTheDocument();
    expect(screen.queryByText("현재 목표 비중과 큰 차이가 없습니다")).not.toBeInTheDocument();
    expect(screen.queryByText("비중 유지")).not.toBeInTheDocument();

    const unavailableValuation = makeValuation({
      valuationStatus: "UNAVAILABLE",
      asOfDate: null,
      missingSymbols: ["005930"],
      currentTotalValue: null,
      totalProfitLoss: null,
      totalReturnRate: null,
    });
    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(unavailableValuation),
      rebalancing: makeRebalancing({
        totalValue: null,
        items: [],
      }),
    });

    rerender(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("계산 불가").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("현재 목표 비중과 큰 차이가 없습니다")).not.toBeInTheDocument();
    expect(screen.queryByText("비중 유지")).not.toBeInTheDocument();

    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(makeValuation({ valuationStatus: "COMPLETE" })),
      rebalancing: makeRebalancing({
        totalValue: null,
        items: [],
      }),
    });

    rerender(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("계산 불가").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("현재 목표 비중과 큰 차이가 없습니다")).not.toBeInTheDocument();
    expect(screen.queryByText("비중 유지")).not.toBeInTheDocument();
  });

  it("정상 COMPLETE 빈 결과는 기존 무권고 상태를 유지하고 실제 평가액 0원은 ₩0을 유지하되 비중 판단을 확정하지 않는다", () => {
    installDefaultMocks(makeValuation({ valuationStatus: "COMPLETE", currentTotalValue: 11_000_000 }));
    const { rerender } = renderPortfolio();

    expect(screen.getByText("0개 종목")).toBeInTheDocument();
    expect(screen.getByText("현재 목표 비중과 큰 차이가 없습니다")).toBeInTheDocument();
    expect(screen.getByText("비중 유지")).toBeInTheDocument();

    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(
        makeValuation({
          valuationStatus: "COMPLETE",
          currentTotalValue: 0,
          totalProfitLoss: 0,
          totalReturnRate: 0,
        }),
      ),
      rebalancing: makeRebalancing({ totalValue: 0, items: [] }),
    });
    mockUsePortfolioDetails.mockReturnValue(
      defaultDetails(
        makePortfolio({
          currentTotalValue: 0,
          items: [
            {
              ...makePortfolio().items[0],
              currentPrice: 0,
              currentValue: 0,
              returnRate: 0,
              priceStatus: "AVAILABLE",
            },
          ],
        }),
      ) as unknown as ReturnType<typeof usePortfolioDetails>,
    );

    rerender(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("₩0").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("비중 판단 불가")).toBeInTheDocument();
    expect(screen.getByText("비중 산출 불가")).toBeInTheDocument();
    expect(screen.getByText(/총 평가액이 0원/)).toBeInTheDocument();
    expect(screen.queryByText("현재 목표 비중과 큰 차이가 없습니다")).not.toBeInTheDocument();
    expect(screen.queryByText("비중 유지")).not.toBeInTheDocument();
  });

  it("현재가 0원 종목과 양의 가격에서 산출된 수량 0, 정상 양·음수 권고를 각각 구분해 표시한다", () => {
    const portfolio = makePortfolio({
      items: [
        { ...makePortfolio().items[0], symbol: "005930", name: "삼성전자", currentPrice: 0, currentValue: 0 },
        { ...makePortfolio().items[0], symbol: "000660", name: "SK하이닉스", currentPrice: 75_000, currentValue: 750_000 },
        { ...makePortfolio().items[0], symbol: "035420", name: "NAVER", currentPrice: 50_000, currentValue: 500_000 },
        { ...makePortfolio().items[0], symbol: "035720", name: "카카오", currentPrice: 40_000, currentValue: 400_000 },
      ],
    });
    mockUsePortfolioDetails.mockReturnValue(defaultDetails(portfolio) as unknown as ReturnType<typeof usePortfolioDetails>);

    // 1) 현재가 0원 종목만 있을 때
    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(),
      rebalancing: makeRebalancing({
        totalValue: 1_000_000,
        items: [
          makeRebalancingItem({
            symbol: "005930",
            name: "삼성전자",
            currentPrice: 0,
            recommendedQuantity: 0,
          }),
        ],
      }),
    });

    const { rerender } = renderPortfolio();

    expect(screen.getAllByText("수량 계산 불가").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/비중 축소/)).not.toBeInTheDocument();
    expect(screen.queryByText(/비중 확대/)).not.toBeInTheDocument();

    // 2) 양의 가격에서 산출된 추천 수량 0만 있을 때
    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(),
      rebalancing: makeRebalancing({
        totalValue: 1_000_000,
        items: [
          makeRebalancingItem({
            symbol: "000660",
            name: "SK하이닉스",
            currentPrice: 75_000,
            recommendedQuantity: 0,
          }),
        ],
      }),
    });

    rerender(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getByText("추가 매매 없음")).toBeInTheDocument();
    expect(screen.getByText("SK하이닉스 추가 매매 없음")).toBeInTheDocument();
    expect(screen.queryByText(/비중 축소/)).not.toBeInTheDocument();
    expect(screen.queryByText(/비중 확대/)).not.toBeInTheDocument();

    // 3) 정상 양·음수 동작 유지
    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(),
      rebalancing: makeRebalancing({
        totalValue: 1_650_000,
        items: [
          makeRebalancingItem({ symbol: "035420", name: "NAVER", currentPrice: 50_000, recommendedQuantity: 3 }),
          makeRebalancingItem({ symbol: "035720", name: "카카오", currentPrice: 40_000, recommendedQuantity: -2 }),
        ],
      }),
    });

    rerender(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getByText("NAVER 비중 확대 권장")).toBeInTheDocument();
    expect(screen.getByText("비중 확대")).toBeInTheDocument();
    expect(screen.getByText("비중 축소")).toBeInTheDocument();
  });

  it("valuation 자체가 누락되고 rebalancing.totalValue만 남아도 계산 불가를 표시한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(),
      valuation: undefined,
      rebalancing: makeRebalancing({ totalValue: 11_000_000 }),
    });

    renderPortfolio();

    expect(screen.getAllByText("계산 불가").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/비중 확대/)).not.toBeInTheDocument();
    expect(screen.queryByText("0개 종목")).not.toBeInTheDocument();
  });

  it("currentPrice가 null이거나 생략된 경우 양의 recommendedQuantity가 와도 매수를 권고하지 않고 수량 계산 불가를 표시한다", () => {
    const portfolio = makePortfolio({
      items: [
        { ...makePortfolio().items[0], symbol: "005930", name: "삼성전자", currentPrice: null, currentValue: null },
        { ...makePortfolio().items[0], symbol: "000660", name: "SK하이닉스", currentPrice: null, currentValue: null },
      ],
    });
    mockUsePortfolioDetails.mockReturnValue(defaultDetails(portfolio) as unknown as ReturnType<typeof usePortfolioDetails>);
    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(),
      rebalancing: makeRebalancing({
        totalValue: 1_000_000,
        items: [
          makeRebalancingItem({
            symbol: "005930",
            name: "삼성전자",
            currentPrice: null as unknown as number,
            recommendedQuantity: 5,
          }),
          makeRebalancingItem({
            symbol: "000660",
            name: "SK하이닉스",
            currentPrice: undefined as unknown as number,
            recommendedQuantity: 7,
          }),
        ],
      }),
    });

    renderPortfolio();

    expect(screen.getAllByText("수량 계산 불가").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/비중 확대/)).not.toBeInTheDocument();
    expect(screen.queryByText(/매수/)).not.toBeInTheDocument();
  });

  it("MDD·Sharpe의 명시적 null 및 생략은 '—'로, 실제 0과 음수는 숫자 포맷으로 구분해 표시한다", () => {
    installDefaultMocks(
      makeValuation({
        mdd: null,
        sharpeRatio: null,
      }),
    );

    const { rerender } = renderPortfolio();

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
    expect(screen.queryByText("0.00")).not.toBeInTheDocument();

    installDefaultMocks(
      makeValuation({
        mdd: undefined as unknown as number | null,
        sharpeRatio: undefined as unknown as number | null,
      }),
    );

    rerender(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);

    installDefaultMocks(
      makeValuation({
        mdd: 0,
        sharpeRatio: 0,
      }),
    );

    rerender(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getByText("0.0%")).toBeInTheDocument();
    expect(screen.getByText("0.00")).toBeInTheDocument();

    installDefaultMocks(
      makeValuation({
        mdd: -12.34,
        sharpeRatio: -0.45,
      }),
    );

    rerender(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getByText("-12.3%")).toBeInTheDocument();
    expect(screen.getByText("-0.45")).toBeInTheDocument();
  });

  it("양의 가격에서도 recommendedQuantity가 null·생략이면 수량 계산 불가를 표시하고 0원 종목+양의 현금을 구분한다", () => {
    const portfolio = makePortfolio({
      items: [
        { ...makePortfolio().items[0], symbol: "005930", name: "삼성전자", currentPrice: 75_000, currentValue: 750_000 },
        { ...makePortfolio().items[0], symbol: "000660", name: "SK하이닉스", currentPrice: 75_000, currentValue: 750_000 },
        { ...makePortfolio().items[0], symbol: "964003", name: "영원종목", currentPrice: 0, currentValue: 0 },
        { ...makePortfolio().items[0], symbol: "KRW", name: "현금", assetType: "CASH", currentPrice: 1, currentValue: 1_000_000 },
      ],
    });
    mockUsePortfolioDetails.mockReturnValue(defaultDetails(portfolio) as unknown as ReturnType<typeof usePortfolioDetails>);

    // 1) 양의 가격 + recommendedQuantity null/생략 (expectedTradeAmount canary 포함)
    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(),
      rebalancing: makeRebalancing({
        totalValue: 1_500_000,
        items: [
          makeRebalancingItem({
            symbol: "005930",
            name: "삼성전자",
            currentPrice: 75_000,
            recommendedQuantity: null,
            expectedTradeAmount: 150_000,
          }),
          makeRebalancingItem({
            symbol: "000660",
            name: "SK하이닉스",
            currentPrice: 75_000,
            recommendedQuantity: undefined as unknown as number | null,
            expectedTradeAmount: null,
          }),
        ],
      }),
    });

    const { rerender } = renderPortfolio();

    expect(screen.getAllByText("수량 계산 불가").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("삼성전자 수량 계산 불가")).toBeInTheDocument();
    expect(screen.queryByText(/비중 확대/)).not.toBeInTheDocument();
    expect(screen.queryByText(/비중 축소/)).not.toBeInTheDocument();

    // 2) 0원 종목(null) + 양의 현금(매도 권고)
    mockUsePortfolioSummary.mockReturnValue({
      ...defaultSummary(makeValuation({ valuationStatus: "COMPLETE", currentTotalValue: 1_000_000 })),
      rebalancing: makeRebalancing({
        totalValue: 1_000_000,
        items: [
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
    });

    rerender(
      <MemoryRouter>
        <Portfolio />
      </MemoryRouter>,
    );

    expect(screen.getByText("1개 종목")).toBeInTheDocument();
    expect(screen.getByText("현금 비중 축소 권장")).toBeInTheDocument();
    expect(screen.getByText("수량 계산 불가")).toBeInTheDocument();
    expect(screen.getByText("비중 축소")).toBeInTheDocument();
    expect(screen.queryByText("비중 판단 불가")).not.toBeInTheDocument();
  });

  it("summary 응답 필드가 모두 undefined여도 안전하게 계산 불가/대시로 렌더링한다", () => {
    mockUsePortfolioSummary.mockReturnValue({
      valuation: undefined,
      diversification: undefined,
      rebalancing: undefined,
      itemContributions: undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: summaryRefetch,
    });

    renderPortfolio();

    expect(screen.getAllByText("평가할 수 없음").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("계산 불가").length).toBeGreaterThanOrEqual(2);
  });
});
