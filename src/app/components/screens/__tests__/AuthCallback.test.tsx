import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuthCallback } from "../AuthCallback";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

// Mocking dependencies
vi.mock("@/api/auth", () => ({
  authApi: {
    login: vi.fn(),
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

  it("should redirect to login if code is missing but state is valid", async () => {
    localStorage.setItem("oauth_state", "valid_state");
    render(
      <MemoryRouter initialEntries={["/auth/kakao/callback?state=valid_state"]}>
        <Routes>
          <Route path="/auth/:provider/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("인증 코드가 누락되었습니다.");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should fail security validation if state mismatch", async () => {
    localStorage.setItem("oauth_state", "correct_state");
    
    render(
      <MemoryRouter initialEntries={["/auth/kakao/callback?code=test_code&state=wrong_state"]}>
        <Routes>
          <Route path="/auth/:provider/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("보안 검증에 실패했습니다. 다시 시도해 주세요.");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should call login API and redirect to home on success", async () => {
    const mockResponse = {
      memberId: 1,
      email: "test@example.com",
      nickname: "Tester",
      accessToken: "access_token",
      refreshToken: "refresh_token",
    };
    (authApi.login as any).mockResolvedValue(mockResponse);
    
    localStorage.setItem("oauth_state", "valid_state");

    render(
      <MemoryRouter initialEntries={["/auth/kakao/callback?code=valid_code&state=valid_state"]}>
        <Routes>
          <Route path="/auth/:provider/callback" element={<AuthCallback />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        code: "valid_code",
        state: "valid_state",
        provider: "KAKAO",
      });
      expect(toast.success).toHaveBeenCalledWith("Tester님, 환영합니다!");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
