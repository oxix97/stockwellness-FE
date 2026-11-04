import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithQuery, setAuthState, clearAuthState } from "@/test/test-utils";
import { BacktestSetup } from "../BacktestSetup";
import { MemoryRouter } from "react-router";

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolio: vi.fn(),
}));

import { usePortfolio } from "@/hooks/use-portfolio";

const mockUsePortfolio = usePortfolio as ReturnType<typeof vi.fn>;

describe("BacktestSetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState({ portfolioId: "1" });
    mockUsePortfolio.mockReturnValue({
      holdings: {
        items: [{ symbol: "005930", name: "삼성전자", targetWeight: 100 }],
      },
      isLoading: false,
    });
  });

  afterEach(() => {
    clearAuthState();
  });

  it("기본 설정으로 시작하면 typed route state에 1Y와 KOSPI를 전달한다", () => {
    renderWithQuery(
      <MemoryRouter>
        <BacktestSetup />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /^KOSPI/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "시뮬레이션 시작하기" }));

    expect(mockNavigate).toHaveBeenCalledWith("/backtest/result", {
      state: expect.objectContaining({
        strategy: "LUMP_SUM",
        amount: 10_000_000,
        primaryBenchmark: "KOSPI",
        period: "1Y",
        rebalancingPeriod: "NONE",
        dividendReinvested: true,
        weights: { "005930": 100 },
      }),
    });
  });

  it("KOSDAQ와 S&P500을 선택할 수 있다", () => {
    renderWithQuery(
      <MemoryRouter>
        <BacktestSetup />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /^KOSDAQ/ }));
    expect(screen.getByRole("button", { name: /^KOSDAQ/ })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /^S&P500/ }));
    expect(screen.getByRole("button", { name: /^S&P500/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("0원 또는 음수 금액은 제출할 수 없다", () => {
    renderWithQuery(
      <MemoryRouter>
        <BacktestSetup />
      </MemoryRouter>,
    );
    const amountInput = screen.getByLabelText("초기 투자금액");
    const startButton = screen.getByRole("button", { name: "시뮬레이션 시작하기" });

    fireEvent.change(amountInput, { target: { value: "0" } });
    expect(startButton).toBeDisabled();
    expect(screen.getByText("투자 금액은 1원 이상 입력해주세요.")).toBeInTheDocument();

    fireEvent.change(amountInput, { target: { value: "-1" } });
    expect(startButton).toBeDisabled();
  });
});
