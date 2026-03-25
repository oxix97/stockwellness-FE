import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Home } from "../Home";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useStock } from "@/hooks/use-stock";
import { useSector } from "@/hooks/use-sector";
import { useMarketIndex } from "@/hooks/use-market-index";
import { MemoryRouter } from "react-router";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 훅 모킹
vi.mock("@/hooks/use-portfolio");
vi.mock("@/hooks/use-stock");
vi.mock("@/hooks/use-sector");
vi.mock("@/hooks/use-market-index");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("Home Screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("로딩 중일 때 스켈레톤을 표시한다", () => {
    (usePortfolio as any).mockReturnValue({ valuation: null, isLoading: true });
    (useStock as any).mockReturnValue({ popular: { data: [], isLoading: true } });
    (useSector as any).mockReturnValue({ data: [], isLoading: true });
    (useMarketIndex as any).mockReturnValue({ data: [], isLoading: true });

    renderWithProviders(<Home />);

    // 섹터 카드 스켈레톤 3개가 렌더링되는지 확인 (div 구조 기반)
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it("섹터 데이터를 성공적으로 렌더링한다", () => {
    const mockSectors = [
      { sectorCode: "001", sectorName: "바이오", fluctuationRate: 5.5, isOverheated: false, diagnosisMessage: "진단 메시지 1" },
      { sectorCode: "002", sectorName: "반도체", fluctuationRate: -1.2, isOverheated: true, diagnosisMessage: "진단 메시지 2" },
    ];

    (usePortfolio as any).mockReturnValue({ valuation: { currentTotalValue: 1000000 }, isLoading: false });
    (useStock as any).mockReturnValue({ popular: { data: ["삼성전자"], isLoading: false } });
    (useSector as any).mockReturnValue({ data: mockSectors, isLoading: false });
    (useMarketIndex as any).mockReturnValue({ data: [], isLoading: false });

    renderWithProviders(<Home />);

    expect(screen.getByText("바이오")).toBeInTheDocument();
    expect(screen.getByText("반도체")).toBeInTheDocument();
    // 데이터 형식 소수점 2자리로 렌더링됨
    expect(screen.getByText("+5.50%")).toBeInTheDocument();
    expect(screen.getByText("-1.20%")).toBeInTheDocument();
    expect(screen.getByText("⚠️ 과열")).toBeInTheDocument();
  });
});
