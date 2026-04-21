import { useQuery, useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { watchlistApi, watchlistKeys } from "@/api/watchlist";
import { AddWatchlistItemRequest, WatchlistGroup, WatchlistItemListResponse, WatchlistItemDetail } from "@/types/api";
import {
  applyOptimisticQueryUpdate,
  rollbackOptimisticQueryUpdate,
} from "@/hooks/query-cache";

export function useWatchlist() {
  const queryClient = useQueryClient();

  const groups = useQuery({
    queryKey: watchlistKeys.groups(),
    queryFn: () => watchlistApi.getGroups(),
  });

  const useGroupItems = (groupId: number | null) => useQuery({
    queryKey: groupId !== null ? watchlistKeys.items(groupId) : ["watchlist", "items", "null"],
    queryFn: () => watchlistApi.getItems(groupId!),
    enabled: groupId !== null,
  });

  const useIsTickerInWatchlist = (ticker: string) => {
    const groupList = groups.data ?? [];
    
    const itemsQueries = useQueries({
      queries: groupList.map((group) => ({
        queryKey: watchlistKeys.items(group.id),
        queryFn: () => watchlistApi.getItems(group.id),
        staleTime: 1000 * 60 * 5,
      })),
    });

    const isLoading = groups.isLoading || itemsQueries.some(q => q.isLoading);
    
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() }),
  });

  const updateGroupName = useMutation({
    mutationFn: ({ groupId, name }: { groupId: number; name: string }) =>
      watchlistApi.updateGroupName(groupId, name),
    onMutate: async ({ groupId, name }) => {
      return applyOptimisticQueryUpdate<WatchlistGroup[]>(
        queryClient,
        watchlistKeys.groups(),
        (old) => old?.map((g) => (g.id === groupId ? { ...g, name } : g)),
      );
    },
    onError: (_err, _newGroup, context) => {
      rollbackOptimisticQueryUpdate(queryClient, context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
    },
  });

  const deleteGroup = useMutation({
    mutationFn: (groupId: number) => watchlistApi.deleteGroup(groupId),
    onMutate: async (groupId) => {
      return applyOptimisticQueryUpdate<WatchlistGroup[]>(
        queryClient,
        watchlistKeys.groups(),
        (old) => old?.filter((g) => g.id !== groupId),
      );
    },
    onError: (_err, _newGroup, context) => {
      rollbackOptimisticQueryUpdate(queryClient, context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
    },
  });

  const addItem = useMutation({
    mutationFn: ({ groupId, body }: { groupId: number; body: AddWatchlistItemRequest & { name?: string } }) =>
      watchlistApi.addItem(groupId, body),
    onMutate: async ({ groupId, body }) => {
      const context = await applyOptimisticQueryUpdate<WatchlistItemListResponse>(
        queryClient,
        watchlistKeys.items(groupId),
        (old) => {
          if (!old) return old;

          const newItem: WatchlistItemDetail = {
            ticker: body.ticker,
            name: body.name || body.ticker,
            currentPrice: null,
            fluctuationRate: null,
            note: body.note || "",
            rsi: null,
            rsiStatus: "",
            aiInsight: "",
          };

          return {
            ...old,
            items: [...old.items, newItem],
          };
        },
      );
      return { ...context, groupId };
    },
    onError: (_err, _variables, context) => {
      rollbackOptimisticQueryUpdate(queryClient, context);
    },
    onSettled: (_data, _err, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.items(groupId) });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
    },
  });

  const removeItem = useMutation({
    mutationFn: ({ groupId, ticker }: { groupId: number; ticker: string }) =>
      watchlistApi.removeItem(groupId, ticker),
    onMutate: async ({ groupId, ticker }) => {
      const context = await applyOptimisticQueryUpdate<WatchlistItemListResponse>(
        queryClient,
        watchlistKeys.items(groupId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.filter((item) => item.ticker !== ticker),
          };
        },
      );
      return { ...context, groupId };
    },
    onError: (_err, _variables, context) => {
      rollbackOptimisticQueryUpdate(queryClient, context);
    },
    onSettled: (_data, _err, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.items(groupId) });
      queryClient.invalidateQueries({ queryKey: watchlistKeys.groups() });
    },
  });

  const updateItemNote = useMutation({
    mutationFn: ({ groupId, ticker, note }: { groupId: number; ticker: string; note: string }) =>
      watchlistApi.updateItemNote(groupId, ticker, note),
    onMutate: async ({ groupId, ticker, note }) => {
      const context = await applyOptimisticQueryUpdate<WatchlistItemListResponse>(
        queryClient,
        watchlistKeys.items(groupId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => (item.ticker === ticker ? { ...item, note } : item)),
          };
        },
      );
      return { ...context, groupId };
    },
    onError: (_err, _variables, context) => {
      rollbackOptimisticQueryUpdate(queryClient, context);
    },
    onSettled: (_data, _err, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: watchlistKeys.items(groupId) });
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
