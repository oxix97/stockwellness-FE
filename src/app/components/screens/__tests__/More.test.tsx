import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithQuery, setAuthState, clearAuthState } from "@/test/test-utils";
import { More } from "../More";

// ── 라우터 ────────────────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── API mocks ─────────────────────────────────────────────
vi.mock("@/api/auth", () => ({
  authApi: {
    logout: vi.fn(),
  },
}));

vi.mock("@/api/member", () => ({
  memberApi: {
    withdraw: vi.fn(),
  },
}));

vi.mock("@/api/portfolio", () => ({
  portfolioApi: {
    deletePortfolio: vi.fn(),
  },
}));

// ── 훅 mocks ──────────────────────────────────────────────
vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolio: () => ({ 
    holdings: null, 
    valuation: null, 
    health: { overallScore: 0, radarData: [] } 
  }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme: vi.fn() }),
}));

import { authApi } from "@/api/auth";
import { memberApi } from "@/api/member";

const mockAuthLogout = authApi.logout as ReturnType<typeof vi.fn>;
const mockWithdraw = memberApi.withdraw as ReturnType<typeof vi.fn>;

describe("More — 로그아웃", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState();
  });

  afterEach(() => {
    clearAuthState();
  });

  it("로그아웃 버튼 클릭 시 authApi.logout() 호출", async () => {
    mockAuthLogout.mockResolvedValue(undefined);

    renderWithQuery(<More />);

    fireEvent.click(screen.getByText("로그아웃"));

    await waitFor(() => expect(mockAuthLogout).toHaveBeenCalledTimes(1));
  });

  it("로그아웃 성공 시 /login으로 이동", async () => {
    mockAuthLogout.mockResolvedValue(undefined);

    renderWithQuery(<More />);

    fireEvent.click(screen.getByText("로그아웃"));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
  });

  it("authApi.logout() 실패해도 로컬 상태 초기화 후 /login 이동", async () => {
    mockAuthLogout.mockRejectedValue(new Error("네트워크 오류"));

    renderWithQuery(<More />);

    fireEvent.click(screen.getByText("로그아웃"));

    // API 실패해도 navigate 호출
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));

    // Zustand 스토어 초기화 확인
    const { useAuthStore } = await import("@/store/auth");
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("로그아웃 중 버튼 비활성화 (로딩 상태)", async () => {
    // 느린 API 시뮬레이션
    mockAuthLogout.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );

    renderWithQuery(<More />);

    fireEvent.click(screen.getByText("로그아웃"));

    // 로딩 중 텍스트 표시
    await waitFor(() =>
      expect(screen.getByText("로그아웃 중...")).toBeInTheDocument()
    );

    const btn = screen.getByText("로그아웃 중...").closest("button");
    expect(btn).toBeDisabled();
  });
});

describe("More — 회원 탈퇴", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState();
  });

  afterEach(() => {
    clearAuthState();
  });

  it("탈퇴 성공 시 authApi.logout() 호출 후 /login 이동", async () => {
    mockWithdraw.mockResolvedValue(undefined);
    mockAuthLogout.mockResolvedValue(undefined);

    renderWithQuery(<More />);

    // AlertDialog 트리거
    fireEvent.click(screen.getByText("회원 탈퇴"));
    // AlertDialog 확인 버튼
    await waitFor(() => screen.getByText("탈퇴하기"));
    fireEvent.click(screen.getByText("탈퇴하기"));

    await waitFor(() => expect(mockWithdraw).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockAuthLogout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
  });

  it("탈퇴 후 authApi.logout() 실패해도 로컬 상태 초기화 후 /login 이동", async () => {
    mockWithdraw.mockResolvedValue(undefined);
    mockAuthLogout.mockRejectedValue(new Error("이미 삭제된 회원"));

    renderWithQuery(<More />);

    fireEvent.click(screen.getByText("회원 탈퇴"));
    await waitFor(() => screen.getByText("탈퇴하기"));
    fireEvent.click(screen.getByText("탈퇴하기"));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));

    const { useAuthStore } = await import("@/store/auth");
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it("탈퇴 API 실패 시 toast.error 표시 + /login 미이동", async () => {
    mockWithdraw.mockRejectedValue(new Error("서버 오류"));

    const { toast } = await import("sonner");
    const toastErrorSpy = vi.spyOn(toast, "error");

    renderWithQuery(<More />);

    fireEvent.click(screen.getByText("회원 탈퇴"));
    await waitFor(() => screen.getByText("탈퇴하기"));
    fireEvent.click(screen.getByText("탈퇴하기"));

    await waitFor(() =>
      expect(toastErrorSpy).toHaveBeenCalledWith("탈퇴에 실패했습니다. 다시 시도해주세요.")
    );
    expect(mockNavigate).not.toHaveBeenCalledWith("/login");
  });
});
