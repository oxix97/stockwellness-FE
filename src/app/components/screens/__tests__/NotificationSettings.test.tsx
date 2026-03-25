import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithQuery, setAuthState, clearAuthState } from "@/test/test-utils";
import { makeNotificationSettings } from "@/test/fixtures";
import { NotificationSettings } from "../NotificationSettings";

// react-router navigate mock
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("@/hooks/use-member", () => ({
  useNotificationSettings: vi.fn(),
  useUpdateNotifications: vi.fn(),
}));

import { useNotificationSettings, useUpdateNotifications } from "@/hooks/use-member";

const mockUseNotificationSettings = useNotificationSettings as ReturnType<typeof vi.fn>;
const mockUseUpdateNotifications = useUpdateNotifications as ReturnType<typeof vi.fn>;

describe("NotificationSettings", () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState();
    mockUseUpdateNotifications.mockReturnValue({ mutateAsync: mockMutateAsync });
  });

  afterEach(() => {
    clearAuthState();
  });

  it("로딩 중 스켈레톤 렌더링", () => {
    mockUseNotificationSettings.mockReturnValue({ data: undefined, isLoading: true });

    renderWithQuery(<NotificationSettings />);

    // 스켈레톤 UI: animate-pulse 클래스를 가진 div
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("서버 설정 로드 후 스위치 표시", async () => {
    const settings = makeNotificationSettings({ rebalancing: true, marketAlert: false, newListing: true });
    mockUseNotificationSettings.mockReturnValue({ data: settings, isLoading: false });

    renderWithQuery(<NotificationSettings />);

    await waitFor(() => {
      expect(screen.getByText("AI 리밸런싱 알림")).toBeInTheDocument();
      expect(screen.getByText("시장 급변 알림")).toBeInTheDocument();
      expect(screen.getByText("신규 상장 알림")).toBeInTheDocument();
    });
  });

  it("토글 시 updateNotifications 호출", async () => {
    mockMutateAsync.mockResolvedValue(undefined);
    const settings = makeNotificationSettings({ rebalancing: true, marketAlert: false, newListing: true });
    mockUseNotificationSettings.mockReturnValue({ data: settings, isLoading: false });

    renderWithQuery(<NotificationSettings />);

    await waitFor(() => screen.getByText("시장 급변 알림"));

    // Switch 버튼 클릭 (role="switch")
    const switches = screen.getAllByRole("switch");
    // marketAlert (2번째 스위치, index 1) — false → true
    fireEvent.click(switches[1]);

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledWith({ marketAlert: true }));
  });

  it("토글 API 실패 시 설정 롤백 + toast 호출", async () => {
    mockMutateAsync.mockRejectedValue(new Error("서버 오류"));
    const settings = makeNotificationSettings({ rebalancing: true, marketAlert: false, newListing: true });
    mockUseNotificationSettings.mockReturnValue({ data: settings, isLoading: false });

    // toast mock
    const { toast } = await import("sonner");
    const toastErrorSpy = vi.spyOn(toast, "error");

    renderWithQuery(<NotificationSettings />);

    await waitFor(() => screen.getByText("AI 리밸런싱 알림"));

    const switches = screen.getAllByRole("switch");
    fireEvent.click(switches[0]); // rebalancing: true → false (실패)

    await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("설정 저장에 실패했습니다."));
  });
});
