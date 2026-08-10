import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authApi } from "@/api/auth";
import { useLogout } from "../use-auth";
import { createTestQueryClient, renderHookWithQuery, setAuthState } from "@/test/test-utils";
import { useAuthStore } from "@/store/auth";

vi.mock("@/api/auth", () => ({
  authApi: {
    logout: vi.fn(),
  },
}));

const mockLogout = authApi.logout as ReturnType<typeof vi.fn>;

describe("useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it("clears the authenticated state and every cached query after server logout succeeds", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["member", "me", 1], { nickname: "사용자 A" });
    setAuthState({ memberId: 1 });
    mockLogout.mockResolvedValue(undefined);

    const { result } = renderHookWithQuery(() => useLogout(), { queryClient });
    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().memberId).toBeNull();
    expect(queryClient.getQueryData(["member", "me", 1])).toBeUndefined();
  });

  it("clears the authenticated state and every cached query after server logout fails", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(["member", "me", 1], { nickname: "사용자 A" });
    setAuthState({ memberId: 1 });
    mockLogout.mockRejectedValue(new Error("network error"));

    const { result } = renderHookWithQuery(() => useLogout(), { queryClient });
    await act(async () => {
      await expect(result.current.mutateAsync()).rejects.toThrow("network error");
    });

    await waitFor(() => expect(useAuthStore.getState().memberId).toBeNull());
    expect(queryClient.getQueryData(["member", "me", 1])).toBeUndefined();
  });
});
