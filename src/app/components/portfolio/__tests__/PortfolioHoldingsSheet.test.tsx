import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithQuery } from "@/test/test-utils";
import { makePortfolio } from "@/test/fixtures";
import { PortfolioHoldingsSheet } from "../PortfolioHoldingsSheet";

vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolioDetails: vi.fn(),
}));

import { usePortfolioDetails } from "@/hooks/use-portfolio";

const mockUsePortfolioDetails = vi.mocked(usePortfolioDetails);

describe("PortfolioHoldingsSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("가격 누락 종목은 ₩0이나 0.00% 대신 —와 누락 상태를 표시하고 실제 0원은 그대로 표시한다", () => {
    const baseItem = makePortfolio().items[0];
    mockUsePortfolioDetails.mockReturnValue({
      isLoading: false,
      data: makePortfolio({
        items: [
          {
            ...baseItem,
            symbol: "964002",
            name: "결손 종목",
            quantity: 1,
            purchasePrice: 100,
            currentPrice: null,
            currentValue: null,
            returnRate: null,
            priceStatus: "MISSING",
            priceAsOfDate: null,
          },
          {
            ...baseItem,
            symbol: "964003",
            name: "영원 종목",
            quantity: 1,
            purchasePrice: 100,
            currentPrice: 0,
            currentValue: 0,
            returnRate: -100,
            priceStatus: "AVAILABLE",
            priceAsOfDate: "2026-11-17",
          },
        ],
      }),
    } as unknown as ReturnType<typeof usePortfolioDetails>);

    renderWithQuery(<PortfolioHoldingsSheet isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("결손 종목")).toBeInTheDocument();
    expect(screen.getByText("영원 종목")).toBeInTheDocument();
    expect(screen.getByText("₩0")).toBeInTheDocument();
    expect(screen.getByText("▼ 100.00%")).toBeInTheDocument();
    expect(screen.getByText(/가격 정보를 확인할 수 없습니다/)).toBeInTheDocument();
    expect(screen.getByText("2026.11.17 종가")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText("0.00%")).not.toBeInTheDocument();
  });
});
