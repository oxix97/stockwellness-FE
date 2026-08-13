import { waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthCallbackHandler } from "../AuthCallbackHandler";
import { authApi } from "@/api/auth";
import { portfolioApi } from "@/api/portfolio";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { createTestQueryClient, renderWithQuery, setAuthState } from "@/test/test-utils";

vi.mock("@/api/auth", () => ({
  authApi: {
    exchange: vi.fn(),
  },
}));

vi.mock("@/api/portfolio", () => ({
  portfolioApi: {
    getMyPortfolios: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockExchange = authApi.exchange as ReturnType<typeof vi.fn>;
const mockGetMyPortfolios = portfolioApi.getMyPortfolios as ReturnType<typeof vi.fn>;

function LocationObserver({ onChange }: { onChange: (search: string) => void }) {
  const location = useLocation();
  onChange(location.search);
  return null;
}

describe("AuthCallbackHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.getState().logout();
    mockGetMyPortfolios.mockResolvedValue([]);
  });

  it("removes the one-time code from the callback URL before exchange succeeds", async () => {
    let currentSearch = "";
    let resolveExchange: (value: {
      memberId: number;
      email: string;
      nickname: string;
      accessToken: string;
      refreshToken: string;
      joinedDate: string;
    }) => void;
    mockExchange.mockReturnValue(new Promise((resolve) => {
      resolveExchange = resolve;
    }));

    renderWithQuery(
      <MemoryRouter initialEntries={["/auth/callback?code=opaque-code"]}>
        <LocationObserver onChange={(search) => { currentSearch = search; }} />
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(currentSearch).toBe(""));
    expect(useAuthStore.getState().memberId).toBeNull();

    resolveExchange!({
      memberId: 7,
      email: "member@example.com",
      nickname: "새 사용자",
      accessToken: "test-access-value",
      refreshToken: "test-refresh-value",
      joinedDate: "2026-08-10",
    });

    await waitFor(() => expect(useAuthStore.getState().memberId).toBe(7));
    expect(mockExchange).toHaveBeenCalledWith("opaque-code");
    expect(toast.success).toHaveBeenCalledWith("새 사용자님, 환영합니다!");
  });

  it("keeps authentication empty when the exchange fails", async () => {
    mockExchange.mockRejectedValue(new Error("expired code"));

    renderWithQuery(
      <MemoryRouter initialEntries={["/auth/callback?code=expired-code"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("로그인 처리에 실패했습니다. 다시 시도해주세요.");
      expect(mockNavigate).toHaveBeenCalledWith("/login", { replace: true });
    });
    expect(useAuthStore.getState().memberId).toBeNull();
  });

  it("clears the previous member cache and portfolio while switching OAuth members", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["watchlist", "groups"], [{ id: 11, name: "사용자 A" }]);
    queryClient.setQueryData(["portfolio", "101", "detail"], { id: 101, name: "사용자 A 포트폴리오" });
    setAuthState({ memberId: 1, portfolioId: "101" });
    mockExchange.mockResolvedValue({
      memberId: 2,
      email: "member-b@example.com",
      nickname: "사용자 B",
      accessToken: "member-b-access",
      refreshToken: "member-b-refresh",
      joinedDate: "2026-08-10",
    });

    let resolvePortfolios: (value: Array<{ id: number }>) => void;
    mockGetMyPortfolios.mockReturnValue(new Promise((resolve) => {
      resolvePortfolios = resolve;
    }));

    renderWithQuery(
      <MemoryRouter initialEntries={["/auth/callback?code=member-b-code"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
        </Routes>
      </MemoryRouter>,
      { queryClient },
    );

    await waitFor(() => expect(useAuthStore.getState().memberId).toBe(2));
    expect(queryClient.getQueryData(["watchlist", "groups"])).toBeUndefined();
    expect(queryClient.getQueryData(["portfolio", "101", "detail"])).toBeUndefined();
    expect(useAuthStore.getState().portfolioId).toBeNull();

    resolvePortfolios!([{ id: 202 }]);
    await waitFor(() => expect(useAuthStore.getState().portfolioId).toBe("202"));
  });
});
