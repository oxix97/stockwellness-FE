import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { ErrorBoundary } from "@/app/components/shared";

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}