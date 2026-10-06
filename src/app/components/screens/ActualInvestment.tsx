import type { Account } from "@/types/actual";

export function ActualInvestment({ account }: { account?: Account }) {
  if (!account) return <section data-testid="actual-investment" className="page-shell page-content py-10">
    <div className="rounded-3xl border bg-card p-6 text-center">
      <p className="text-lg font-bold">실제 계정을 추가해 보세요</p>
      <p className="mt-2 text-sm text-muted-foreground">실제 계정의 이름과 증권사 메모를 관리할 수 있습니다.</p>
    </div>
  </section>;
  return <section data-testid="actual-investment" className="page-shell page-content space-y-4 py-6">
    <article className="rounded-3xl border bg-card p-6">
      <p className="text-xs text-muted-foreground">실제 계정 · 원화</p>
      <h1 className="mt-2 text-2xl font-bold">{account.name}</h1>
      {account.brokerLabel && <p className="mt-2 text-sm text-muted-foreground">{account.brokerLabel}</p>}
      <p className="mt-5 text-sm font-medium">기준 통화 · KRW (원)</p>
    </article>
    <p className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">거래 기록과 평가 기능은 준비 중입니다</p>
  </section>;
}
