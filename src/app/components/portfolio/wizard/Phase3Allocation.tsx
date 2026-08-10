import { Slider, Progress } from "@/app/components/ui";
import { WizardState, WizardAction } from "./PortfolioWizard";
import { formatCurrency } from "@/utils/format";

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

/** Task #78 — 위저드 3단계: 비중 슬라이더 + 합계 검증 */
export function Phase3Allocation({ state, dispatch }: Props) {
  const total = state.assets.reduce((s, a) => s + a.targetWeight, 0);
  const isOver = total > 100;
  const isDone = total === 100;

  // 프로그레스 색상
  const progressColor = isDone ? "#2EBE7A" : isOver ? "#EF4444" : undefined;

  return (
    <div className="px-4 py-6 space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
        <p className="font-semibold">가상 포트폴리오</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          최신 종가를 기준으로 가상 수량과 매입 단가를 계산합니다.
        </p>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground block mb-2" htmlFor="simulated-total-amount">
          총 투자 금액
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₩</span>
          <input
            id="simulated-total-amount"
            type="number"
            min="1"
            value={state.totalAmount}
            onChange={(e) =>
              dispatch({ type: "SET_AMOUNT", payload: Number(e.target.value) || 0 })
            }
            className="w-full h-12 bg-secondary rounded-xl pl-8 pr-4 text-foreground outline-none text-[15px] tabular-nums focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* 합계 프로그레스 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-foreground">목표 비중 합계</span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: isDone ? "var(--primary)" : isOver ? "var(--destructive)" : undefined }}
          >
            {total}%
            {isDone && " ✓"}
            {isOver && " 초과!"}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: isOver ? "#FEE2E2" : undefined }}
        >
          <Progress
            value={Math.min(total, 100)}
            className="h-2"
            style={{ "--progress-indicator-color": progressColor } as React.CSSProperties}
          />
        </div>
        {isOver && (
          <p className="text-xs text-red-500 mt-1">합계가 100%를 초과했습니다. 비중을 조정해주세요.</p>
        )}
      </div>

      {/* 종목별 슬라이더 */}
      <div className="space-y-5">
        {state.assets.map((asset) => {
          const amount = Math.round((state.totalAmount * asset.targetWeight) / 100);

          return (
            <div key={asset.ticker}>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-foreground font-semibold text-sm">{asset.name}</p>
                  <p className="text-muted-foreground text-xs">{asset.ticker}</p>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-bold text-sm tabular-nums">
                    {asset.targetWeight}%
                  </p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    ₩{formatCurrency(amount)}
                  </p>
                </div>
              </div>
              <Slider
                value={[asset.targetWeight]}
                thumbAriaLabel={`${asset.name} 목표 비중`}
                aria-valuetext={`${asset.targetWeight}%`}
                onValueChange={([val]) =>
                  dispatch({ type: "SET_WEIGHT", payload: { ticker: asset.ticker, weight: val } })
                }
                min={0}
                max={100}
                step={1}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
