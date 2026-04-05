import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Home } from "../Home";
import { usePortfolioSummary, usePortfolioValuation } from "@/hooks/use-portfolio";
import { useStock } from "@/hooks/use-stock";
import { useSector } from "@/hooks/use-sector";
import { useMarketIndex } from "@/hooks/use-market-index";
import { MemoryRouter } from "react-router";
import { renderWithQuery } from "@/test/test-utils";

// 훅 모킹
vi.mock("@/hooks/use-portfolio");
vi.mock("@/hooks/use-stock");
vi.mock("@/hooks/use-sector");
vi.mock("@/hooks/use-market-index");

describe("Home Screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock return values
    (usePortfolioSummary as any).mockReturnValue({ valuation: null, isLoading: true });
    (usePortfolioValuation as any).mockReturnValue({ data: null, isLoading: true });
    (useStock as any).mockReturnValue({ popular: { data: [], isLoading: true }, newListings: { data: [], isLoading: true } });
    (useSector as any).mockReturnValue({ data: [], isLoading: true });
    (useMarketIndex as any).mockReturnValue({ data: [{ name: "KOSPI", fluctuationRate: 0.8, history: [] }] });
  });

  it("로딩 중일 때 스켈레톤을 표시한다", () => {
    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("섹터 데이터를 성공적으로 렌더링한다", () => {
    const mockSectors = [
      { sectorCode: "001", sectorName: "바이오", fluctuationRate: 5.5, isOverheated: false, diagnosisMessage: "진단 메시지 1" },
      { sectorCode: "002", sectorName: "반도체", fluctuationRate: -1.2, isOverheated: true, diagnosisMessage: "진단 메시지 2" },
    ];

    (usePortfolioSummary as any).mockReturnValue({ valuation: { currentTotalValue: 1000000 }, isLoading: false });
    (usePortfolioValuation as any).mockReturnValue({ data: { currentTotalValue: 1000000 }, isLoading: false });
    (useSector as any).mockReturnValue({ data: mockSectors, isLoading: false });

    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("바이오")).toBeInTheDocument();
    expect(screen.getByText("반도체")).toBeInTheDocument();
    // 5.50% 등으로 표시됨
    expect(screen.getByText(/5\.5/)).toBeInTheDocument();
    expect(screen.getByText(/1\.2/)).toBeInTheDocument();
    expect(screen.getByText("⚠️ 과열")).toBeInTheDocument();
  });
});
