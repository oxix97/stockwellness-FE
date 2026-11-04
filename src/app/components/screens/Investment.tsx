import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Portfolio } from "@/app/components/screens/Portfolio";
import { ActualInvestment } from "@/app/components/screens/ActualInvestment";
import { AccountSwitcher } from "@/app/components/actual/AccountSwitcher";
import { ActualAccountSheet } from "@/app/components/actual/ActualAccountSheet";
import { useActualAccounts, useActualAccount } from "@/hooks/use-actual-accounts";
import { useAuthStore } from "@/store/auth";
import { useInvestmentSelection, type InvestmentSelection } from "@/store/investment-selection";
import type { Account } from "@/types/actual";

export function Investment() {
  const memberId = useAuthStore((state) => state.memberId);
  const sessionEpoch = useAuthStore((state) => state.sessionEpoch);
  const legacyPortfolioId = useAuthStore((state) => state.portfolioId);
  const saved = useInvestmentSelection((state) => memberId ? state.byMember[String(memberId)] ?? null : null);
  const save = useInvestmentSelection((state) => state.select);
  const accounts = useActualAccounts();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Account | undefined>();
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [selection, setSelection] = useState<InvestmentSelection | null>(saved);
  const actualAccount = selection?.type === "ACTUAL" ? selection.id : undefined;
  const detail = useActualAccount(actualAccount);
  const listed = useMemo(() => accounts.data?.find((account) => account.accountId === actualAccount), [accounts.data, actualAccount]);

  useEffect(() => { setSelection(saved); }, [saved]);
  useEffect(() => {
    setEditorOpen(false);
    setEditing(undefined);
    setSelection(saved);
  }, [memberId, sessionEpoch]);
  const choose = (next: InvestmentSelection) => {
    const normalized = next.type === "SIMULATION" && next.id === "legacy" && legacyPortfolioId
      ? { type: "SIMULATION" as const, id: legacyPortfolioId } : next;
    setSelection(normalized);
    if (memberId) save(memberId, normalized);
  };
  const onSaved = (account: Account) => {
    if (!memberId) return;
    choose({ type: "ACTUAL", id: account.accountId });
  };

  useEffect(() => {
    if (selection?.type === "ACTUAL" && accounts.isSuccess && !listed) {
      if (memberId) save(memberId, null);
      setSelection(null);
    }
  }, [selection, accounts.isSuccess, listed, memberId, save]);
  useEffect(() => {
    if (selection?.type === "ACTUAL" && detail.isError && (detail.error as { response?: { status?: number } })?.response?.status === 404) {
      if (memberId) save(memberId, null);
      setSelection(null);
    }
  }, [selection, detail.isError, detail.error, memberId, save]);
  const selectedAccount = selection?.type === "ACTUAL" ? (detail.data ?? listed) : undefined;
  const isSimulation = selection?.type === "SIMULATION";

  return <main data-testid="investment-screen" className="min-h-full pb-10">
    <AccountSwitcher accounts={accounts.data ?? []} selection={selection} onSelect={choose}
      onCreate={(trigger) => { returnFocusRef.current = trigger; setEditing(undefined); setEditorOpen(true); }}
      onRename={(account, trigger) => { returnFocusRef.current = trigger; setEditing(account); setEditorOpen(true); }}
      hasSimulation={!!legacyPortfolioId} />
    {isSimulation && <Portfolio />}
    {!isSimulation && accounts.isLoading && <div role="status" className="page-shell page-content py-8 text-sm text-muted-foreground">실제 계정 불러오는 중…</div>}
    {!isSimulation && accounts.isError && <div role="alert" className="page-shell page-content py-6"><p>실제 계정 목록을 불러오지 못했습니다.</p><Button className="mt-3" onClick={() => void accounts.refetch()}>다시 시도</Button></div>}
    {!isSimulation && !accounts.isError && selection?.type === "ACTUAL" && detail.isLoading && <div role="status" className="page-shell page-content py-8 text-sm text-muted-foreground">계정 정보 확인 중…</div>}
    {!isSimulation && !accounts.isError && selection?.type === "ACTUAL" && detail.isError && (detail.error as { response?: { status?: number } })?.response?.status !== 404 && <div role="alert" className="page-shell page-content py-6"><p>계정 정보를 확인하지 못했습니다.</p><Button className="mt-3" onClick={() => void detail.refetch()}>다시 시도</Button></div>}
    {!isSimulation && !accounts.isError && selection?.type !== "ACTUAL" && <ActualInvestment />}
    {!isSimulation && !accounts.isError && selection?.type === "ACTUAL" && !detail.isError && !detail.isLoading && <ActualInvestment account={selectedAccount} />}
    <ActualAccountSheet open={editorOpen} onOpenChange={setEditorOpen} account={editing} returnFocusRef={returnFocusRef} onSaved={(account) => { onSaved(account); setEditing(undefined); }} />
  </main>;
}
