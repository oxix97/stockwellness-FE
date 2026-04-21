import { QueryClient, QueryKey } from "@tanstack/react-query";

export interface OptimisticQueryContext<TData> {
  previousData: TData | undefined;
  queryKey: QueryKey;
}

export async function applyOptimisticQueryUpdate<TData>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  updater: (current: TData | undefined) => TData | undefined,
): Promise<OptimisticQueryContext<TData>> {
  await queryClient.cancelQueries({ queryKey });
  const previousData = queryClient.getQueryData<TData>(queryKey);
  queryClient.setQueryData<TData>(queryKey, updater);
  return { previousData, queryKey };
}

export function rollbackOptimisticQueryUpdate<TData>(
  queryClient: QueryClient,
  context?: OptimisticQueryContext<TData>,
) {
  if (!context) {
    return;
  }

  queryClient.setQueryData<TData>(context.queryKey, context.previousData);
}
