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
      {/* 입력 모드 토글 */}
      <div className="flex bg-secondary rounded-xl p-1">
        {(["simulation", "actual"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => dispatch({ type: "SET_MODE", payload: mode })}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              state.mode === mode
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            {mode === "simulation" ? "간편 시뮬레이션" : "실제 계좌"}
          </button>
        ))}
      </div>

      {/* 총 투자 금액 (간편 모드) */}
      {state.mode === "simulation" && (
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">총 투자 금액</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₩</span>
            <input
              type="number"
              value={state.totalAmount}
              onChange={(e) =>
                dispatch({ type: "SET_AMOUNT", payload: Number(e.target.value) || 0 })
              }
              className="w-full h-12 bg-secondary rounded-xl pl-8 pr-4 text-foreground outline-none text-[15px] tabular-nums"
            />
          </div>
        </div>
      )}

      {/* 합계 프로그레스 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-foreground">목표 비중 합계</span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: isDone ? "#2EBE7A" : isOver ? "#EF4444" : undefined }}
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
          const amount =
            state.mode === "simulation"
              ? Math.round((state.totalAmount * asset.targetWeight) / 100)
              : null;

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
                  {amount !== null && (
                    <p className="text-muted-foreground text-xs tabular-nums">
                      ₩{formatCurrency(amount)}
                    </p>
                  )}
                </div>
              </div>
              <Slider
                value={[asset.targetWeight]}
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
