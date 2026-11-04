import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { discardActualSessionQueries, actualSession, isCurrentActualSession } from "@/api/actual-session";
import { actualQueryKeys } from "@/hooks/actual-query-policy";
import { useAuthStore } from "@/store/auth";

describe("actual private session", () => {
  it("requires an authenticated member before producing a session snapshot", () => {
    useAuthStore.getState().logout();
    expect(actualSession()).toBeNull();
  });

  it("qualifies actual list/detail keys by member, epoch and operation", () => {
    expect(actualQueryKeys.accounts(3, 4)).toEqual(["member", 3, 4, "ACTUAL", "accounts"]);
    expect(actualQueryKeys.account(3, 4, 99)).toEqual(["member", 3, 4, "ACTUAL", "account", 99]);
  });

  it("removes actual queries on session end without clearing simulation cache", () => {
    const client = new QueryClient();
    client.setQueryData(actualQueryKeys.accounts(3, 1), []);
    client.setQueryData(["portfolio", "summary", "3"], { total: 1 });
    discardActualSessionQueries(client);
    expect(client.getQueryData(actualQueryKeys.accounts(3, 1))).toBeUndefined();
    expect(client.getQueryData(["portfolio", "summary", "3"])).toEqual({ total: 1 });
  });

  it("rejects a captured session after the member changes", () => {
    useAuthStore.getState().setAuth({ memberId: 3, email: "a@test", nickname: "a", accessToken: "a", refreshToken: "r" });
    const captured = actualSession()!;
    useAuthStore.getState().setAuth({ memberId: 4, email: "b@test", nickname: "b", accessToken: "b", refreshToken: "s" });
    expect(isCurrentActualSession(captured)).toBe(false);
  });
});
