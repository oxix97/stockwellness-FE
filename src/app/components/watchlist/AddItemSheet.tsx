import { useState, useEffect } from "react";
import { Search, X, Plus, Check } from "lucide-react";
import { Sheet, SheetContent } from "@/app/components/ui";
import { useSearch } from "@/hooks/use-search";
import { useWatchlist } from "@/hooks/use-watchlist";
import { toast } from "sonner";

interface AddItemSheetProps {
  groupId: number;
  existingTickers: string[];
  onClose: () => void;
}

/**
 * 관심 종목 추가 바텀시트
 * - 종목 검색 (useSearch 훅)
 * - 검색 결과에서 탭 → addItem 뮤테이션 호출
 * - 이미 추가된 종목은 "추가됨" 배지로 표시 (중복 방지)
 */
export function AddItemSheet({ groupId, existingTickers, onClose }: AddItemSheetProps) {
  const { keyword, setKeyword, autocomplete } = useSearch();
  const { addItem } = useWatchlist();
  const [addedInSession, setAddedInSession] = useState<string[]>([]);

  const autocompleteResults = autocomplete.data?.pages?.flatMap((page) => page.content) ?? [];

  // 시트 닫힐 때 검색어 초기화
  useEffect(() => {
    return () => setKeyword("");
  }, [setKeyword]);

  const isAdded = (ticker: string) =>
    existingTickers.includes(ticker) || addedInSession.includes(ticker);

  const handleAdd = (ticker: string, name: string) => {
    if (isAdded(ticker)) return;
    addItem.mutate(
      { groupId, body: { ticker, name } as any }, // casting as any to allow extra property for optimistic update
      {
        onSuccess: () => {
          setAddedInSession((prev) => [...prev, ticker]);
          toast.success(`${name} 추가되었습니다.`);
        },
        onError: () => toast.error("종목 추가에 실패했습니다."),
      }
    );
  };

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8 max-h-[80vh] flex flex-col">
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-4 shrink-0">
          <h2 className="text-foreground font-bold text-base mb-4">종목 추가</h2>

          {/* 검색창 */}
          <div className="flex items-center gap-2 bg-secondary rounded-xl h-11 px-3 mb-3">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="티커 또는 종목명 검색"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
            />
            {keyword && (
              <button onClick={() => setKeyword("")}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* 검색 결과 */}
        <div className="flex-1 overflow-y-auto px-4">
          {keyword.trim().length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-12">
              종목명 또는 티커를 입력하세요
            </p>
          ) : autocomplete.isLoading ? (
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-secondary rounded-xl animate-pulse" />
              ))}
            </div>
          ) : autocompleteResults.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-12">검색 결과가 없습니다</p>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {autocompleteResults.slice(0, 20).map((stock, index, arr) => {
                const added = isAdded(stock.ticker);
                return (
                  <button
                    key={stock.ticker}
                    onClick={() => handleAdd(stock.ticker, stock.name)}
                    disabled={added || addItem.isPending}
                    className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors ${
                      index < arr.length - 1 ? "border-b border-border" : ""
                    } ${added ? "opacity-60" : "active:bg-secondary"}`}
                  >
                    <div className="min-w-0">
                      <p className="text-foreground font-medium text-sm truncate">{stock.name}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {stock.ticker}
                        {stock.marketType ? ` · ${stock.marketType}` : ""}
                        {stock.sectorName ? ` · ${stock.sectorName}` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 ml-3">
                      {added ? (
                        <span className="flex items-center gap-1 text-primary text-xs font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          추가됨
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
                          <Plus className="w-3 h-3" />
                          추가
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
