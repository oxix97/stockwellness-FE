import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RouterProvider, createMemoryRouter } from "react-router";
import { router } from "../routes";
import { useAuthStore } from "@/store/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mocking dependencies
vi.mock("@/store/auth");
vi.mock("@/app/components/screens/Home", () => ({ Home: () => <div>Home Screen</div> }));
vi.mock("@/app/components/screens/Portfolio", () => ({ Portfolio: () => <div>Portfolio Screen</div> }));
vi.mock("@/app/components/screens/Watchlist", () => ({ Watchlist: () => <div>Watchlist Screen</div> }));
vi.mock("@/app/components/screens/StockDetail", () => ({ StockDetail: () => <div>Stock Detail Screen</div> }));
vi.mock("@/app/components/screens/Login", () => ({ Login: () => <div>Login Screen</div> }));

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe("Router Access Control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("비로그인 사용자가 홈(/)에 접근할 수 있다", async () => {
    (useAuthStore as any).mockImplementation((selector: any) => 
      selector ? selector({ accessToken: null }) : { accessToken: null }
    );

    const testRouter = createMemoryRouter(router.routes, {
      initialEntries: ["/"],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={testRouter} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Home Screen")).toBeInTheDocument();
    });
  });

  it("비로그인 사용자가 종목 상세(/stock/AAPL)에 접근할 수 있다", async () => {
    (useAuthStore as any).mockImplementation((selector: any) => 
      selector ? selector({ accessToken: null }) : { accessToken: null }
    );

    const testRouter = createMemoryRouter(router.routes, {
      initialEntries: ["/stock/AAPL"],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={testRouter} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Stock Detail Screen")).toBeInTheDocument();
    });
  });

  it("비로그인 사용자가 포트폴리오(/portfolio) 접근 시 로그인 페이지로 리다이렉트된다", async () => {
    (useAuthStore as any).mockImplementation((selector: any) => 
      selector ? selector({ accessToken: null }) : { accessToken: null }
    );

    const testRouter = createMemoryRouter(router.routes, {
      initialEntries: ["/portfolio"],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={testRouter} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Login Screen")).toBeInTheDocument();
    });
  });

  it("로그인 사용자는 포트폴리오(/portfolio)에 접근할 수 있다", async () => {
    (useAuthStore as any).mockImplementation((selector: any) => 
      selector ? selector({ accessToken: "valid-token" }) : { accessToken: "valid-token" }
    );

    const testRouter = createMemoryRouter(router.routes, {
      initialEntries: ["/portfolio"],
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={testRouter} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Portfolio Screen")).toBeInTheDocument();
    });
  });
});
