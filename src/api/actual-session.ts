import type { QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";

export type ActualSession = { memberId: number; epoch: number };

export function actualSession(): ActualSession | null {
  const state = useAuthStore.getState();
  if (!state) return null;
  const { memberId, sessionEpoch, accessToken } = state;
  return memberId && accessToken ? { memberId, epoch: sessionEpoch ?? 0 } : null;
}

export function isCurrentActualSession(session: ActualSession): boolean {
  const current = actualSession();
  return !!current && current.memberId === session.memberId && current.epoch === session.epoch;
}

export function discardActualSessionQueries(client: QueryClient) {
  void client.cancelQueries({ predicate: (query) => query.queryKey.includes("ACTUAL") });
  client.removeQueries({ predicate: (query) => query.queryKey.includes("ACTUAL") });
}
