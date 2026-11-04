import type { QueryKey } from "@tanstack/react-query";

export const actualQueryKeys = {
  all: ["member", "ACTUAL"] as const,
  accounts: (memberId: number, epoch: number) => ["member", memberId, epoch, "ACTUAL", "accounts"] as const,
  account: (memberId: number, epoch: number, accountId: number) => ["member", memberId, epoch, "ACTUAL", "account", accountId] as const,
  isActual: (key: QueryKey) => key.includes("ACTUAL"),
};
