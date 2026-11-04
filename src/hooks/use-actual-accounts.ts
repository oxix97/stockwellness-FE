import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { actualAccountsApi } from "@/api/actual-accounts";
import { actualSession, isCurrentActualSession, type ActualSession } from "@/api/actual-session";
import { actualQueryKeys } from "@/hooks/actual-query-policy";
import type { Account, AccountCreate, AccountRename } from "@/types/actual";

type CreateDraft = { session: ActualSession; body: AccountCreate; key: string };
type RenameDraft = { session: ActualSession; accountId: number; body: AccountRename; key: string; ifMatch: string };

export const makeCreateDraft = (session: ActualSession, body: AccountCreate): CreateDraft => ({ session, body: { ...body }, key: crypto.randomUUID() });
export const makeRenameDraft = (session: ActualSession, accountId: number, body: AccountRename, accountVersion: number): RenameDraft => ({
  session, accountId, body: { ...body }, key: crypto.randomUUID(), ifMatch: `"${accountVersion}"`,
});

export function useActualAccounts() {
  const session = actualSession();
  return useQuery({
    queryKey: session ? actualQueryKeys.accounts(session.memberId, session.epoch) : [...actualQueryKeys.all, "disabled"],
    enabled: !!session,
    queryFn: async ({ signal }) => {
      const captured = session!;
      const result = await actualAccountsApi.list(signal);
      if (!isCurrentActualSession(captured)) throw new Error("Session changed");
      return result;
    },
  });
}

export function useActualAccount(accountId: number | undefined) {
  const session = actualSession();
  return useQuery({
    queryKey: session && accountId ? actualQueryKeys.account(session.memberId, session.epoch, accountId) : [...actualQueryKeys.all, "disabled-detail", accountId],
    enabled: !!session && Number.isSafeInteger(accountId) && (accountId ?? 0) > 0,
    queryFn: async ({ signal }) => {
      const captured = session!;
      const result = await actualAccountsApi.get(accountId!, signal);
      if (!isCurrentActualSession(captured)) throw new Error("Session changed");
      return result;
    },
  });
}

export function useCreateActualAccount() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (draft: CreateDraft): Promise<{ account: Account; session: ActualSession }> => {
      if (!isCurrentActualSession(draft.session)) throw new Error("Session changed");
      const account = await actualAccountsApi.create(draft.body, draft.key);
      if (!isCurrentActualSession(draft.session)) throw new Error("Session changed");
      return { account, session: draft.session };
    },
    onSuccess: async ({ session }) => {
      await client.invalidateQueries({ queryKey: actualQueryKeys.accounts(session.memberId, session.epoch), exact: true });
    },
  });
}

export function useRenameActualAccount() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (draft: RenameDraft): Promise<{ account: Account; session: ActualSession; accountId: number }> => {
      if (!isCurrentActualSession(draft.session)) throw new Error("Session changed");
      const account = await actualAccountsApi.rename(draft.accountId, draft.body, { key: draft.key, ifMatch: draft.ifMatch });
      if (!isCurrentActualSession(draft.session)) throw new Error("Session changed");
      return { account, session: draft.session, accountId: draft.accountId };
    },
    onSuccess: async ({ session, accountId }) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: actualQueryKeys.accounts(session.memberId, session.epoch), exact: true }),
        client.invalidateQueries({ queryKey: actualQueryKeys.account(session.memberId, session.epoch, accountId), exact: true }),
      ]);
    },
  });
}
