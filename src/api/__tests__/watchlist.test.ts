import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "../client";
import { watchlistApi } from "../watchlist";
import { makeWatchlistGroup, makeWatchlistItems } from "@/test/fixtures";

const mockClient = apiClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe("watchlistApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getGroups — GET /v1/watchlist/groups 호출", async () => {
    const groups = [makeWatchlistGroup()];
    mockClient.get.mockResolvedValue(groups);

    const result = await watchlistApi.getGroups();

    expect(mockClient.get).toHaveBeenCalledWith("/v1/watchlist/groups");
    expect(result).toEqual(groups);
  });

  it("getItems — GET /v1/watchlist/groups/:id/items 호출", async () => {
    const items = makeWatchlistItems();
    mockClient.get.mockResolvedValue(items);

    const result = await watchlistApi.getItems(1);

    expect(mockClient.get).toHaveBeenCalledWith("/v1/watchlist/groups/1/items");
    expect(result).toEqual(items);
  });

  it("createGroup — POST /v1/watchlist/groups 호출", async () => {
    mockClient.post.mockResolvedValue(2);

    const id = await watchlistApi.createGroup("신규 그룹");

    expect(mockClient.post).toHaveBeenCalledWith("/v1/watchlist/groups", { name: "신규 그룹" });
    expect(id).toBe(2);
  });

  it("addItem — POST /v1/watchlist/groups/:id/items 호출", async () => {
    mockClient.post.mockResolvedValue(undefined);

    await watchlistApi.addItem(1, { ticker: "005930", note: "메모" });

    expect(mockClient.post).toHaveBeenCalledWith(
      "/v1/watchlist/groups/1/items",
      { ticker: "005930", note: "메모" }
    );
  });

  it("removeItem — DELETE /v1/watchlist/groups/:id/items/:ticker 호출", async () => {
    mockClient.delete.mockResolvedValue(undefined);

    await watchlistApi.removeItem(1, "005930");

    expect(mockClient.delete).toHaveBeenCalledWith("/v1/watchlist/groups/1/items/005930");
  });

  it("updateItemNote — PATCH /v1/watchlist/groups/:id/items/:ticker/note 호출", async () => {
    mockClient.patch.mockResolvedValue(undefined);

    await watchlistApi.updateItemNote(1, "005930", "새 메모");

    expect(mockClient.patch).toHaveBeenCalledWith(
      "/v1/watchlist/groups/1/items/005930/note",
      { note: "새 메모" }
    );
  });

  it("updateGroupName — PATCH /v1/watchlist/groups/:id 호출", async () => {
    mockClient.patch.mockResolvedValue(undefined);

    await watchlistApi.updateGroupName(1, "수정된 이름");

    expect(mockClient.patch).toHaveBeenCalledWith(
      "/v1/watchlist/groups/1",
      { name: "수정된 이름" }
    );
  });

  it("deleteGroup — DELETE /v1/watchlist/groups/:id 호출", async () => {
    mockClient.delete.mockResolvedValue(undefined);

    await watchlistApi.deleteGroup(1);

    expect(mockClient.delete).toHaveBeenCalledWith("/v1/watchlist/groups/1");
  });
});
