import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortfolioWizard } from "../PortfolioWizard";
import { renderWithQuery } from "@/test/test-utils";
import { useSearch } from "@/hooks/use-search";

vi.mock("@/hooks/use-search", () => ({
  useSearch: vi.fn(),
}));

const mutateAsync = vi.fn();
let simulatedIsPending = false;
const mockUseSearch = useSearch as unknown as ReturnType<typeof vi.fn>;

vi.mock("react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/use-portfolio", () => ({
  useCreateSimulatedPortfolio: () => ({ mutateAsync, isPending: simulatedIsPending }),
  usePortfolioAdvice: () => ({ data: undefined }),
}));

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

describe("PortfolioWizard", () => {
  beforeEach(() => {
    mutateAsync.mockReset();
    simulatedIsPending = false;
    mockUseSearch.mockReturnValue({
      keyword: "삼성",
      setKeyword: vi.fn(),
      autocomplete: {
        data: {
          pages: [
            {
              content: [{
                ticker: "005930",
                name: "삼성전자",
                sectorName: "전기전자",
                marketType: "KOSPI",
                status: "ACTIVE",
              }],
            },
          ],
        },
        isLoading: false,
      },
    });
  });

  it("가상 포트폴리오 생성 시 총 투자금과 목표 비중만 제출한다", async () => {
    mutateAsync.mockResolvedValue({ portfolioId: 42, asOfDate: "2026-08-07" });
    const user = userEvent.setup();

    renderWithQuery(<PortfolioWizard onClose={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("예) 은퇴 준비 포트폴리오"), "장기 투자");
    await user.click(screen.getByRole("button", { name: "다음 →" }));
    await screen.findByText("종목 검색");
    await user.click(screen.getByRole("button", { name: /삼성전자.*005930.*KOSPI/ }));
    await user.click(screen.getByRole("button", { name: "다음 →" }));
    await screen.findByText("목표 비중 합계");

    fireEvent.keyDown(screen.getByRole("slider", { name: "삼성전자 목표 비중" }), { key: "End" });

    await user.click(screen.getByRole("button", { name: "가상 포트폴리오 생성" }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        name: "장기 투자",
        description: "",
        totalAmount: 10_000_000,
        items: [{ symbol: "005930", targetWeight: 100 }],
      });
    });
    expect(await screen.findByText("포트폴리오가 생성되었습니다!")).toBeInTheDocument();
    expect(await screen.findByText("2026.08.07 종가 기준")).toBeInTheDocument();
  });

  it("실제 계좌 탭 없이 가상 포트폴리오 생성 흐름을 안내한다", () => {
    renderWithQuery(<PortfolioWizard onClose={vi.fn()} />);

    expect(screen.getByText("가상 포트폴리오 만들기")).toBeInTheDocument();
    expect(screen.queryByText("실제 계좌")).not.toBeInTheDocument();
  });

  it("생성 요청이 진행 중이면 다시 제출할 수 없다", async () => {
    const user = userEvent.setup();

    renderWithQuery(<PortfolioWizard onClose={vi.fn()} />);
    await user.type(screen.getByPlaceholderText("예) 은퇴 준비 포트폴리오"), "장기 투자");
    await user.click(screen.getByRole("button", { name: "다음 →" }));
    await screen.findByText("종목 검색");
    await user.click(screen.getByRole("button", { name: /삼성전자.*005930.*KOSPI/ }));
    await user.click(screen.getByRole("button", { name: "다음 →" }));
    await screen.findByText("목표 비중 합계");
    fireEvent.keyDown(screen.getByRole("slider", { name: "삼성전자 목표 비중" }), { key: "End" });

    simulatedIsPending = true;
    await user.click(screen.getByRole("button", { name: "이전" }));
    await user.click(screen.getByRole("button", { name: "다음 →" }));

    expect(screen.getByRole("button", { name: "가상 포트폴리오 생성 중..." })).toBeDisabled();
  });
});
