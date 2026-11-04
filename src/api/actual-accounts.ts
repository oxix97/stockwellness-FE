import { apiClient } from "@/api/client";
import type { Account, AccountCreate, AccountList, AccountRename } from "@/types/actual";

const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER;

function validateAccount(account: Account): Account {
  if (!Number.isSafeInteger(account.accountId) || account.accountId < 1
    || !Number.isSafeInteger(account.accountVersion) || account.accountVersion < 0
    || !Number.isSafeInteger(account.ledgerVersion) || account.ledgerVersion < 0) {
    throw new Error("Actual account response is invalid.");
  }
  return account;
}

function validateAccountList(accounts: AccountList): AccountList {
  if (!Array.isArray(accounts)) throw new Error("Actual account response is invalid.");
  accounts.forEach(validateAccount);
  return accounts;
}

export const actualAccountsApi = {
  async list(signal?: AbortSignal): Promise<AccountList> {
    const accounts = await apiClient.get<AccountList>("/v1/investment-accounts", { signal });
    return validateAccountList(accounts);
  },

  async get(accountId: number, signal?: AbortSignal): Promise<Account> {
    if (!Number.isSafeInteger(accountId) || accountId < 1 || accountId > MAX_SAFE_INTEGER) {
      throw new Error("Actual account ID is invalid.");
    }
    return validateAccount(await apiClient.get<Account>(`/v1/investment-accounts/${accountId}`, { signal }));
  },

  async create(input: AccountCreate, key: string): Promise<Account> {
    return validateAccount(await apiClient.post<Account>("/v1/investment-accounts", input, {
      headers: { "Idempotency-Key": key },
    }));
  },

  async rename(accountId: number, input: AccountRename, headers: { key: string; ifMatch: string }): Promise<Account> {
    if (!Number.isSafeInteger(accountId) || accountId < 1 || accountId > MAX_SAFE_INTEGER) {
      throw new Error("Actual account ID is invalid.");
    }
    return validateAccount(await apiClient.patch<Account>(`/v1/investment-accounts/${accountId}`, input, {
      headers: { "Idempotency-Key": headers.key, "If-Match": headers.ifMatch },
    }));
  },
};
