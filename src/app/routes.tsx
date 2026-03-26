import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "@/app/components/Layout";
import { ProtectedRoute } from "@/app/components/shared/ProtectedRoute";
import {
  Home,
  Portfolio,
  Watchlist,
  More,
  NotificationSettings,
  StockDetail,
  HealthDiagnosis,
  BacktestSetup,
  BacktestResult,
  Login,
  AuthCallbackHandler,
} from "@/app/components/screens";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Home },
      { path: "search", element: <Navigate to="/" replace /> },
      { path: "portfolio", Component: Portfolio },
      { path: "watchlist", Component: Watchlist },
      { path: "more", Component: More },
      { path: "more/notifications", Component: NotificationSettings },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/auth/callback",
    Component: AuthCallbackHandler,
  },
  {
    path: "/stock/:symbol",
    element: (
      <ProtectedRoute>
        <StockDetail />
      </ProtectedRoute>
    ),
  },
  {
    path: "/health-diagnosis",
    element: (
      <ProtectedRoute>
        <HealthDiagnosis />
      </ProtectedRoute>
    ),
  },
  {
    path: "/backtest/setup",
    element: (
      <ProtectedRoute>
        <BacktestSetup />
      </ProtectedRoute>
    ),
  },
  {
    path: "/backtest/result",
    element: (
      <ProtectedRoute>
        <BacktestResult />
      </ProtectedRoute>
    ),
  },
]);
