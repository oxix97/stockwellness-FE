import { useQuery } from "@tanstack/react-query";
import { watchlistApi } from "@/api/watchlist";

export function useWatchlist() {
  const groups = useQuery({
    queryKey: ["watchlist", "groups"],
    queryFn: () => watchlistApi.getGroups(),
  });

  const useGroupItems = (groupId: number | null) => useQuery({
    queryKey: ["watchlist", "groups", groupId, "items"],
    queryFn: () => watchlistApi.getItems(groupId!),
    enabled: groupId !== null,
  });

  return {
    groups,
    useGroupItems,
  };
}
