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

// ── 훅 mocks ──────────────────────────────────────────────
const mockWithdrawMutate = vi.fn();
vi.mock("@/hooks/use-member", () => ({
  useWithdraw: () => ({ mutateAsync: mockWithdrawMutate }),
  useUpdateProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolio: () => ({ 
    holdings: { items: [] }, 
    valuation: { totalReturnRate: 0 }, 
    health: { overallScore: 0, radarData: [] } 
  }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme: vi.fn() }),
}));

describe("More — 로그아웃", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState();
  });

  afterEach(() => {
    clearAuthState();
  });

  it("로그아웃 버튼 클릭 시 스토어 logout 호출 후 /login 이동", async () => {
    const { useAuthStore } = await import("@/store/auth");
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");

    renderWithQuery(<More />);

    fireEvent.click(screen.getByText("로그아웃"));

    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
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

  it("탈퇴 성공 시 logout 호출 후 /login 이동", async () => {
    mockWithdrawMutate.mockResolvedValue(undefined);
    const { useAuthStore } = await import("@/store/auth");
    const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");

    renderWithQuery(<More />);

    // AlertDialog 트리거
    fireEvent.click(screen.getByText("회원 탈퇴"));
    // AlertDialog 확인 버튼
    await waitFor(() => screen.getByText("탈퇴하기"));
    fireEvent.click(screen.getByText("탈퇴하기"));

    await waitFor(() => expect(mockWithdrawMutate).toHaveBeenCalledTimes(1));
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("탈퇴 API 실패 시 toast.error 표시 + /login 미이동", async () => {
    mockWithdrawMutate.mockRejectedValue(new Error("서버 오류"));

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
