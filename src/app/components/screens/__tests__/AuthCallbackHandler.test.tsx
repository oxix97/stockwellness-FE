import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuthCallbackHandler } from "../AuthCallbackHandler";
import { portfolioApi } from "@/api/portfolio";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";

// Mocking dependencies
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

// jwt-decode 모킹
vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(() => ({
    sub: "1",
    email: "test@example.com",
    nickname: "Tester",
  })),
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("AuthCallbackHandler Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should show error if both accessToken and token are missing", async () => {
    render(
      <MemoryRouter initialEntries={["/auth/callback?refreshToken=rt"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("인증 정보가 누락되었습니다. 다시 시도해주세요.");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should succeed with 'token' parameter instead of 'accessToken'", async () => {
    (portfolioApi.getMyPortfolios as any).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/auth/callback?token=valid_token"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Tester님, 환영합니다!");
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
    
    // Check if accessToken was set in the store correctly from 'token' param
    expect(useAuthStore.getState().accessToken).toBe("valid_token");
  });

  it("should set auth and portfolio, then redirect to home on success with accessToken", async () => {
    const mockPortfolios = [{ id: 10, name: "Main Portfolio" }];
    (portfolioApi.getMyPortfolios as any).mockResolvedValue(mockPortfolios);

    render(
      <MemoryRouter initialEntries={["/auth/callback?accessToken=valid_at&refreshToken=valid_rt"]}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallbackHandler />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Tester님, 환영합니다!");
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
    
    expect(useAuthStore.getState().portfolioId).toBe("10");
    expect(useAuthStore.getState().accessToken).toBe("valid_at");
  });
});
