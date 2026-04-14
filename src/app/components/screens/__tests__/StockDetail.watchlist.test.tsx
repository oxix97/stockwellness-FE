import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { renderWithQuery, setAuthState, clearAuthState } from "@/test/test-utils";
import { StockDetail } from "../StockDetail";
import { toast } from "sonner";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useAuthStore } from "@/store/auth";

// Mock hooks
vi.mock("@/hooks/use-stock", () => ({
  useStock: vi.fn(() => ({
    useHistory: vi.fn(() => ({ data: { prices: [{ close: 1000, date: "2024-01-01", open: 1000, high: 1000, low: 1000, volume: 100 }], stockName: "삼성전자" }, isLoading: false })),
    useReturns: vi.fn(() => ({ data: null, isLoading: false })),
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
