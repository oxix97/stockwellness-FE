import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithQuery } from "@/test/test-utils";
import { StockSupplyRankingSection } from "../StockSupplyRankingSection";
import { useStockSupplyRanking } from "@/hooks/use-stock";

vi.mock("@/hooks/use-stock", () => ({
  useStockSupplyRanking: vi.fn(),
}));

describe("StockSupplyRankingSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fallback 안내와 기관/외국인 리스트를 함께 표시한다", () => {
    (useStockSupplyRanking as any).mockReturnValue({
      data: {
        requestedDate: "2026-04-08",
        effectiveDate: "2026-04-07",
        institutionItems: [
          {
            ticker: "005930",
            stockName: "삼성전자",
            sectorName: "반도체",
            currentPrice: 71000,
            fluctuationRate: 1.43,
            netBuyingQuantity: 156870,
            netBuyingAmount: 1568700000000,
            transactionAmount: 120000000000,
          },
        ],
        foreignItems: [
          {
            ticker: "000660",
            stockName: "SK하이닉스",
            sectorName: "반도체",
            currentPrice: 202000,
            fluctuationRate: -0.98,
            netBuyingQuantity: -59400,
            netBuyingAmount: -594000000000,
            transactionAmount: 80000000000,
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    renderWithQuery(
      <MemoryRouter>
        <StockSupplyRankingSection />
      </MemoryRouter>
    );

    expect(screen.getByText("기준일 2026.04.07")).toBeInTheDocument();
    expect(screen.getByText("요청일 데이터가 없어 가장 가까운 기준일로 표시 중입니다.")).toBeInTheDocument();
    expect(screen.getByText("기관 순매수량 상위 TOP 10")).toBeInTheDocument();
    expect(screen.getByText("외국인 순매수량 상위 TOP 10")).toBeInTheDocument();
    expect(screen.getByText("삼성전자")).toBeInTheDocument();
    expect(screen.getByText("SK하이닉스")).toBeInTheDocument();
    expect(screen.getByText("+ 156,870주")).toBeInTheDocument();
    expect(screen.getByText("- 59,400주")).toBeInTheDocument();
    expect(screen.getByText("71,000원")).toBeInTheDocument();
    expect(screen.getByText("+1.43%")).toBeInTheDocument();
    expect(screen.getByText("202,000원")).toBeInTheDocument();
    expect(screen.getByText("-0.98%")).toBeInTheDocument();
    expect(screen.getAllByText("순매수량").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TOP 1").length).toBeGreaterThan(0);
    expect(screen.queryByText("₩1조 5,687억")).not.toBeInTheDocument();
    expect(screen.queryByText("005930")).not.toBeInTheDocument();
    expect(screen.queryByText("📟")).not.toBeInTheDocument();
    expect(screen.getByText("삼성전자").closest("button")).toHaveClass("border-red-100/80");
  });

  it("effectiveDate가 없으면 전체 empty state를 표시한다", () => {
    (useStockSupplyRanking as any).mockReturnValue({
      data: {
        requestedDate: null,
        effectiveDate: null,
        institutionItems: [],
        foreignItems: [],
      },
      isLoading: false,
      isError: false,
    });

    renderWithQuery(
      <MemoryRouter>
        <StockSupplyRankingSection />
      </MemoryRouter>
    );

    expect(screen.getByText("수급 데이터가 없습니다.")).toBeInTheDocument();
  });

  it("한 채널만 비어도 다른 채널은 유지한다", () => {
    (useStockSupplyRanking as any).mockReturnValue({
      data: {
        requestedDate: null,
        effectiveDate: "2026-04-07",
        institutionItems: [],
        foreignItems: [
          {
            ticker: "035420",
            stockName: "NAVER",
            sectorName: "소프트웨어",
            currentPrice: 215000,
            fluctuationRate: 0.45,
            netBuyingQuantity: 1200,
            netBuyingAmount: 1200000000,
            transactionAmount: 30000000000,
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    renderWithQuery(
      <MemoryRouter>
        <StockSupplyRankingSection />
      </MemoryRouter>
    );

    expect(screen.getByText("기관 순매수량 데이터 없음")).toBeInTheDocument();
    expect(screen.getByText("NAVER")).toBeInTheDocument();
  });

  it("SELL 방향이면 순매도 제목으로 표시한다", () => {
    (useStockSupplyRanking as any).mockReturnValue({
      data: {
        requestedDate: null,
        effectiveDate: "2026-04-07",
        institutionItems: [
          {
            ticker: "005930",
            stockName: "삼성전자",
            sectorName: "반도체",
            currentPrice: 71000,
            fluctuationRate: -1.12,
            netBuyingQuantity: -45000,
            netBuyingAmount: -450000000000,
            transactionAmount: 120000000000,
          },
        ],
        foreignItems: [],
      },
      isLoading: false,
      isError: false,
    });

    renderWithQuery(
      <MemoryRouter>
        <StockSupplyRankingSection direction="SELL" />
      </MemoryRouter>
    );

    expect(screen.getByText("기관·외국인 순매도량 상위")).toBeInTheDocument();
    expect(screen.getByText("기관 순매도량 상위 TOP 10")).toBeInTheDocument();
    expect(screen.getByText("외국인 순매도량 상위 TOP 10")).toBeInTheDocument();
    expect(screen.getByText("외국인 순매도량 데이터 없음")).toBeInTheDocument();
    expect(screen.getByText("순매도량")).toBeInTheDocument();
    expect(screen.getByText("삼성전자").closest("button")).toHaveClass("border-sky-100/90");
  });

  it("순매수량이 없으면 NaN 대신 대시로 표시한다", () => {
    (useStockSupplyRanking as any).mockReturnValue({
      data: {
        requestedDate: null,
        effectiveDate: "2026-04-07",
        institutionItems: [
          {
            ticker: "005930",
            stockName: "삼성전자",
            sectorName: "반도체",
            currentPrice: 71000,
            fluctuationRate: 1.43,
            netBuyingQuantity: Number.NaN,
            netBuyingAmount: 1568700000000,
            transactionAmount: 120000000000,
          },
        ],
        foreignItems: [],
      },
      isLoading: false,
      isError: false,
    });

    renderWithQuery(
      <MemoryRouter>
        <StockSupplyRankingSection />
      </MemoryRouter>
    );

    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.queryByText("NaN주")).not.toBeInTheDocument();
  });
});
