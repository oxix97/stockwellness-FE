import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, X } from "lucide-react";
import { motion } from "motion/react";
import { useSearch } from "@/hooks/use-search";
import { Skeleton } from "@/app/components/ui";

interface GlobalSearchProps {
  onClose: () => void;
}

/**
 * 전체화면 검색 오버레이.
 * - 인기 검색어 Top 10 / 최근 검색어 / 실시간 자동완성
 */
export function GlobalSearch({ onClose }: GlobalSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    keyword,
    setKeyword,
    history,
    popular,
    autocomplete,
    deleteHistory,
    clearHistory,
  } = useSearch();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelect = (ticker: string) => {
    onClose();
    navigate(`/stock/${ticker}`);
  };

  const handleKeywordApply = (kw: string) => {
    setKeyword(kw);
    inputRef.current?.focus();
  };

  const showAutocomplete = keyword.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-[100] bg-background flex flex-col"
    >
      {/* 검색 입력바 */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <button onClick={onClose} className="p-1 shrink-0" aria-label="뒤로가기">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <input
          ref={inputRef}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="종목·티커 검색"
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-[15px]"
        />
        {keyword && (
          <button onClick={() => setKeyword("")} className="p-1 shrink-0" aria-label="검색어 지우기">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {!showAutocomplete ? (
          <>
            {/* 최근 검색어 */}
            {(history.data?.length ?? 0) > 0 && (
              <section className="px-4 pt-5 pb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-foreground">최근 검색어</span>
                  <button
                    onClick={() => clearHistory.mutate()}
                    className="text-xs text-muted-foreground"
                  >
                    전체삭제
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.data?.map((kw) => (
                    <div
                      key={kw}
                      className="flex items-center gap-1 bg-secondary rounded-full px-3 py-1.5"
                    >
                      <button
                        onClick={() => handleKeywordApply(kw)}
                        className="text-sm text-foreground"
                      >
                        {kw}
                      </button>
                      <button
                        onClick={() => deleteHistory.mutate(kw)}
                        className="text-muted-foreground ml-1"
                        aria-label={`${kw} 삭제`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 인기 검색어 */}
            <section className="px-4 pt-3">
              <div className="mb-3">
                <span className="text-sm font-semibold text-foreground">🔥 인기 검색어</span>
              </div>
              {popular.isLoading ? (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2">
                  {popular.data?.slice(0, 10).map((name, i) => (
                    <button
                      key={name}
                      onClick={() => handleKeywordApply(name)}
                      className="flex items-center gap-3 py-3 text-left"
                    >
                      <span className="text-primary font-bold text-sm w-5 shrink-0">{i + 1}</span>
                      <span className="text-foreground text-sm truncate">{name}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          /* 자동완성 결과 */
          <section className="px-4 pt-2">
            {autocomplete.isLoading ? (
              <div className="space-y-3 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : autocomplete.data?.content.length === 0 ? (
              <div className="text-center text-muted-foreground py-16 text-sm">
                검색 결과가 없습니다
              </div>
            ) : (
              autocomplete.data?.content.map((stock) => (
                <button
                  key={stock.ticker}
                  onClick={() => handleSelect(stock.ticker)}
                  className="w-full flex items-center justify-between py-3.5 border-b border-border last:border-0 text-left"
                >
                  <div>
                    <div className="text-foreground font-semibold text-[15px]">{stock.name}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">
                      {stock.ticker} · {stock.marketType}
                    </div>
                  </div>
                </button>
              ))
            )}
          </section>
        )}
      </div>
    </motion.div>
  );
}
