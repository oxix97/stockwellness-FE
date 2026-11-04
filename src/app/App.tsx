import { Suspense, useEffect } from "react";
import { RouterProvider } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "./routes.tsx";
import { ErrorBoundary } from "@/app/components/shared";
import { Skeleton } from "@/app/components/ui";
import { useAuthStore } from "@/store/auth";
import { discardActualSessionQueries } from "@/api/actual-session";

function ActualSessionCacheBoundary() {
  const client = useQueryClient();
  useEffect(() => useAuthStore.subscribe((state, previous) => {
    if (state.memberId !== previous.memberId || state.sessionEpoch !== previous.sessionEpoch) {
      discardActualSessionQueries(client);
    }
  }), [client]);
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ActualSessionCacheBoundary />
      <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-40 w-full rounded-3xl" /><Skeleton className="h-80 w-full rounded-3xl" /></div>}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  );
}
