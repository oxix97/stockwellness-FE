import { WizardState, WizardAction } from "./PortfolioWizard";

const GOAL_OPTIONS = ["장기 성장", "안정 수익", "단기 트레이딩", "배당 수익"];

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

/** Task #76 — 위저드 1단계: 포트폴리오 이름 + 투자 목적 */
export function Phase1Goal({ state, dispatch }: Props) {
  return (
    <div className="px-4 py-6 space-y-6">
      <div>
        <label className="text-foreground font-semibold text-sm block mb-2">
          포트폴리오 이름 <span className="text-primary">*</span>
        </label>
        <input
          autoFocus
          value={state.portfolioName}
          onChange={(e) => dispatch({ type: "SET_NAME", payload: e.target.value })}
          maxLength={32}
          placeholder="예) 은퇴 준비 포트폴리오"
          className="w-full h-12 bg-secondary rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none text-[15px]"
        />
        {state.portfolioName.length >= 28 && (
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {state.portfolioName.length}/32
          </p>
        )}
      </div>

      <div>
        <label className="text-foreground font-semibold text-sm block mb-3">
          투자 목적 <span className="text-muted-foreground font-normal">(선택)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((goal) => {
            const selected = state.goals.includes(goal);
            return (
              <button
                key={goal}
                onClick={() => dispatch({ type: "TOGGLE_GOAL", payload: goal })}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  selected
                    ? "bg-primary text-white border-primary"
                    : "bg-secondary text-secondary-foreground border-border"
                }`}
              >
                {goal}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
