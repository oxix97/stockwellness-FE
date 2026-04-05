import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor, act } from "@testing-library/react";
import { renderHookWithQuery, setAuthState, clearAuthState } from "@/test/test-utils";
import { makeNotificationSettings } from "@/test/fixtures";
import { useMe, useNotificationSettings, useUpdateNotifications } from "../use-member";

vi.mock("@/api/member", () => ({
  memberApi: {
    getMe: vi.fn(),
    getNotifications: vi.fn(),
    updateNotifications: vi.fn(),
  },
  NotificationSettings: undefined,
}));

import { memberApi } from "@/api/member";

const mockApi = memberApi as unknown as {
  getMe: ReturnType<typeof vi.fn>;
  getNotifications: ReturnType<typeof vi.fn>;
  updateNotifications: ReturnType<typeof vi.fn>;
};

describe("useMe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearAuthState();
  });

  it("accessToken 없으면 쿼리 비활성화", () => {
    // clearAuthState 후 기본값
    const { result } = renderHookWithQuery(() => useMe());
    expect(result.current.data).toBeUndefined();
    expect(mockApi.getMe).not.toHaveBeenCalled();
  });

  it("accessToken 있으면 /me 조회 (스토어 업데이트는 하지 않음)", async () => {
    const profile = {
      id: 1,
      email: "test@example.com",
      nickname: "홍길동",
      riskLevel: "MEDIUM" as const,
      status: "ACTIVE" as const,
      createdAt: "2026-01-01T00:00:00",
    };
    mockApi.getMe.mockResolvedValue(profile);
    setAuthState({ nickname: "기존닉네임" });

    const { result } = renderHookWithQuery(() => useMe());

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.nickname).toBe("홍길동");

    const { useAuthStore } = await import("@/store/auth");
    // queryFn 내부 부수효과 제거 확인
    expect(useAuthStore.getState().nickname).toBe("기존닉네임");
  });

  it("API 오류 시 isError true", async () => {
    mockApi.getMe.mockRejectedValue(new Error("인증 오류"));
    setAuthState();

    const { result } = renderHookWithQuery(() => useMe());

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useNotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearAuthState();
  });

  it("accessToken 없으면 쿼리 비활성화", () => {
    const { result } = renderHookWithQuery(() => useNotificationSettings());
    expect(result.current.data).toBeUndefined();
    expect(mockApi.getNotifications).not.toHaveBeenCalled();
  });

  it("accessToken 있으면 알림 설정 조회", async () => {
    const settings = makeNotificationSettings();
    mockApi.getNotifications.mockResolvedValue(settings);
    setAuthState();

    const { result } = renderHookWithQuery(() => useNotificationSettings());

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.rebalancing).toBe(true);
    expect(result.current.data!.marketAlert).toBe(false);
  });
});

describe("useUpdateNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthState();
  });

  afterEach(() => {
    clearAuthState();
  });

  it("성공 시 notifications 쿼리 무효화 → 재조회", async () => {
    const initial = makeNotificationSettings({ rebalancing: false });
    const updated = makeNotificationSettings({ rebalancing: true });
    mockApi.getNotifications.mockResolvedValueOnce(initial).mockResolvedValueOnce(updated);
    mockApi.updateNotifications.mockResolvedValue(undefined);

    const { result } = renderHookWithQuery(() => ({
      settings: useNotificationSettings(),
      update: useUpdateNotifications(),
    }));

    await waitFor(() => expect(result.current.settings.data?.rebalancing).toBe(false));

    act(() => {
      result.current.update.mutate({ rebalancing: true });
    });

    await waitFor(() => expect(result.current.settings.data?.rebalancing).toBe(true));
    expect(mockApi.updateNotifications).toHaveBeenCalledWith({ rebalancing: true });
  });

  it("API 오류 시 isError true", async () => {
    mockApi.updateNotifications.mockRejectedValue(new Error("서버 오류"));

    const { result } = renderHookWithQuery(() => useUpdateNotifications());

    act(() => {
      result.current.mutate({ marketAlert: true });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
