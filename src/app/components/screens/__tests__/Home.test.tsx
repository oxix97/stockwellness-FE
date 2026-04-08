import { screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Home } from "../Home";
import { usePortfolioSummary, usePortfolioValuation } from "@/hooks/use-portfolio";
import { useStock } from "@/hooks/use-stock";
import { useMarketIndex } from "@/hooks/use-market-index";
import { MemoryRouter } from "react-router";
import { renderWithQuery } from "@/test/test-utils";

// 훅 모킹
vi.mock("@/hooks/use-portfolio");
vi.mock("@/hooks/use-stock");
vi.mock("@/hooks/use-market-index");

describe("Home Screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock return values
    (usePortfolioSummary as any).mockReturnValue({ valuation: null, isLoading: true });
    (usePortfolioValuation as any).mockReturnValue({ data: null, isLoading: true });
    (useStock as any).mockReturnValue({ popular: { data: [], isLoading: true }, newListings: { data: [], isLoading: true } });
    (useMarketIndex as any).mockReturnValue({ data: [{ ticker: "0001", name: "코스피 종합", fluctuationRate: 0.8, history: [] }] });
  });

  it("로딩 중일 때 스켈레톤을 표시한다", () => {
    renderWithQuery(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(1);
  });
});
