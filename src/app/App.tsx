import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { ErrorBoundary } from "@/app/components/shared";
import { Skeleton } from "@/app/components/ui";

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-6 space-y-4"><Skeleton className="h-40 w-full rounded-3xl" /><Skeleton className="h-80 w-full rounded-3xl" /></div>}>
        <RouterProvider router={router} />
      </Suspense>
    </ErrorBoundary>
  );
}