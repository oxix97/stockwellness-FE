import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithQuery } from "@/test/test-utils";
import { makeWatchlistGroup, makeWatchlistItems } from "@/test/fixtures";
import { useWatchlist } from "../use-watchlist";

vi.mock("@/api/watchlist", () => ({
  watchlistApi: {
    getGroups: vi.fn(),
    getItems: vi.fn(),
    createGroup: vi.fn(),
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateItemNote: vi.fn(),
    updateGroupName: vi.fn(),
    deleteGroup: vi.fn(),
  },
}));

import { watchlistApi } from "@/api/watchlist";

const mockApi = watchlistApi as {
  getGroups: ReturnType<typeof vi.fn>;
  getItems: ReturnType<typeof vi.fn>;
  createGroup: ReturnType<typeof vi.fn>;
  addItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  updateItemNote: ReturnType<typeof vi.fn>;
  updateGroupName: ReturnType<typeof vi.fn>;
  deleteGroup: ReturnType<typeof vi.fn>;
};

describe("useWatchlist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("그룹 목록 정상 조회", async () => {
    const groups = [makeWatchlistGroup(), makeWatchlistGroup({ id: 2, name: "두번째 그룹" })];
    mockApi.getGroups.mockResolvedValue(groups);

    const { result } = renderHookWithQuery(() => useWatchlist());

    await waitFor(() => expect(result.current.groups.data).toBeDefined());
    expect(result.current.groups.data).toHaveLength(2);
    expect(result.current.groups.data![0].name).toBe("관심 그룹");
  });

  it("getGroups API 오류 시 groups.isError true", async () => {
    mockApi.getGroups.mockRejectedValue(new Error("네트워크 오류"));

    const { result } = renderHookWithQuery(() => useWatchlist());

    await waitFor(() => expect(result.current.groups.isError).toBe(true));
  });

  it("useGroupItems — groupId null이면 쿼리 비활성화", () => {
    mockApi.getGroups.mockResolvedValue([]);
    const { result } = renderHookWithQuery(() => useWatchlist());

    const { result: itemsResult } = renderHookWithQuery(
      () => result.current.useGroupItems(null),
    );

    expect(itemsResult.current.data).toBeUndefined();
    expect(mockApi.getItems).not.toHaveBeenCalled();
  });

  it("useGroupItems — groupId 있으면 해당 그룹 아이템 조회", async () => {
    mockApi.getGroups.mockResolvedValue([makeWatchlistGroup({ id: 1 })]);
    const items = makeWatchlistItems({ groupName: "관심 그룹" });
    mockApi.getItems.mockResolvedValue(items);

    const { result } = renderHookWithQuery(() => useWatchlist());
    const { result: itemsResult } = renderHookWithQuery(
      () => result.current.useGroupItems(1),
    );

    await waitFor(() => expect(itemsResult.current.data).toBeDefined());
    expect(itemsResult.current.data!.groupName).toBe("관심 그룹");
    expect(mockApi.getItems).toHaveBeenCalledWith(1);
  });

  it("createGroup 성공 시 groups 쿼리 무효화 → 재조회", async () => {
    const initialGroups = [makeWatchlistGroup({ id: 1 })];
    const updatedGroups = [makeWatchlistGroup({ id: 1 }), makeWatchlistGroup({ id: 2, name: "신규 그룹" })];

    mockApi.getGroups
      .mockResolvedValueOnce(initialGroups)
      .mockResolvedValueOnce(updatedGroups);
    mockApi.createGroup.mockResolvedValue(2);

    const { result } = renderHookWithQuery(() => useWatchlist());

    await waitFor(() => expect(result.current.groups.data).toHaveLength(1));

    act(() => {
      result.current.createGroup.mutate("신규 그룹");
    });

    await waitFor(() => expect(result.current.groups.data).toHaveLength(2));
    expect(mockApi.createGroup).toHaveBeenCalledWith("신규 그룹");
  });

  it("addItem 성공 시 해당 그룹 items 쿼리 무효화", async () => {
    mockApi.getGroups.mockResolvedValue([makeWatchlistGroup({ id: 1 })]);
    const before = makeWatchlistItems({ items: [] });
    const after = makeWatchlistItems();
    mockApi.getItems.mockResolvedValueOnce(before).mockResolvedValueOnce(after);
    mockApi.addItem.mockResolvedValue(undefined);

    // 동일한 QueryClient 공유 — invalidation이 두 훅에 모두 반영되도록
    const { result, rerender } = renderHookWithQuery(
      ({ groupId }: { groupId: number | null }) => ({
        wl: useWatchlist(),
        items: useWatchlist().useGroupItems(groupId),
      }),
      { initialProps: { groupId: 1 } }
    );

    await waitFor(() => expect(result.current.items.data?.items).toHaveLength(0));

    act(() => {
      result.current.wl.addItem.mutate({ groupId: 1, body: { ticker: "005930", note: "" } });
    });

    await waitFor(() => expect(result.current.items.data?.items).toHaveLength(1));
    void rerender;
  });

  it("updateGroupName 성공 시 groups 쿼리 무효화", async () => {
    const initial = [makeWatchlistGroup({ id: 1, name: "기존 이름" })];
    const updated = [makeWatchlistGroup({ id: 1, name: "새 이름" })];
    mockApi.getGroups.mockResolvedValueOnce(initial).mockResolvedValueOnce(updated);
    mockApi.updateGroupName.mockResolvedValue(undefined);

    const { result } = renderHookWithQuery(() => useWatchlist());

    await waitFor(() => expect(result.current.groups.data![0].name).toBe("기존 이름"));

    act(() => {
      result.current.updateGroupName.mutate({ groupId: 1, name: "새 이름" });
    });

    await waitFor(() => expect(result.current.groups.data![0].name).toBe("새 이름"));
    expect(mockApi.updateGroupName).toHaveBeenCalledWith(1, "새 이름");
  });

  it("deleteGroup 성공 시 groups 쿼리 무효화", async () => {
    const initial = [makeWatchlistGroup({ id: 1 }), makeWatchlistGroup({ id: 2 })];
    const updated = [makeWatchlistGroup({ id: 2 })];
    mockApi.getGroups.mockResolvedValueOnce(initial).mockResolvedValueOnce(updated);
    mockApi.deleteGroup.mockResolvedValue(undefined);

    const { result } = renderHookWithQuery(() => useWatchlist());

    await waitFor(() => expect(result.current.groups.data).toHaveLength(2));

    act(() => {
      result.current.deleteGroup.mutate(1);
    });

    await waitFor(() => expect(result.current.groups.data).toHaveLength(1));
    expect(mockApi.deleteGroup).toHaveBeenCalledWith(1);
  });

  it("useIsTickerInWatchlist — 특정 티커가 포함된 그룹을 정확히 식별", async () => {
    const groups = [makeWatchlistGroup({ id: 1 }), makeWatchlistGroup({ id: 2, name: "그룹2" })];
    mockApi.getGroups.mockResolvedValue(groups);
    
    const items1 = makeWatchlistItems({ items: [{ ticker: "005930", name: "삼성전자", currentPrice: 70000, fluctuationRate: 1.0, fluctuationAmount: 700, marketType: "KOSPI" }] });
    const items2 = makeWatchlistItems({ items: [{ ticker: "000660", name: "SK하이닉스", currentPrice: 150000, fluctuationRate: 2.0, fluctuationAmount: 3000, marketType: "KOSPI" }] });
    
    mockApi.getItems
      .mockResolvedValueOnce(items1)
      .mockResolvedValueOnce(items2);

    const { result } = renderHookWithQuery(() => {
      const wl = useWatchlist();
      const status = wl.useIsTickerInWatchlist("005930");
      return { wl, status };
    });

    await waitFor(() => expect(result.current.status.isInWatchlist).toBe(true), { timeout: 2000 });
    expect(result.current.status.containedGroups).toHaveLength(1);
    expect(result.current.status.containedGroups[0].id).toBe(1);
  });
});
