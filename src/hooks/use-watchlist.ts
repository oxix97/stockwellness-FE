import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { watchlistApi } from "@/api/watchlist";
import { AddWatchlistItemRequest } from "@/types/api";

export function useWatchlist() {
  const queryClient = useQueryClient();

  const groups = useQuery({
    queryKey: ["watchlist", "groups"],
    queryFn: () => watchlistApi.getGroups(),
  });

  const useGroupItems = (groupId: number | null) => useQuery({
    queryKey: ["watchlist", "groups", groupId, "items"],
    queryFn: () => watchlistApi.getItems(groupId!),
    enabled: groupId !== null,
  });

  /**
   * 특정 종목이 어느 관심 그룹에 속해 있는지 확인하는 훅
   */
  const useIsTickerInWatchlist = (ticker: string) => {
    const groupList = groups.data ?? [];
    
    // 모든 그룹의 아이템을 병렬로 조회
    const itemsQueries = useQueries({
      queries: groupList.map((group) => ({
        queryKey: ["watchlist", "groups", group.id, "items"],
        queryFn: () => watchlistApi.getItems(group.id),
        staleTime: 1000 * 60 * 5, // 5분
      })),
    });

    const isLoading = groups.isLoading || itemsQueries.some(q => q.isLoading);
    
    // 해당 ticker가 포함된 그룹들을 찾음
    const containedGroups = groupList.filter((_, index) => {
      const items = itemsQueries[index]?.data?.items ?? [];
      return items.some(item => item.ticker === ticker);
    });

    return {
      isInWatchlist: containedGroups.length > 0,
      containedGroups,
      isLoading,
    };
  };

  const createGroup = useMutation({
    mutationFn: (name: string) => watchlistApi.createGroup(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist", "groups"] }),
  });

  const addItem = useMutation({
    mutationFn: ({ groupId, body }: { groupId: number; body: AddWatchlistItemRequest }) =>
      watchlistApi.addItem(groupId, body),
    onSuccess: (_data, { groupId }) =>
      queryClient.invalidateQueries({ queryKey: ["watchlist", "groups", groupId, "items"] }),
  });

  const removeItem = useMutation({
    mutationFn: ({ groupId, ticker }: { groupId: number; ticker: string }) =>
      watchlistApi.removeItem(groupId, ticker),
    onSuccess: (_data, { groupId }) =>
      queryClient.invalidateQueries({ queryKey: ["watchlist", "groups", groupId, "items"] }),
  });

  const updateItemNote = useMutation({
    mutationFn: ({ groupId, ticker, note }: { groupId: number; ticker: string; note: string }) =>
      watchlistApi.updateItemNote(groupId, ticker, note),
    onSuccess: (_data, { groupId }) =>
      queryClient.invalidateQueries({ queryKey: ["watchlist", "groups", groupId, "items"] }),
  });

  const updateGroupName = useMutation({
    mutationFn: ({ groupId, name }: { groupId: number; name: string }) =>
      watchlistApi.updateGroupName(groupId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", "groups"] });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: (groupId: number) => watchlistApi.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", "groups"] });
    },
  });

  return {
    groups,
    useGroupItems,
    createGroup,
    addItem,
    removeItem,
    updateItemNote,
    updateGroupName,
    deleteGroup,
    useIsTickerInWatchlist,
  };
}
