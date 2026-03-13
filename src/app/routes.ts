import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/screens/Home";
import { Search } from "./components/screens/Search";
import { Portfolio } from "./components/screens/Portfolio";
import { Watchlist } from "./components/screens/Watchlist";
import { More } from "./components/screens/More";
import { StockDetail } from "./components/screens/StockDetail";
import { HealthDiagnosis } from "./components/screens/HealthDiagnosis";

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
    path: "/stock/:symbol",
    Component: StockDetail,
  },
  {
    path: "/health-diagnosis",
    Component: HealthDiagnosis,
  },
]);
