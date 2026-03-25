import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithQuery } from "@/test/test-utils";
import { makeWatchlistGroup, makeWatchlistItems } from "@/test/fixtures";
import { Watchlist } from "../Watchlist";

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("@/hooks/use-watchlist", () => ({
  useWatchlist: vi.fn(),
}));

// AddItemSheet는 useSearch에 의존 — 간단히 mock
vi.mock("@/app/components/watchlist/AddItemSheet", () => ({
  AddItemSheet: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="add-item-sheet">
      <button onClick={onClose}>닫기</button>
    </div>
  ),
}));

// WatchlistItemCard — 스와이프 제스처 등 복잡한 의존 제거
vi.mock("@/app/components/watchlist/WatchlistItemCard", () => ({
  WatchlistItemCard: ({ stock }: { stock: { name: string; ticker: string } }) => (
    <div data-testid={`card-${stock.ticker}`}>{stock.name}</div>
  ),
}));

import { useWatchlist } from "@/hooks/use-watchlist";

const mockUseWatchlist = useWatchlist as ReturnType<typeof vi.fn>;

function makeDefaultWatchlist(overrides?: {
  groupsData?: ReturnType<typeof makeWatchlistGroup>[];
  itemsData?: ReturnType<typeof makeWatchlistItems>;
}) {
  const groups = overrides?.groupsData ?? [makeWatchlistGroup({ id: 1, name: "관심 그룹" })];
  const items = overrides?.itemsData ?? makeWatchlistItems();

  return {
    groups: { data: groups, isLoading: false, isError: false },
    useGroupItems: () => ({ data: items, isLoading: false }),
    createGroup: { mutate: vi.fn(), isPending: false },
    updateGroupName: { mutate: vi.fn(), isPending: false },
    deleteGroup: { mutate: vi.fn(), isPending: false },
    addItem: { mutate: vi.fn(), isPending: false },
    removeItem: { mutate: vi.fn(), isPending: false },
    updateItemNote: { mutate: vi.fn(), isPending: false },
  };
}

describe("Watchlist — FAB 및 종목 추가 바텀시트 연동", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("그룹 선택 시 FAB '+' 버튼 표시", async () => {
    mockUseWatchlist.mockReturnValue(makeDefaultWatchlist());

    renderWithQuery(<Watchlist />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "종목 추가" })).toBeInTheDocument();
    });
  });

  it("그룹 없으면 FAB 버튼 표시 안 됨", () => {
    mockUseWatchlist.mockReturnValue({
      ...makeDefaultWatchlist({ groupsData: [] }),
      useGroupItems: () => ({ data: undefined, isLoading: false }),
    });

    renderWithQuery(<Watchlist />);

    expect(screen.queryByRole("button", { name: "종목 추가" })).not.toBeInTheDocument();
  });

  it("FAB 클릭 시 AddItemSheet 열림", async () => {
    mockUseWatchlist.mockReturnValue(makeDefaultWatchlist());

    renderWithQuery(<Watchlist />);

    await waitFor(() => screen.getByRole("button", { name: "종목 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "종목 추가" }));

    expect(screen.getByTestId("add-item-sheet")).toBeInTheDocument();
  });

  it("AddItemSheet에서 닫기 → 바텀시트 사라짐", async () => {
    mockUseWatchlist.mockReturnValue(makeDefaultWatchlist());

    renderWithQuery(<Watchlist />);

    await waitFor(() => screen.getByRole("button", { name: "종목 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "종목 추가" }));

    expect(screen.getByTestId("add-item-sheet")).toBeInTheDocument();

    fireEvent.click(screen.getByText("닫기"));

    await waitFor(() => {
      expect(screen.queryByTestId("add-item-sheet")).not.toBeInTheDocument();
    });
  });

  it("종목 없을 때 빈 상태 메시지 + '첫 종목 추가하기' 버튼 표시", async () => {
    mockUseWatchlist.mockReturnValue({
      ...makeDefaultWatchlist(),
      useGroupItems: () => ({ data: { groupName: "관심 그룹", items: [] }, isLoading: false }),
    });

    renderWithQuery(<Watchlist />);

    await waitFor(() => {
      expect(screen.getByText("첫 종목 추가하기")).toBeInTheDocument();
    });
  });

  it("빈 상태 '첫 종목 추가하기' 클릭 시 AddItemSheet 열림", async () => {
    mockUseWatchlist.mockReturnValue({
      ...makeDefaultWatchlist(),
      useGroupItems: () => ({ data: { groupName: "관심 그룹", items: [] }, isLoading: false }),
    });

    renderWithQuery(<Watchlist />);

    await waitFor(() => screen.getByText("첫 종목 추가하기"));
    fireEvent.click(screen.getByText("첫 종목 추가하기"));

    expect(screen.getByTestId("add-item-sheet")).toBeInTheDocument();
  });

  it("종목 목록 카드 렌더링 확인", async () => {
    mockUseWatchlist.mockReturnValue(makeDefaultWatchlist());

    renderWithQuery(<Watchlist />);

    await waitFor(() => {
      expect(screen.getByTestId("card-005930")).toBeInTheDocument();
    });
  });
});
