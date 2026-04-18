import { apiClient } from "./client";
import {
  WatchlistGroup,
  WatchlistItemListResponse,
  AddWatchlistItemRequest,
  UpdateWatchlistItemNoteRequest,
} from "@/types/api";

export const watchlistKeys = {
  all: ['watchlist'] as const,
  groups: () => [...watchlistKeys.all, 'groups'] as const,
  items: (groupId: number) =>
    [...watchlistKeys.all, 'items', groupId] as const,
};

export const watchlistApi = {
  /**
   * 사용자의 관심 종목 그룹 목록을 가져옵니다.
   */
  getGroups: async (): Promise<WatchlistGroup[]> => {
    const data = await apiClient.get("/v1/watchlist/groups");
    return data as unknown as WatchlistGroup[];
  },

  /**
   * 특정 관심 종목 그룹에 속한 종목 리스트를 가져옵니다.
   * @param groupId 그룹 ID
   */
  getItems: async (groupId: number): Promise<WatchlistItemListResponse> => {
    const data = await apiClient.get(`/v1/watchlist/groups/${groupId}/items`);
    return data as unknown as WatchlistItemListResponse;
  },

  createGroup: async (name: string): Promise<number> => {
    const data = await apiClient.post("/v1/watchlist/groups", { name });
    return data as unknown as number;
  },

  addItem: async (groupId: number, body: AddWatchlistItemRequest): Promise<void> => {
    await apiClient.post(`/v1/watchlist/groups/${groupId}/items`, body);
  },

  removeItem: async (groupId: number, ticker: string): Promise<void> => {
    await apiClient.delete(`/v1/watchlist/groups/${groupId}/items/${ticker}`);
  },

  updateItemNote: async (groupId: number, ticker: string, note: string): Promise<void> => {
    await apiClient.patch(`/v1/watchlist/groups/${groupId}/items/${ticker}/note`, { note } satisfies UpdateWatchlistItemNoteRequest);
  },

  updateGroupName: async (groupId: number, name: string): Promise<void> => {
    await apiClient.patch(`/v1/watchlist/groups/${groupId}`, { name });
  },

  deleteGroup: async (groupId: number): Promise<void> => {
    await apiClient.delete(`/v1/watchlist/groups/${groupId}`);
  },
};