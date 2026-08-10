import { useReducer, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Phase1Goal } from "./Phase1Goal";
import { Phase2Assets } from "./Phase2Assets";
import { Phase3Allocation } from "./Phase3Allocation";
import { Phase4Result } from "./Phase4Result";
import { useCreateSimulatedPortfolio } from "@/hooks/use-portfolio";

// ── 위저드 상태 타입 ─────────────────────────────────────
export interface AssetItem {
  ticker: string;
  name: string;
  marketType: string;
  targetWeight: number; // 0~100
}

export interface WizardState {
  step: 1 | 2 | 3 | 4;
  direction: 1 | -1;
  // Phase 1
  portfolioName: string;
  goals: string[];
  // Phase 2
  assets: AssetItem[];
  // Phase 3
  totalAmount: number;
  // Phase 4
  createdPortfolioId: string | null;
  createdAsOfDate: string | null;
}

export type WizardAction =
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SET_NAME"; payload: string }
  | { type: "TOGGLE_GOAL"; payload: string }
  | { type: "SET_ASSETS"; payload: AssetItem[] }
  | { type: "SET_AMOUNT"; payload: number }
  | { type: "SET_WEIGHT"; payload: { ticker: string; weight: number } }
  | { type: "SET_CREATED_RESULT"; payload: { portfolioId: string; asOfDate: string } };

const initialState: WizardState = {
  step: 1,
  direction: 1,
  portfolioName: "",
  goals: [],
  assets: [],
  totalAmount: 10_000_000,
  createdPortfolioId: null,
  createdAsOfDate: null,
};

const SUPPORTED_MARKETS = new Set(["KOSPI", "KOSDAQ"]);

export function isKrwMarket(marketType: string | undefined): boolean {
  return marketType !== undefined && SUPPORTED_MARKETS.has(marketType);
}

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "NEXT":
      return { ...state, step: Math.min(state.step + 1, 4) as WizardState["step"], direction: 1 };
    case "PREV":
      return { ...state, step: Math.max(state.step - 1, 1) as WizardState["step"], direction: -1 };
    case "SET_NAME":
      return { ...state, portfolioName: action.payload };
    case "TOGGLE_GOAL":
      return {
        ...state,
        goals: state.goals.includes(action.payload)
          ? state.goals.filter((g) => g !== action.payload)
          : [...state.goals, action.payload],
      };
    case "SET_ASSETS":
      return { ...state, assets: action.payload };
    case "SET_AMOUNT":
      return { ...state, totalAmount: action.payload };
    case "SET_WEIGHT":
      return {
        ...state,
        assets: state.assets.map((a) =>
          a.ticker === action.payload.ticker ? { ...a, targetWeight: action.payload.weight } : a
        ),
      };
    case "SET_CREATED_RESULT":
      return {
        ...state,
        createdPortfolioId: action.payload.portfolioId,
        createdAsOfDate: action.payload.asOfDate,
      };
    default:
      return state;
  }
}

// ── 단계별 다음 버튼 활성 조건 ───────────────────────────
export function canProceed(state: WizardState): boolean {
  if (state.step === 1) return state.portfolioName.trim().length > 0;
  if (state.step === 2) {
    return state.assets.length > 0 && state.assets.every((asset) => isKrwMarket(asset.marketType));
  }
  if (state.step === 3) {
    const total = state.assets.reduce((s, a) => s + a.targetWeight, 0);
    return (
      state.totalAmount > 0 &&
      Number.isFinite(state.totalAmount) &&
      total === 100 &&
      state.assets.length > 0 &&
      state.assets.every((asset) => isKrwMarket(asset.marketType))
    );
  }
  return true;
}

const STEP_LABELS = ["목표 설정", "자산 담기", "비중 설정", "완료"];

/**
 * Task #75 — 포트폴리오 생성 위저드 쉘
 */
export function PortfolioWizard({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const createSimulatedPortfolio = useCreateSimulatedPortfolio();
  const isSubmittingRef = useRef(false);

  const handleNext = useCallback(async () => {
    if (state.step === 3) {
      if (!canProceed(state)) return;
      if (createSimulatedPortfolio.isPending || isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      try {
        const created = await createSimulatedPortfolio.mutateAsync({
          name: state.portfolioName,
          description: state.goals.join(", "),
          totalAmount: state.totalAmount,
          items: state.assets.map((asset) => ({
            symbol: asset.ticker,
            targetWeight: asset.targetWeight,
          })),
        });
        dispatch({
          type: "SET_CREATED_RESULT",
          payload: {
            portfolioId: String(created.portfolioId),
            asOfDate: created.asOfDate,
          },
        });
        dispatch({ type: "NEXT" });
      } catch {
        // 오류 문구는 mutation의 P006/S002 매핑에서 처리한다.
      } finally {
        isSubmittingRef.current = false;
      }
    } else {
      dispatch({ type: "NEXT" });
    }
  }, [createSimulatedPortfolio, state]);

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <button
          onClick={state.step === 1 ? onClose : () => dispatch({ type: "PREV" })}
          className="p-1"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-foreground font-semibold text-sm flex-1">가상 포트폴리오 만들기</span>
        <span className="text-muted-foreground text-xs">{state.step}/3</span>
      </div>

      {/* 스텝 인디케이터 */}
      {state.step < 4 && (
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    s <= state.step ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-0.5 rounded-full transition-colors ${
                      s < state.step ? "bg-primary" : "bg-secondary"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{STEP_LABELS[state.step - 1]}</p>
        </div>
      )}

      {/* 단계 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={state.step}
            initial={{ opacity: 0, x: state.direction * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: state.direction * -32 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="h-full"
          >
            {state.step === 1 && <Phase1Goal state={state} dispatch={dispatch} />}
            {state.step === 2 && <Phase2Assets state={state} dispatch={dispatch} />}
            {state.step === 3 && <Phase3Allocation state={state} dispatch={dispatch} />}
            {state.step === 4 && (
              <Phase4Result
                portfolioId={state.createdPortfolioId}
                asOfDate={state.createdAsOfDate}
                onComplete={() => { onClose(); navigate("/portfolio"); }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 버튼 — 4단계(결과) 제외 */}
      {state.step < 4 && (
        <div className="flex gap-3 px-4 py-4 border-t border-border shrink-0">
          {state.step > 1 && (
            <button
              onClick={() => dispatch({ type: "PREV" })}
              className="flex-1 py-3.5 rounded-xl bg-secondary text-foreground font-semibold text-sm"
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed(state) || (state.step === 3 && createSimulatedPortfolio.isPending)}
            className="flex-1 py-3.5 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40"
          >
            {state.step === 3
              ? createSimulatedPortfolio.isPending
                ? "가상 포트폴리오 생성 중..."
                : "가상 포트폴리오 생성"
              : "다음 →"}
          </button>
        </div>
      )}
    </div>
  );
}
