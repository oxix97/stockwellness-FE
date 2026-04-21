import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "@/app/components/Layout";
import { ProtectedRoute } from "@/app/components/shared/ProtectedRoute";

const Home = lazy(() => import("@/app/components/screens/Home").then(m => ({ default: m.Home })));
const Portfolio = lazy(() => import("@/app/components/screens/Portfolio").then(m => ({ default: m.Portfolio })));
const Watchlist = lazy(() => import("@/app/components/screens/Watchlist").then(m => ({ default: m.Watchlist })));
const Search = lazy(() => import("@/app/components/screens/Search").then(m => ({ default: m.Search })));
const More = lazy(() => import("@/app/components/screens/More").then(m => ({ default: m.More })));
const NotificationSettings = lazy(() => import("@/app/components/screens/NotificationSettings").then(m => ({ default: m.NotificationSettings })));
const StockDetail = lazy(() => import("@/app/components/screens/StockDetail").then(m => ({ default: m.StockDetail })));
const BacktestSetup = lazy(() => import("@/app/components/screens/BacktestSetup").then(m => ({ default: m.BacktestSetup })));
const BacktestResult = lazy(() => import("@/app/components/screens/BacktestResult").then(m => ({ default: m.BacktestResult })));
const Login = lazy(() => import("@/app/components/screens/Login").then(m => ({ default: m.Login })));
const AuthCallbackHandler = lazy(() => import("@/app/components/screens/AuthCallbackHandler").then(m => ({ default: m.AuthCallbackHandler })));
const NotFoundPage = lazy(() => import("@/app/components/screens/error/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

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
      { path: "search", Component: Search },
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
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
