import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithQuery, setAuthState, clearAuthState } from "@/test/test-utils";
import { More } from "../More";

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogoutMutate = vi.fn();
const mockWithdrawMutate = vi.fn();
vi.mock("@/hooks/use-auth", () => ({
  useLogout: () => ({ mutate: mockLogoutMutate, isPending: false }),
}));
vi.mock("@/hooks/use-member", () => ({
  useWithdraw: () => ({ mutateAsync: mockWithdrawMutate }),
  useUpdateProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/use-portfolio", () => ({
  usePortfolio: () => ({
    holdings: { items: [] },
    valuation: { totalReturnRate: 0 },
    health: { overallScore: 0, radarData: [] },
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

  it("logout mutation을 실행하고 완료 후 로그인 화면으로 이동한다", async () => {
    renderWithQuery(<More />);

    fireEvent.click(screen.getByText("로그아웃"));

    expect(mockLogoutMutate).toHaveBeenCalledTimes(1);
    const options = mockLogoutMutate.mock.calls[0][1] as { onSettled: () => void };
    options.onSettled();

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
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
    fireEvent.click(screen.getByText("회원 탈퇴"));
    await waitFor(() => screen.getByText("탈퇴하기"));
    fireEvent.click(screen.getByText("탈퇴하기"));

    await waitFor(() => expect(mockWithdrawMutate).toHaveBeenCalledTimes(1));
    expect(logoutSpy).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
