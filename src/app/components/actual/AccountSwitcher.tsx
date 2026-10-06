import type { Account } from "@/types/actual";
import type { InvestmentSelection } from "@/store/investment-selection";
import { Button } from "@/app/components/ui/button";

interface Props {
  accounts: Account[];
  selection: InvestmentSelection | null;
  onSelect: (selection: InvestmentSelection) => void;
  onCreate: (trigger: HTMLButtonElement) => void;
  onRename: (account: Account, trigger: HTMLButtonElement) => void;
  hasSimulation: boolean;
}

export function AccountSwitcher({ accounts, selection, onSelect, onCreate, onRename, hasSimulation }: Props) {
  const selectedName = selection?.type === "ACTUAL"
    ? accounts.find((account) => account.accountId === selection.id)?.name ?? "실제 계정"
    : selection?.type === "SIMULATION" ? "가상 포트폴리오" : "계정 선택";
  return <section aria-label="계정 선택" className="page-shell page-content pt-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
      <div><p className="text-xs text-muted-foreground">현재 선택</p><p className="font-semibold">{selection?.type === "ACTUAL" ? "실제 계정" : selection?.type === "SIMULATION" ? "가상 포트폴리오" : "계정 선택"} · {selectedName}</p></div>
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => <Button className="min-h-11" key={account.accountId} size="sm" variant={selection?.type === "ACTUAL" && selection.id === account.accountId ? "default" : "outline"} onClick={() => onSelect({ type: "ACTUAL", id: account.accountId })}>{account.name}</Button>)}
        {accounts.some((account) => selection?.type === "ACTUAL" && selection.id === account.accountId) && <Button className="min-h-11" size="sm" variant="ghost" onClick={(event) => onRename(accounts.find((account) => account.accountId === selection!.id)!, event.currentTarget)}>이름 변경</Button>}
        <Button className="min-h-11" size="sm" variant="outline" onClick={(event) => onCreate(event.currentTarget)}>실제 계정 추가</Button>
        {hasSimulation && <Button className="min-h-11" size="sm" variant={selection?.type === "SIMULATION" ? "default" : "outline"} onClick={() => onSelect({ type: "SIMULATION", id: "legacy" })}>가상 포트폴리오</Button>}
      </div>
    </div>
  </section>;
}
