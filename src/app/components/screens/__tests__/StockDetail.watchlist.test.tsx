import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { StockDetail } from "../StockDetail";
import { renderWithQuery } from "@/test/test-utils";

// 1. react-router 모킹
vi.mock("react-router", () => ({
  useParams: () => ({ symbol: "005930" }),
  useNavigate: () => vi.fn(),
}));

// 2. 커스텀 훅 모킹
vi.mock("@/hooks/use-stock", () => ({
  useStock: () => ({
    useHistory: () => ({ isLoading: false, data: { prices: [] } }),
    useReturns: () => ({ isLoading: false, data: null }),
    useDetail: () => ({ isLoading: false, data: { name: "삼성전자", ticker: "005930" } }),
  }),
}));

vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolio: () => ({ holdings: { items: [], name: "내 포트폴리오", description: "" } }),
  useUpdatePortfolio: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-watchlist", () => ({
  useWatchlist: vi.fn(),
}));

vi.mock("@/store/auth", () => ({
  useAuthStore: Object.assign(
    (selector: (s: any) => any) => selector({ portfolioId: "1", accessToken: "token" }),
    { getState: () => ({ portfolioId: "1", accessToken: "token" }) }
  ),
}));

import { useWatchlist } from "@/hooks/use-watchlist";

describe("StockDetail Watchlist Interaction", () => {
  const mockUseWatchlist = useWatchlist as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("관심 종목이 아닐 때 하트 아이콘은 비어있어야 함", async () => {
    mockUseWatchlist.mockReturnValue({
      groups: { data: [{ id: 1, name: "그룹1" }] },
      useIsTickerInWatchlist: () => ({ isInWatchlist: false, containedGroups: [], isLoading: false }),
      addItem: { mutate: vi.fn() },
      removeItem: { mutate: vi.fn() },
    });

    renderWithQuery(<StockDetail />);

    const heartButton = screen.getByLabelText("관심 종목");
    const heartIcon = heartButton.querySelector("svg");
    
    // 비어있는 상태 확인 (fill-red-500 이 없어야 함)
    expect(heartIcon).not.toHaveClass("fill-red-500");
  });

  it("관심 종목일 때 하트 아이콘은 채워져 있어야 함", async () => {
    mockUseWatchlist.mockReturnValue({
      groups: { data: [{ id: 1, name: "그룹1" }] },
      useIsTickerInWatchlist: () => ({ isInWatchlist: true, containedGroups: [{ id: 1 }], isLoading: false }),
      addItem: { mutate: vi.fn() },
      removeItem: { mutate: vi.fn() },
    });

    renderWithQuery(<StockDetail />);

    const heartButton = screen.getByLabelText("관심 종목");
    const heartIcon = heartButton.querySelector("svg");
    
    expect(heartIcon).toHaveClass("fill-red-500");
  });

  it("하트 아이콘 클릭 시 등록되지 않았으면 addItem 호출", async () => {
    const mockAddItem = { mutate: vi.fn() };
    mockUseWatchlist.mockReturnValue({
      groups: { data: [{ id: 1, name: "그룹1" }] },
      useIsTickerInWatchlist: () => ({ isInWatchlist: false, containedGroups: [], isLoading: false }),
      addItem: mockAddItem,
      removeItem: { mutate: vi.fn() },
    });

    renderWithQuery(<StockDetail />);

    const heartButton = screen.getByLabelText("관심 종목");
    fireEvent.click(heartButton);

    expect(mockAddItem.mutate).toHaveBeenCalled();
  });

  it("하트 아이콘 클릭 시 이미 등록되어 있으면 removeItem 호출", async () => {
    const mockRemoveItem = { mutate: vi.fn() };
    mockUseWatchlist.mockReturnValue({
      groups: { data: [{ id: 1, name: "그룹1" }] },
      useIsTickerInWatchlist: () => ({ isInWatchlist: true, containedGroups: [{ id: 1 }], isLoading: false }),
      addItem: { mutate: vi.fn() },
      removeItem: mockRemoveItem,
    });

    renderWithQuery(<StockDetail />);

    const heartButton = screen.getByLabelText("관심 종목");
    fireEvent.click(heartButton);

    expect(mockRemoveItem.mutate).toHaveBeenCalled();
  });
});
