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
            netBuyingAmount: 156870000000, // 1,568.7억원 (원 단위)
            transactionAmount: 1200000000000,
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
            netBuyingAmount: -59400000000, // -594억원 (원 단위)
            transactionAmount: 800000000000,
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
    
    // Header check
    expect(screen.getByRole("heading", { level: 2, name: /기관·외국인 순매수금액 상위/ })).toBeInTheDocument();
    
    // Channel titles
    expect(screen.getByRole("heading", { level: 3, name: /기관 순매수금액 상위/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /외국인 순매수금액 상위/ })).toBeInTheDocument();
    
    expect(screen.getByText("삼성전자")).toBeInTheDocument();
    expect(screen.getByText("SK하이닉스")).toBeInTheDocument();
    
    // Amount formatting check
    expect(screen.getByText(/1,568.7억원/)).toBeInTheDocument();
    expect(screen.getByText(/594억원/)).toBeInTheDocument();
    
    expect(screen.getByText("71,000원")).toBeInTheDocument();
    expect(screen.getByText(/1.43%/)).toBeInTheDocument();
    expect(screen.getByText("202,000원")).toBeInTheDocument();
    expect(screen.getByText(/0.98%/)).toBeInTheDocument();
    
    expect(screen.getAllByText("순매수금액").length).toBeGreaterThan(0);
    expect(screen.getByText("삼성전자").closest("button")).toHaveClass("border-red-100/80");
  });

  it("BE 원 단위 순매수/순매도 금액을 억원·만원·원 단위로 정확히 변환한다", () => {
    (useStockSupplyRanking as any)
      .mockReturnValueOnce({
        data: {
          requestedDate: "2026-11-17",
          effectiveDate: "2026-11-17",
          institutionItems: [
            {
              ticker: "964001",
              stockName: "격리검증 정상주",
              sectorName: "반도체",
              currentPrice: 951,
              fluctuationRate: -21.74,
              netBuyingQuantity: 1000,
              netBuyingAmount: 234567890, // 약 2.3억원
              transactionAmount: 500000000,
            },
            {
              ticker: "964002",
              stockName: "소액 매수주",
              sectorName: "반도체",
              currentPrice: 1200,
              fluctuationRate: 1.5,
              netBuyingQuantity: 100,
              netBuyingAmount: 45600000, // 4,560만원
              transactionAmount: 100000000,
            },
            {
              ticker: "964003",
              stockName: "초소액 매수주",
              sectorName: "반도체",
              currentPrice: 500,
              fluctuationRate: 0,
              netBuyingQuantity: 10,
              netBuyingAmount: 5000, // 5,000원
              transactionAmount: 100000,
            },
            {
              ticker: "964004",
              stockName: "보합 수급주",
              sectorName: "반도체",
              currentPrice: 500,
              fluctuationRate: 0,
              netBuyingQuantity: 0,
              netBuyingAmount: 0, // 0원
              transactionAmount: 100000,
            },
          ],
          foreignItems: [],
        },
        isLoading: false,
        isError: false,
      })
      .mockReturnValueOnce({
        data: {
          requestedDate: "2026-11-17",
          effectiveDate: "2026-11-17",
          institutionItems: [],
          foreignItems: [
            {
              ticker: "964001",
              stockName: "격리검증 정상주",
              sectorName: "반도체",
              currentPrice: 951,
              fluctuationRate: -21.74,
              netBuyingQuantity: -1000,
              netBuyingAmount: -123456789, // 순매도 약 1.2억원
              transactionAmount: 500000000,
            },
          ],
        },
        isLoading: false,
        isError: false,
      });

    renderWithQuery(
      <MemoryRouter>
        <StockSupplyRankingSection direction="BUY" />
        <StockSupplyRankingSection direction="SELL" />
      </MemoryRouter>
    );

    expect(screen.getByText("▲ 2.3억원")).toBeInTheDocument();
    expect(screen.getByText("▲ 4,560만원")).toBeInTheDocument();
    expect(screen.getByText("▲ 5,000원")).toBeInTheDocument();
    expect(screen.getByText("0원")).toBeInTheDocument();
    expect(screen.getByText("▼ 1.2억원")).toBeInTheDocument();
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
            netBuyingAmount: 1200000000, // 12억원
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

    expect(screen.getByText(/기관 순매수 데이터 없음/)).toBeInTheDocument();
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
            netBuyingAmount: -45000000000, // -450억원
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

    expect(screen.getByRole("heading", { level: 2, name: /기관·외국인 순매도금액 상위/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /기관 순매도금액 상위/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: /외국인 순매도금액 상위/ })).toBeInTheDocument();
    
    expect(screen.getByText(/외국인 순매도 데이터 없음/)).toBeInTheDocument();
    expect(screen.getByText("순매도금액")).toBeInTheDocument();
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
            netBuyingAmount: Number.NaN,
            transactionAmount: 1200000,
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
  });
});
