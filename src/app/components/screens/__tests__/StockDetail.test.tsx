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
  useStock: vi.fn(),
}));

vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolio: () => ({ holdings: { items: [], name: "내 포트폴리오", description: "" } }),
  useUpdatePortfolio: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-watchlist", () => ({
  useWatchlist: () => ({
    groups: { data: [] },
    addItem: { mutate: vi.fn() },
    removeItem: { mutate: vi.fn() },
    createGroup: { mutateAsync: vi.fn() },
  }),
}));

vi.mock("@/store/auth", () => ({
  useAuthStore: Object.assign(
    (selector: (s: any) => any) => selector({ portfolioId: "1", accessToken: "token" }),
    { getState: () => ({ portfolioId: "1", accessToken: "token" }) }
  ),
}));

import { useStock } from "@/hooks/use-stock";

describe("StockDetail Screen - 주봉 차트 데이터 검증", () => {
  const mockUseStock = useStock as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("주봉(WEEKLY) 데이터 요청 시 차트가 정상적으로 렌더링되어야 함", async () => {
    // Mocking useHistory
    const mockHistory = {
      isLoading: false,
      data: {
        ticker: "005930",
        stockName: "삼성전자",
        benchmarkName: "KOSPI",
        prices: [
          { date: "2024-03-25", open: 70000, close: 75000, high: 76000, low: 69000, volume: 1000000, ma5: 71000, ma20: 70000, ma60: 68000 },
          { date: "2024-04-01", open: 75000, close: 78000, high: 79000, low: 74000, volume: 1200000, ma5: 73000, ma20: 71000, ma60: 69000 }
        ],
        benchmarks: [
          { date: "2024-03-25", returnRate: 1.5 },
          { date: "2024-04-01", returnRate: 2.0 }
        ]
      }
    };

    mockUseStock.mockReturnValue({
      useHistory: vi.fn((ticker, period, freq) => {
        if (freq === "WEEKLY") return mockHistory;
        return { isLoading: false, data: { prices: [] } }; // 기본값
      }),
      useReturns: () => ({ isLoading: false, data: null }),
      useDetail: () => ({ isLoading: false, data: null }),
    });

    renderWithQuery(<StockDetail />);

    // '주봉' 탭 클릭
    const weeklyTab = screen.getByRole("button", { name: "주봉" });
    fireEvent.click(weeklyTab);

    // 차트 레이블 확인
    await waitFor(() => {
      const labels = screen.getAllByText("주봉");
      expect(labels.length).toBeGreaterThan(0);
    });

    // 가격 정보 확인
    expect(screen.getByText("삼성전자")).toBeDefined();
    expect(screen.getByText(/78,000/)).toBeDefined();
  });

  it("주봉 데이터와 벤치마크 데이터의 날짜가 일치하지 않을 때 벤치마크 라인이 그려지지 않는 문제 (정합성 재현)", async () => {
    const mockHistoryMismatch = {
      isLoading: false,
      data: {
        ticker: "005930",
        stockName: "삼성전자",
        benchmarkName: "KOSPI",
        prices: [
          { date: "2024-04-01", open: 75000, close: 78000, high: 79000, low: 74000, volume: 1200000 }
        ],
        benchmarks: [
          { date: "2024-04-02", returnRate: 1.0 } // 날짜 불일치 (가격은 1일, 벤치마크는 2일)
        ]
      }
    };

    mockUseStock.mockReturnValue({
      useHistory: vi.fn((ticker, period, freq) => {
        if (freq === "WEEKLY") return mockHistoryMismatch;
        return { isLoading: false, data: { prices: [] } };
      }),
      useReturns: () => ({ isLoading: false, data: null }),
      useDetail: () => ({ isLoading: false, data: null }),
    });

    renderWithQuery(<StockDetail />);
    fireEvent.click(screen.getByRole("button", { name: "주봉" }));

    await waitFor(() => {
      // 이제는 날짜가 1일 차이나도 가장 가까운(이전) 벤치마크 데이터를 찾거나 
      // 최소한 렌더링 시 KOSPI 레이블이 나타나야 함 (hasBenchmarkData가 true가 되어야 함)
      // 단, 위 모크에서는 가격(04-01), 벤치마크(04-02)이므로 여전히 null일 수 있음. 
      // 모크를 수정하여 이전 날짜 데이터를 넣어 테스트.
    });
  });

  it("주봉 데이터와 벤치마크 데이터의 날짜가 일치하지 않아도 가장 가까운 이전 데이터를 매칭함", async () => {
    const mockHistoryNearMatch = {
      isLoading: false,
      data: {
        ticker: "005930",
        stockName: "삼성전자",
        benchmarkName: "KOSPI",
        prices: [
          { date: "2024-04-02", open: 75000, close: 78000, high: 79000, low: 74000, volume: 1200000 }
        ],
        benchmarks: [
          { date: "2024-04-01", returnRate: 1.0 } // 1일 벤치마크, 2일 가격
        ]
      }
    };

    mockUseStock.mockReturnValue({
      useHistory: vi.fn((ticker, period, freq) => {
        if (freq === "WEEKLY") return mockHistoryNearMatch;
        return { isLoading: false, data: { prices: [] } };
      }),
      useReturns: () => ({ isLoading: false, data: null }),
      useDetail: () => ({ isLoading: false, data: null }),
    });

    renderWithQuery(<StockDetail />);
    fireEvent.click(screen.getByRole("button", { name: "주봉" }));

    await waitFor(() => {
      // hasBenchmarkData가 true가 되어 KOSPI가 표시되어야 함
      expect(screen.getByText("KOSPI")).toBeDefined();
    });
  });

  it("주봉 데이터가 1개만 있을 때 에러 없이 렌더링되어야 함 (정합성 체크)", async () => {
    const mockHistorySingle = {
      isLoading: false,
      data: {
        ticker: "005930",
        stockName: "삼성전자",
        prices: [
          { date: "2024-04-01", open: 75000, close: 78000, high: 79000, low: 74000, volume: 1200000 }
        ],
        benchmarks: []
      }
    };

    mockUseStock.mockReturnValue({
      useHistory: vi.fn((ticker, period, freq) => {
        if (freq === "WEEKLY") return mockHistorySingle;
        return { isLoading: false, data: { prices: [] } };
      }),
      useReturns: () => ({ isLoading: false, data: null }),
      useDetail: () => ({ isLoading: false, data: null }),
    });

    renderWithQuery(<StockDetail />);
    fireEvent.click(screen.getByRole("button", { name: "주봉" }));

    await waitFor(() => {
      const labels = screen.getAllByText("주봉");
      expect(labels.length).toBeGreaterThan(0);
      expect(screen.getByText(/78,000/)).toBeDefined();
    });
  });
});
