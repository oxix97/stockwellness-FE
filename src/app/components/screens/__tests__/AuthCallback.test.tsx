import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuthCallback } from "../AuthCallback";
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

describe("AuthCallback Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("should show error if accessToken or refreshToken is missing", async () => {
    render(
      <MemoryRouter initialEntries={["/auth/kakao/callback?accessToken=only_access"]}>
        <Routes>
          <Route path="/auth/:provider/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("인증 정보가 누락되었습니다. 다시 시도해주세요.");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should fail if token parsing fails", async () => {
    const { jwtDecode } = await import("jwt-decode");
    (jwtDecode as any).mockImplementationOnce(() => {
      throw new Error("Invalid token");
    });

    render(
      <MemoryRouter initialEntries={["/auth/kakao/callback?accessToken=bad&refreshToken=bad"]}>
        <Routes>
          <Route path="/auth/:provider/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("인증 처리 중 오류가 발생했습니다.");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should set auth and portfolio, then redirect to home on success", async () => {
    const mockPortfolios = [{ id: 10, name: "Main Portfolio" }];
    (portfolioApi.getMyPortfolios as any).mockResolvedValue(mockPortfolios);

    render(
      <MemoryRouter initialEntries={["/auth/kakao/callback?accessToken=valid_at&refreshToken=valid_rt"]}>
        <Routes>
          <Route path="/auth/:provider/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Auth Store check (indirectly via setAuth call if we had it mocked, 
      // but here we check derived state or just the side effects)
      expect(toast.success).toHaveBeenCalledWith("Tester님, 환영합니다!");
      expect(portfolioApi.getMyPortfolios).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
    
    // Check if portfolioId was set in the store
    expect(useAuthStore.getState().portfolioId).toBe("10");
  });
});
