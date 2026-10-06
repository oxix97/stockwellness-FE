import { useEffect, useState, type RefObject } from "react";
import { X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { actualSession } from "@/api/actual-session";
import { actualQueryKeys } from "@/hooks/actual-query-policy";
import { useActualAccount, useCreateActualAccount, useRenameActualAccount, makeCreateDraft, makeRenameDraft } from "@/hooks/use-actual-accounts";
import type { Account } from "@/types/actual";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: Account;
  onSaved?: (account: Account) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}

// Java ActualAccountRules: Character.isWhitespace plus NBSP, figure space, and narrow NBSP.
const WHITE_SPACE = /[\u0009-\u000D\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/u;
export function normalizeAccountText(value: string): string {
  const points = Array.from(value);
  let start = 0, end = points.length;
  while (start < end && WHITE_SPACE.test(points[start])) start++;
  while (end > start && WHITE_SPACE.test(points[end - 1])) end--;
  return points.slice(start, end).join("");
}

export function validateAccountInput(name: string, broker: string): { name: string; brokerLabel: string | null } | { error: string } {
  const cleanName = normalizeAccountText(name);
  const cleanBroker = normalizeAccountText(broker);
  if (!cleanName || Array.from(cleanName).length > 50) return { error: "계정 이름은 공백 제외 1~50자로 입력해 주세요." };
  if (Array.from(cleanBroker).length > 100) return { error: "증권사 메모는 100자 이내로 입력해 주세요." };
  return { name: cleanName, brokerLabel: cleanBroker || null };
}

export function safeAccountErrorMessage(error: unknown): string {
  const code = (error as { response?: { data?: { code?: string } } })?.response?.data?.code;
  if (code === "I001") return "계정 정보가 변경되었습니다. 최신 정보를 확인한 뒤 다시 저장해 주세요.";
  if (code === "I002") return "요청이 처리되지 않았습니다. 잠시 후 다시 시도해 주세요.";
  if (code === "I008") return "계정 변경을 완료하지 못했습니다. 입력을 확인해 주세요.";
  if (code === "G001") return "입력한 내용을 확인해 주세요.";
  if (code === "G003" || (error as { response?: { status?: number } })?.response?.status === 404) return "계정을 찾을 수 없습니다. 계정 목록을 새로고침해 주세요.";
  return "계정 정보를 저장하지 못했습니다. 같은 요청으로 다시 시도해 주세요.";
}

export function ActualAccountSheet({ open, onOpenChange, account, onSaved, returnFocusRef }: Props) {
  const client = useQueryClient();
  const create = useCreateActualAccount();
  const rename = useRenameActualAccount();
  const latest = useActualAccount(account?.accountId);
  const [name, setName] = useState(account?.name ?? "");
  const [broker, setBroker] = useState(account?.brokerLabel ?? "");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<ReturnType<typeof makeCreateDraft> | ReturnType<typeof makeRenameDraft> | null>(null);
  const [conflict, setConflict] = useState(false);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setName(account?.name ?? ""); setBroker(account?.brokerLabel ?? "");
    setError(""); setLocalError(""); setDraft(null); setConflict(false);
  }, [open, account?.accountId]);
  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => returnFocusRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [open, returnFocusRef]);

  const isPending = create.isPending || rename.isPending;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isPending || conflict) return;
    const validated = validateAccountInput(name, broker);
    if ("error" in validated) { setLocalError(validated.error); return; }
    setLocalError("");
    const session = actualSession();
    if (!session) { setError("로그인이 만료되었습니다. 다시 로그인해 주세요."); return; }
    let nextDraft = draft;
    if (!nextDraft) {
      nextDraft = account
        ? makeRenameDraft(session, account.accountId, { name: validated.name }, latest.data?.accountVersion ?? account.accountVersion)
        : makeCreateDraft(session, { name: validated.name, baseCurrency: "KRW", brokerLabel: validated.brokerLabel });
      setDraft(nextDraft);
    }
    try {
      const result = "accountId" in nextDraft
        ? await rename.mutateAsync(nextDraft)
        : await create.mutateAsync(nextDraft);
      const saved = result.account;
      setDraft(null);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (failure) {
      const code = (failure as { response?: { data?: { code?: string } } })?.response?.data?.code;
      setError(safeAccountErrorMessage(failure));
      if (code === "I001" && account) {
        await Promise.all([
          client.invalidateQueries({ queryKey: actualQueryKeys.account(session.memberId, session.epoch, account.accountId) }),
          client.invalidateQueries({ queryKey: actualQueryKeys.accounts(session.memberId, session.epoch) }),
        ]);
        setConflict(true);
      }
    }
  };

  return <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent className="max-h-[90vh] pb-[env(safe-area-inset-bottom)]">
      <DrawerHeader className="relative border-b">
        <DrawerTitle>{account ? "실제 계정 이름 변경" : "실제 계정 추가"}</DrawerTitle>
        <DrawerDescription>원화 계정의 이름과 선택적 증권사 메모를 관리합니다.</DrawerDescription>
        <DrawerClose asChild><Button type="button" variant="ghost" size="icon" aria-label="닫기" className="absolute right-3 top-3 min-h-11 min-w-11"><X className="h-4 w-4" /></Button></DrawerClose>
      </DrawerHeader>
      <form onSubmit={submit} className="space-y-5 overflow-y-auto p-5">
        <div className="space-y-2"><Label htmlFor="actual-account-name">계정 이름</Label>
          <Input id="actual-account-name" value={name} onChange={(e) => setName(e.target.value)} aria-describedby="actual-account-name-help" autoComplete="off" className="h-11" disabled={isPending || (!!draft && !!error)} />
          <p id="actual-account-name-help" className="text-xs text-muted-foreground">최대 50자</p>
        </div>
        {!account && <div className="space-y-2"><Label htmlFor="actual-account-broker">증권사 메모 (선택)</Label>
          <Input id="actual-account-broker" value={broker} onChange={(e) => setBroker(e.target.value)} aria-describedby="actual-account-broker-help" autoComplete="off" className="h-11" disabled={isPending || (!!draft && !!error)} />
          <p id="actual-account-broker-help" className="text-xs text-muted-foreground">최대 100자</p>
        </div>}
        {(localError || error) && <p role="alert" className="text-sm text-destructive">{localError || error}</p>}
        {conflict && <div className="space-y-2 rounded-md border p-3 text-sm" role="status">
          <p>최신 계정 이름: {latest.data?.name ?? "확인 중"}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => { setDraft(null); setConflict(false); setError(""); }}>최신 정보로 다시 저장</Button>
        </div>}
        <DrawerFooter className="px-0 pb-0"><Button type="submit" className="min-h-11" disabled={isPending || conflict}>{isPending ? "저장 중…" : error && !conflict ? "같은 요청으로 다시 시도" : "저장"}</Button></DrawerFooter>
      </form>
    </DrawerContent>
  </Drawer>;
}
