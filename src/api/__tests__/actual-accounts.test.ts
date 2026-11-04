import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClient = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));
vi.mock("@/api/client", () => ({ apiClient }));

import { actualAccountsApi } from "@/api/actual-accounts";
import type { Account, AccountCreate } from "@/types/actual";

const account: Account = {
  accountId: 24,
  accountType: "ACTUAL",
  name: "장기 투자",
  brokerLabel: "예시 증권",
  baseCurrency: "KRW",
  accountVersion: 7,
  ledgerVersion: 0,
};

describe("actualAccountsApi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses account list and detail paths with AbortSignal", async () => {
    const controller = new AbortController();
    apiClient.get.mockResolvedValueOnce([account]).mockResolvedValueOnce(account);

    await expect(actualAccountsApi.list(controller.signal)).resolves.toEqual([account]);
    await expect(actualAccountsApi.get(24, controller.signal)).resolves.toEqual(account);

    expect(apiClient.get).toHaveBeenNthCalledWith(1, "/v1/investment-accounts", { signal: controller.signal });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, "/v1/investment-accounts/24", { signal: controller.signal });
  });

  it("sends nullable broker label and one create key", async () => {
    const input: AccountCreate = { name: "장기 투자", baseCurrency: "KRW", brokerLabel: null };
    apiClient.post.mockResolvedValue(account);

    await expect(actualAccountsApi.create(input, "create-account-key-001")).resolves.toEqual(account);

    expect(apiClient.post).toHaveBeenCalledOnce();
    expect(apiClient.post).toHaveBeenCalledWith("/v1/investment-accounts", input, {
      headers: { "Idempotency-Key": "create-account-key-001" },
    });
  });

  it("sends quoted accountVersion and one rename key", async () => {
    apiClient.patch.mockResolvedValue({ ...account, name: "은퇴 계정", accountVersion: 8 });

    await expect(actualAccountsApi.rename(24, { name: "은퇴 계정" }, {
      key: "rename-account-key-001",
      ifMatch: '"7"',
    })).resolves.toMatchObject({ accountVersion: 8 });

    expect(apiClient.patch).toHaveBeenCalledOnce();
    expect(apiClient.patch).toHaveBeenCalledWith("/v1/investment-accounts/24", { name: "은퇴 계정" }, {
      headers: { "Idempotency-Key": "rename-account-key-001", "If-Match": '"7"' },
    });
  });

  it("rejects unsafe account IDs and versions", async () => {
    apiClient.get
      .mockResolvedValueOnce([{ ...account, accountId: Number.MAX_SAFE_INTEGER + 1 }])
      .mockResolvedValueOnce({ ...account, accountVersion: -1 });

    await expect(actualAccountsApi.list()).rejects.toThrow();
    await expect(actualAccountsApi.get(24)).rejects.toThrow();
  });
});
