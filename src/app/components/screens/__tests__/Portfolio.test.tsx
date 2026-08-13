import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { renderWithQuery, clearAuthState, setAuthState } from "@/test/test-utils";
import { makeDiversification, makeRebalancing, makeValuation, makePortfolio } from "@/test/fixtures";
import { Portfolio } from "../Portfolio";
import type { PortfolioResponse, PortfolioValuationResponse } from "@/types/api";

const summaryRefetch = vi.fn();
const detailRefetch = vi.fn();
const healthRefetch = vi.fn();

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
vi.mock("@/app/components/portfolio/wizard/PortfolioWizard", () => ({
  PortfolioWizard: () => null,
}));

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
});
