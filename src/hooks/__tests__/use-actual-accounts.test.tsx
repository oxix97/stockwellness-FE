import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { actualAccountsApi } from "@/api/actual-accounts";
import { useAuthStore } from "@/store/auth";
import { createTestQueryClient, renderHookWithQuery } from "@/test/test-utils";
import { actualQueryKeys } from "@/hooks/actual-query-policy";
import { makeCreateDraft, makeRenameDraft, useActualAccounts, useCreateActualAccount, useRenameActualAccount } from "@/hooks/use-actual-accounts";

vi.mock("@/api/actual-accounts", () => ({ actualAccountsApi: { list: vi.fn(), get: vi.fn(), create: vi.fn(), rename: vi.fn() } }));
const api = actualAccountsApi as unknown as { list: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; rename: ReturnType<typeof vi.fn> };
const row = { accountId: 5, accountType: "ACTUAL" as const, name: "계좌", brokerLabel: null, baseCurrency: "KRW" as const, accountVersion: 2, ledgerVersion: 0 };

function signIn(memberId = 1) {
  useAuthStore.getState().setAuth({ memberId, email: `${memberId}@example.test`, nickname: "테스트", accessToken: "token", refreshToken: "refresh" });
}

describe("actual account hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().logout();
  });

  it("disables actual list without an authenticated member", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHookWithQuery(() => useActualAccounts(), { queryClient });
    expect(result.current.fetchStatus).toBe("idle");
    expect(api.list).not.toHaveBeenCalled();
  });

  it("ignores a list response after member switch", async () => {
    signIn(1);
    const firstEpoch = useAuthStore.getState().sessionEpoch;
    const resolves: Array<(rows: typeof row[]) => void> = [];
    api.list.mockImplementation(() => new Promise((done) => { resolves.push(done); }));
    const queryClient = createTestQueryClient();
    const { result, rerender } = renderHookWithQuery(() => useActualAccounts(), { queryClient });
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(1));
    signIn(2);
    const secondEpoch = useAuthStore.getState().sessionEpoch;
    rerender();
    await act(async () => resolves[0]([row]));
    expect(queryClient.getQueryData(actualQueryKeys.accounts(1, firstEpoch))).toBeUndefined();
    expect(queryClient.getQueryData(actualQueryKeys.accounts(2, secondEpoch))).toBeUndefined();
    expect(result.current.data).toBeUndefined();
  });

  it("does not retry account writes automatically and reuses one create draft after an uncertain failure", async () => {
    signIn();
    api.create.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(row);
    const { result } = renderHookWithQuery(() => useCreateActualAccount());
    const draft = makeCreateDraft({ memberId: 1, epoch: useAuthStore.getState().sessionEpoch }, { name: "계좌", baseCurrency: "KRW", brokerLabel: null });
    await act(async () => { await expect(result.current.mutateAsync(draft)).rejects.toThrow("network"); });
    expect(api.create).toHaveBeenCalledTimes(1);
    await act(async () => { await result.current.mutateAsync(draft); });
    expect(api.create).toHaveBeenNthCalledWith(1, draft.body, draft.key);
    expect(api.create).toHaveBeenNthCalledWith(2, draft.body, draft.key);
  });

  it("reuses original rename body key and If-Match after failure", async () => {
    signIn();
    api.rename.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(row);
    const { result } = renderHookWithQuery(() => useRenameActualAccount());
    const draft = makeRenameDraft({ memberId: 1, epoch: useAuthStore.getState().sessionEpoch }, 5, { name: "새 이름" }, 2);
    await act(async () => { await expect(result.current.mutateAsync(draft)).rejects.toThrow("network"); });
    await act(async () => { await result.current.mutateAsync(draft); });
    expect(api.rename).toHaveBeenNthCalledWith(1, 5, { name: "새 이름" }, { key: draft.key, ifMatch: '"2"' });
    expect(api.rename).toHaveBeenNthCalledWith(2, 5, { name: "새 이름" }, { key: draft.key, ifMatch: '"2"' });
  });

  it("does not let a late mutation update a new member session", async () => {
    signIn(1);
    let resolve!: (value: typeof row) => void;
    api.create.mockImplementation(() => new Promise((done) => { resolve = done; }));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(actualQueryKeys.accounts(2, 2), [{ ...row, name: "B account" }]);
    const { result } = renderHookWithQuery(() => useCreateActualAccount(), { queryClient });
    const draft = makeCreateDraft({ memberId: 1, epoch: useAuthStore.getState().sessionEpoch }, { name: "계좌", baseCurrency: "KRW", brokerLabel: null });
    let task!: Promise<unknown>;
    act(() => { task = result.current.mutateAsync(draft); });
    await waitFor(() => expect(api.create).toHaveBeenCalledTimes(1));
    const rejection = expect(task).rejects.toThrow("Session changed");
    signIn(2);
    await act(async () => resolve(row));
    await rejection;
    expect(queryClient.getQueryData(actualQueryKeys.accounts(2, 2))).toEqual([{ ...row, name: "B account" }]);
  });
});
