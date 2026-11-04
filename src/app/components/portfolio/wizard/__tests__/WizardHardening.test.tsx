import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Phase2Assets } from "../Phase2Assets";
import { Phase3Allocation } from "../Phase3Allocation";
import { canProceed, PortfolioWizard } from "../PortfolioWizard";
import { renderWithQuery } from "@/test/test-utils";
import { useSearch } from "@/hooks/use-search";

vi.mock("@/hooks/use-search", () => ({
  useSearch: vi.fn(),
}));

const mockUseSearch = useSearch as unknown as ReturnType<typeof vi.fn>;
const mutateAsync = vi.fn();
let simulatedIsPending = false;

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/use-portfolio", () => ({
  useCreateSimulatedPortfolio: () => ({ mutateAsync, isPending: simulatedIsPending }),
  usePortfolioAdvice: () => ({ data: undefined }),
}));

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

const baseState = {
  step: 2 as const,
  direction: 1 as const,
  portfolioName: "장기 투자",
  goals: [],
  assets: [],
  totalAmount: 10_000_000,
  createdPortfolioId: null,
  createdAsOfDate: null,
};

const koreanStock = {
  ticker: "005930",
  name: "삼성전자",
  sectorName: "전기전자",
  marketType: "KOSPI",
  status: "ACTIVE",
};

const foreignStock = {
  ticker: "AAPL",
  name: "Apple",
  sectorName: "정보기술",
  marketType: "NASDAQ",
  status: "ACTIVE",
};

function setSearchResult(stock: typeof koreanStock | typeof foreignStock, keyword = stock.name) {
  mockUseSearch.mockReturnValue({
    keyword,
    setKeyword: vi.fn(),
    autocomplete: { data: { pages: [{ content: [stock] }] }, isLoading: false },
  });
}

describe("simulated wizard hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    simulatedIsPending = false;
    setSearchResult(koreanStock);
  });

  it("does not expose unsupported foreign quick-add assets", () => {
    const dispatch = vi.fn();

    renderWithQuery(<Phase2Assets state={baseState} dispatch={dispatch} />);

    expect(screen.queryByRole("button", { name: "미국 장기채" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "금" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "현금" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "S&P500 ETF" })).not.toBeInTheDocument();
  });

  it("keeps foreign search results visible but prevents adding them with a safe message", () => {
    setSearchResult(foreignStock, "AAPL");
    const dispatch = vi.fn();

    renderWithQuery(<Phase2Assets state={baseState} dispatch={dispatch} />);

    const result = screen.getByRole("button", { name: /Apple.*AAPL.*NASDAQ/ });
    expect(result).toBeDisabled();
    expect(screen.getByText("환율 지원 전에는 포트폴리오에 담을 수 없습니다")).toBeInTheDocument();

    fireEvent.click(result);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("blocks simulated submission when total amount is zero", async () => {
    setSearchResult(koreanStock);
    mutateAsync.mockResolvedValue({ portfolioId: 42, asOfDate: "2026-08-07" });
    const user = userEvent.setup();

    renderWithQuery(<PortfolioWizard onClose={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("예) 은퇴 준비 포트폴리오"), "장기 투자");
    await user.click(screen.getByRole("button", { name: "다음 →" }));
    await screen.findByText("종목 검색");
    await user.click(screen.getByRole("button", { name: /삼성전자.*005930.*KOSPI/ }));
    await user.click(screen.getByRole("button", { name: "다음 →" }));
    await screen.findByText("목표 비중 합계");

    const amount = screen.getByLabelText("총 투자 금액");
    fireEvent.change(amount, { target: { value: "0" } });
    fireEvent.keyDown(screen.getByRole("slider", { name: "삼성전자 목표 비중" }), { key: "End" });

    const submit = screen.getByRole("button", { name: "가상 포트폴리오 생성" });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it.each([0, -1])("fails closed for non-positive total amount (%s)", (totalAmount) => {
    expect(
      canProceed({
        ...baseState,
        step: 3,
        totalAmount,
        assets: [{ ...koreanStock, targetWeight: 100 }],
      }),
    ).toBe(false);
  });

  it("gives every allocation slider an accessible name and keyboard value updates", async () => {
    const dispatch = vi.fn();

    renderWithQuery(
      <Phase3Allocation
        state={{
          ...baseState,
          step: 3,
          assets: [
            { ticker: "005930", name: "삼성전자", marketType: "KOSPI", targetWeight: 50 },
            { ticker: "000660", name: "SK하이닉스", marketType: "KOSPI", targetWeight: 50 },
          ],
        }}
        dispatch={dispatch}
      />,
    );

    const samsungSlider = screen.getByRole("slider", { name: "삼성전자 목표 비중" });
    const skSlider = screen.getByRole("slider", { name: "SK하이닉스 목표 비중" });
    expect(samsungSlider).toHaveAttribute("aria-valuenow", "50");
    expect(skSlider).toHaveAttribute("aria-valuenow", "50");

    samsungSlider.focus();
    fireEvent.keyDown(samsungSlider, { key: "ArrowRight" });
    expect(dispatch).toHaveBeenCalledWith({
      type: "SET_WEIGHT",
      payload: { ticker: "005930", weight: 51 },
    });
  });
});
