import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { renderWithQuery, setAuthState, clearAuthState } from "@/test/test-utils";
import { StockDetail } from "../StockDetail";
import { toast } from "sonner";
import { useStock } from "@/hooks/use-stock";
import { useWatchlist } from "@/hooks/use-watchlist";

// Mock hooks
vi.mock("@/hooks/use-stock", () => ({
  useStock: vi.fn(() => ({
    useHistory: vi.fn(() => ({ data: { prices: [{ close: 1000, date: "2024-01-01", open: 1000, high: 1000, low: 1000, volume: 100 }], stockName: "삼성전자" }, isLoading: false })),
    useReturns: vi.fn(() => ({ data: null, isLoading: false })),
    useDetail: vi.fn(() => ({ data: null, isLoading: false })),
  })),
}));

vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolio: vi.fn(() => ({ holdings: null, isLoading: false })),
  useUpdatePortfolio: vi.fn(() => ({ mutate: vi.fn() })),
}));

vi.mock("@/hooks/use-watchlist", () => ({
  useWatchlist: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("StockDetail Watchlist Interaction", () => {
  const mockAddItem = vi.fn();
  const mockRemoveItem = vi.fn();
  const mockCreateGroup = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthState();

    (useWatchlist as any).mockReturnValue({
      groups: { data: [{ id: 1, name: "기본" }] },
      addItem: { mutate: mockAddItem },
      removeItem: { mutate: mockRemoveItem },
      createGroup: { mutateAsync: mockCreateGroup },
      useIsTickerInWatchlist: vi.fn(() => ({ isInWatchlist: false, containedGroups: [], isLoading: false })),
    });
  });

  const renderStockDetail = (symbol = "005930") => {
    return renderWithQuery(
      <MemoryRouter initialEntries={[`/stock/${symbol}`]}>
        <Routes>
          <Route path="/stock/:symbol" element={<StockDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it("로그인하지 않은 상태에서 하트 클릭 시 로그인 페이지 안내 및 리다이렉트", async () => {
    renderStockDetail();

    const heartButton = screen.getByLabelText("관심 종목");
    fireEvent.click(heartButton);

    expect(toast.info).toHaveBeenCalledWith(expect.stringContaining("로그인 후"));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("로그인하지 않아도 종목 상세의 공개 가격 콘텐츠를 볼 수 있다", () => {
    renderStockDetail("005930");

    expect(screen.getByText("삼성전자")).toBeInTheDocument();
    expect(screen.getByText("₩1,000")).toBeInTheDocument();
    expect(screen.getByText("2024.01.01 종가")).toBeInTheDocument();
    expect(mockAddItem).not.toHaveBeenCalled();
    expect(mockRemoveItem).not.toHaveBeenCalled();
  });

  it("backend marketType이 없어도 영문 티커 가격은 달러로 표시한다", () => {
    (useStock as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      useHistory: vi.fn(() => ({
        data: {
          prices: [{ close: 1000, date: "2024-01-01", open: 1000, high: 1000, low: 1000, volume: 100 }],
          stockName: "Apple",
        },
        isLoading: false,
      })),
      useReturns: vi.fn(() => ({ data: null, isLoading: false })),
      useDetail: vi.fn(() => ({ data: null, isLoading: false })),
    }));

    renderStockDetail("AAPL");

    expect(screen.getByText("$1,000")).toBeInTheDocument();
    expect(screen.queryByText("₩1,000")).not.toBeInTheDocument();
  });

  it("history 응답의 USD 통화를 우선해 달러 기호를 표시한다", () => {
    (useStock as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      useHistory: vi.fn(() => ({
        data: {
          currency: "USD",
          prices: [{ close: 1000, date: "2024-01-01", open: 1000, high: 1000, low: 1000, volume: 100 }],
          stockName: "Apple",
        },
        isLoading: false,
      })),
      useReturns: vi.fn(() => ({ data: null, isLoading: false })),
      useDetail: vi.fn(() => ({ data: null, isLoading: false })),
    }));

    renderStockDetail("AAPL");

    expect(screen.getByText("$1,000")).toBeInTheDocument();
  });

  it("인증된 USD 종목은 환율 지원 전 포트폴리오 추가를 차단한다", () => {
    (useStock as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      useHistory: vi.fn(() => ({
        data: {
          currency: "USD",
          prices: [{ close: 1000, date: "2024-01-01", open: 1000, high: 1000, low: 1000, volume: 100 }],
          stockName: "Apple",
        },
        isLoading: false,
      })),
      useReturns: vi.fn(() => ({ data: null, isLoading: false })),
      useDetail: vi.fn(() => ({ data: null, isLoading: false })),
    }));
    setAuthState({ portfolioId: "1" });

    renderStockDetail("AAPL");
    fireEvent.click(screen.getByRole("button", { name: "내 포트폴리오에 담기" }));

    expect(toast.info).toHaveBeenCalledWith("환율 지원 전에는 원화 종목만 포트폴리오에 담을 수 있습니다.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("가격 이력이 없으면 0원 대신 누락 안내를 표시한다", () => {
    (useStock as ReturnType<typeof vi.fn>).mockImplementationOnce(() => ({
      useHistory: vi.fn(() => ({ data: { prices: [], stockName: "삼성전자" }, isLoading: false })),
      useReturns: vi.fn(() => ({ data: null, isLoading: false })),
      useDetail: vi.fn(() => ({ data: null, isLoading: false })),
    }));

    renderStockDetail("005930");

    expect(screen.getByText("가격 정보를 확인할 수 없습니다")).toBeInTheDocument();
    expect(screen.queryByText("₩0")).not.toBeInTheDocument();
  });

  it("로그인하지 않은 상태에서 포트폴리오 담기 mutation을 호출하지 않고 로그인으로 이동한다", () => {
    renderStockDetail("005930");

    fireEvent.click(screen.getByRole("button", { name: "내 포트폴리오에 담기" }));

    expect(toast.info).toHaveBeenCalledWith(expect.stringContaining("로그인 후"));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("관심 종목이 아닐 때 하트 클릭 시 추가 API 호출", async () => {
    setAuthState();
    renderStockDetail();

    const heartButton = screen.getByLabelText("관심 종목");
    fireEvent.click(heartButton);

    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: 1, body: { ticker: "005930" } }),
      expect.anything()
    );
  });

  it("관심 종목일 때 하트 클릭 시 삭제 API 호출", async () => {
    setAuthState();
    (useWatchlist as any).mockReturnValue({
      groups: { data: [{ id: 1, name: "기본" }] },
      addItem: { mutate: mockAddItem },
      removeItem: { mutate: mockRemoveItem },
      createGroup: { mutateAsync: mockCreateGroup },
      useIsTickerInWatchlist: vi.fn(() => ({ 
        isInWatchlist: true, 
        containedGroups: [{ id: 1, name: "기본" }], 
        isLoading: false 
      })),
    });

    renderStockDetail();

    const heartButton = screen.getByLabelText("관심 종목");
    fireEvent.click(heartButton);

    expect(mockRemoveItem).toHaveBeenCalledWith(
      expect.objectContaining({ groupId: 1, ticker: "005930" }),
      expect.anything()
    );
  });

  it("여러 그룹에 포함된 경우 모든 그룹에서 삭제 API 호출", async () => {
    setAuthState();
    (useWatchlist as any).mockReturnValue({
      groups: { data: [{ id: 1, name: "그룹1" }, { id: 2, name: "그룹2" }] },
      addItem: { mutate: mockAddItem },
      removeItem: { mutate: mockRemoveItem },
      createGroup: { mutateAsync: mockCreateGroup },
      useIsTickerInWatchlist: vi.fn(() => ({ 
        isInWatchlist: true, 
        containedGroups: [{ id: 1, name: "그룹1" }, { id: 2, name: "그룹2" }], 
        isLoading: false 
      })),
    });

    renderStockDetail();

    const heartButton = screen.getByLabelText("관심 종목");
    fireEvent.click(heartButton);

    expect(mockRemoveItem).toHaveBeenCalledTimes(2);
    expect(mockRemoveItem).toHaveBeenNthCalledWith(1, expect.objectContaining({ groupId: 1 }), expect.anything());
    expect(mockRemoveItem).toHaveBeenNthCalledWith(2, expect.objectContaining({ groupId: 2 }), expect.anything());
  });

  it("관심 종목 상태에 따라 하트 아이콘 색상 변경", () => {
    setAuthState();
    const { rerender } = renderStockDetail();

    let heartIcon = screen.getByLabelText("관심 종목").querySelector("svg");
    expect(heartIcon).toHaveClass("text-muted-foreground");

    (useWatchlist as any).mockReturnValue({
      groups: { data: [{ id: 1, name: "기본" }] },
      addItem: { mutate: mockAddItem },
      removeItem: { mutate: mockRemoveItem },
      createGroup: { mutateAsync: mockCreateGroup },
      useIsTickerInWatchlist: vi.fn(() => ({ 
        isInWatchlist: true, 
        containedGroups: [{ id: 1, name: "기본" }], 
        isLoading: false 
      })),
    });

    rerender(
      <MemoryRouter initialEntries={[`/stock/005930`]}>
        <Routes>
          <Route path="/stock/:symbol" element={<StockDetail />} />
        </Routes>
      </MemoryRouter>
    );

    heartIcon = screen.getByLabelText("관심 종목").querySelector("svg");
    expect(heartIcon).toHaveClass("fill-red-500");
  });
});
