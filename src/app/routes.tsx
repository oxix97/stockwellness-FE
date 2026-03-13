import { createBrowserRouter } from "react-router";
import { Layout } from "@/app/components/Layout";
import {
  Home,
  Search,
  Portfolio,
  Watchlist,
  More,
  StockDetail,
  HealthDiagnosis,
  BacktestSetup,
  BacktestResult,
  Login,
  AuthCallback,
} from "@/app/components/screens";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "search", Component: Search },
      { path: "portfolio", Component: Portfolio },
      { path: "watchlist", Component: Watchlist },
      { path: "more", Component: More },
    ],
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/auth/:provider/callback",
    Component: AuthCallback,
  },
  {
    path: "/stock/:symbol",
    Component: StockDetail,
  },
  {
    path: "/health-diagnosis",
    Component: HealthDiagnosis,
  },
  {
    path: "/backtest/setup",
    Component: BacktestSetup,
  },
  {
    path: "/backtest/result",
    Component: BacktestResult,
  },
]);
