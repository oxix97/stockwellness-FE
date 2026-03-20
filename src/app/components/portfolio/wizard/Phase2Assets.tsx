import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { WizardState, WizardAction, AssetItem } from "./PortfolioWizard";

const QUICK_ASSETS: AssetItem[] = [
  { ticker: "TLT", name: "미국 장기채", targetWeight: 0 },
  { ticker: "GLD", name: "금", targetWeight: 0 },
  { ticker: "CASH", name: "현금", targetWeight: 0 },
  { ticker: "SPY", name: "S&P500 ETF", targetWeight: 0 },
];

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

/** Task #77 — 위저드 2단계: 자산 담기 */
export function Phase2Assets({ state, dispatch }: Props) {
  const { keyword, setKeyword, autocomplete } = useSearch();
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setShowResults(keyword.trim().length > 0);
  }, [keyword]);

  const isAdded = (ticker: string) => state.assets.some((a) => a.ticker === ticker);

  const addAsset = (item: AssetItem) => {
    if (isAdded(item.ticker)) return;
    dispatch({ type: "SET_ASSETS", payload: [...state.assets, { ...item, targetWeight: 0 }] });
  };

  const removeAsset = (ticker: string) => {
    dispatch({ type: "SET_ASSETS", payload: state.assets.filter((a) => a.ticker !== ticker) });
  };

  return (
    <div className="px-4 py-6 space-y-5">
      {/* 빠른 추가 칩 */}
      <div>
        <p className="text-foreground font-semibold text-sm mb-3">빠른 추가</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ASSETS.map((asset) => {
            const added = isAdded(asset.ticker);
            return (
              <button
                key={asset.ticker}
                onClick={() => addAsset(asset)}
                disabled={added}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                  added
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-secondary text-secondary-foreground border-border"
                }`}
              >
                {added ? "✓ " : ""}{asset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 종목 검색 */}
      <div>
        <p className="text-foreground font-semibold text-sm mb-3">종목 검색</p>
        <div className="relative">
          <div className="flex items-center gap-2 bg-secondary rounded-xl h-11 px-3">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="티커 또는 종목명"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            />
            {keyword && (
              <button onClick={() => setKeyword("")}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {showResults && (
            <div className="mt-1 bg-card rounded-xl border border-border overflow-hidden shadow-lg max-h-[200px] overflow-y-auto">
              {autocomplete.isLoading ? (
                <div className="p-3 text-sm text-muted-foreground">검색 중...</div>
              ) : autocomplete.data?.content.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">결과 없음</div>
              ) : (
                autocomplete.data?.content.slice(0, 8).map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => {
                      addAsset({ ticker: stock.ticker, name: stock.name, targetWeight: 0 });
                      setKeyword("");
                    }}
                    disabled={isAdded(stock.ticker)}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-border last:border-0 text-left disabled:opacity-40"
                  >
                    <div>
                      <p className="text-foreground text-sm font-medium">{stock.name}</p>
                      <p className="text-muted-foreground text-xs">{stock.ticker} · {stock.marketType}</p>
                    </div>
                    {isAdded(stock.ticker) && (
                      <span className="text-primary text-xs font-semibold">추가됨</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 담은 자산 목록 */}
      {state.assets.length > 0 && (
        <div>
          <p className="text-foreground font-semibold text-sm mb-3">
            담은 자산 <span className="text-primary">({state.assets.length})</span>
          </p>
          <div className="space-y-2">
            {state.assets.map((asset) => (
              <div
                key={asset.ticker}
                className="flex items-center justify-between bg-secondary rounded-xl px-4 py-3"
              >
                <div>
                  <p className="text-foreground font-medium text-sm">{asset.name}</p>
                  <p className="text-muted-foreground text-xs">{asset.ticker}</p>
                </div>
                <button onClick={() => removeAsset(asset.ticker)}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
