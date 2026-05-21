import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Home } from "../Home";
import { useMarketIndex } from "@/hooks/use-market-index";
import { MemoryRouter } from "react-router";
import { renderWithQuery } from "@/test/test-utils";

// 훅 모킹
vi.mock("@/hooks/use-market-index");
vi.mock("@/app/components/home/StockSupplyRankingSection", () => ({
  StockSupplyRankingSection: () => <div>종목 수급 랭킹 섹션</div>,
}));
vi.mock("@/app/components/home/SectorRankingSection", () => ({
  SectorRankingSection: () => <div>섹터 랭킹 섹션</div>,
}));
vi.mock("@/app/components/home/NewListingsSection", () => ({
  NewListingsSection: () => <div>신규 상장 섹션</div>,
}));
vi.mock("@/app/components/home/MarketIndexCard", () => ({
  MarketIndexSection: () => <div>시장 현황 섹션</div>,
}));
vi.mock("@/app/components/home/SectorBottomSheet", () => ({
  SectorBottomSheet: () => null,
}));

describe("Home Screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMarketIndex as any).mockReturnValue({
      data: {
        indexes: [{ ticker: "0001", name: "코스피 종합", fluctuationRate: 0.8, fluctuationAmount: 10, currentPrice: 2600 }],
        weather: {
          weatherLevel: "SUNNY",
          weatherMessage: "오늘의 증시는 맑음이에요",
          weatherDescription: "주요 지수가 고르게 오르며 투자심리가 비교적 안정적인 편이에요",
          reasonCode: "STEADY_ADVANCE",
          asOfDate: "2026-04-08",
        },
      },
      isLoading: false,
      isError: false,
    });
  });

  it("홈 탭에 시장 현황, 수급, 섹터, 신규 상장 섹션을 표시한다", () => {
    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("시장 현황 섹션")).toBeInTheDocument();
    expect(screen.getAllByText("종목 수급 랭킹 섹션")).toHaveLength(2);
    expect(screen.getByText("섹터 랭킹 섹션")).toBeInTheDocument();
    expect(screen.getByText("신규 상장 섹션")).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("오늘의 증시는 맑음이에요"))).toBeInTheDocument();
    expect(screen.getByText("주요 지수가 고르게 오르며 투자심리가 비교적 안정적인 편이에요")).toBeInTheDocument();
  });
});
