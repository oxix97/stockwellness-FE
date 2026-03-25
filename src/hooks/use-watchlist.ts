import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  };
}
