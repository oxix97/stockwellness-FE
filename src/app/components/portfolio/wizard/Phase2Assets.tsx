import { useState } from "react";
import { X, Search } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { WizardState, WizardAction, AssetItem, isKrwMarket } from "./PortfolioWizard";

interface Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

/** Task #77 — 위저드 2단계: 자산 담기 */
export function Phase2Assets({ state, dispatch }: Props) {
  const { keyword, setKeyword, autocomplete } = useSearch();
  const [unsupportedMessage, setUnsupportedMessage] = useState(false);
  const showResults = keyword.trim().length > 0;
  const autocompleteResults = autocomplete.data?.pages.flatMap((page) => page.content ?? []) ?? [];
  const hasUnsupportedResult = autocompleteResults.some((stock) => !isKrwMarket(stock.marketType));

  const isAdded = (ticker: string) => state.assets.some((a) => a.ticker === ticker);

  const addAsset = (item: AssetItem) => {
    if (!isKrwMarket(item.marketType)) {
      setUnsupportedMessage(true);
      return;
    }
    if (isAdded(item.ticker)) return;
    dispatch({ type: "SET_ASSETS", payload: [...state.assets, { ...item, targetWeight: 0 }] });
  };

  const removeAsset = (ticker: string) => {
    dispatch({ type: "SET_ASSETS", payload: state.assets.filter((a) => a.ticker !== ticker) });
  };

  return (
    <div className="px-4 py-6 space-y-5">
      {/* 종목 검색 */}
      <div>
        <p className="text-foreground font-semibold text-sm mb-3">종목 검색</p>
        <p className="text-xs text-muted-foreground mb-3">
          현재는 KOSPI·KOSDAQ 원화 종목만 가상 포트폴리오에 담을 수 있습니다.
        </p>
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
              ) : autocompleteResults.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">결과 없음</div>
              ) : (
                autocompleteResults.slice(0, 8).map((stock) => (
                  <button
                    key={stock.ticker}
                    onClick={() => {
                      addAsset({
                        ticker: stock.ticker,
                        name: stock.name,
                        marketType: stock.marketType,
                        targetWeight: 0,
                      });
                      setKeyword("");
                    }}
                    disabled={isAdded(stock.ticker) || !isKrwMarket(stock.marketType)}
                    aria-describedby={!isKrwMarket(stock.marketType) ? "simulated-foreign-stock-notice" : undefined}
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
          {(unsupportedMessage || hasUnsupportedResult) && (
            <p id="simulated-foreign-stock-notice" role="alert" className="mt-2 text-xs text-muted-foreground">
              환율 지원 전에는 포트폴리오에 담을 수 없습니다
            </p>
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
                <button onClick={() => removeAsset(asset.ticker)} aria-label={`${asset.name} 삭제`}>
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
