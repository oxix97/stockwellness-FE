import { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { Search as SearchIcon, TrendingUp, Clock, X, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useInView } from "react-intersection-observer";
import { useSearch } from "@/hooks/use-search";
import { Skeleton } from "@/app/components/ui";
import { Section, StockLogo } from "@/app/components/shared";
import { StockSearchResult } from "@/types/api";

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKeyword = searchParams.get("keyword") || "";
  const initialSectorCode = searchParams.get("sectorCode") || "";
  const initialSectorName = searchParams.get("sectorName") || "";
  
  const {
    keyword,
    setKeyword,
    sectorCode,
    setSectorCode,
    sectorName,
    setSectorName,
    popular,
    history,
    autocomplete,
    deleteHistory,
    clearHistory
  } = useSearch(initialKeyword, initialSectorCode, initialSectorName);

  const { data: searchResults, isLoading: isSearching, fetchNextPage, hasNextPage, isFetchingNextPage } = autocomplete;
  const { ref, inView } = useInView();

  const results = searchResults?.pages.flatMap(page => page.content) || [];

  const handleClearSector = () => {
    setSectorCode("");
    setSectorName("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("sectorCode");
    newParams.delete("sectorName");
    setSearchParams(newParams);
  };

  // 무한 스크롤 트리거
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelectKeyword = (k: string) => {
    setKeyword(k);
  };

  return (
    <div className="min-h-full pb-20">
      <div className="px-6 py-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="relative group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={initialSectorName ? `${initialSectorName} 내 종목 검색` : "종목명 또는 종목코드 검색"}
            className="w-full pl-12 pr-10 py-4 bg-secondary rounded-2xl border-0 focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
          />
          {keyword.length > 0 && (
            <button
              onClick={() => setKeyword("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {(sectorCode || sectorName) && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0"
            >
              <span>업종: {sectorName || sectorCode}</span>
              <button onClick={handleClearSector}>
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          </div>
        )}
      </div>

      <div className="px-6 py-6 space-y-6">
        {keyword.length >= 2 || ((sectorCode || sectorName) && keyword.length >= 0) ? (
          <SearchResultsList 
            results={results} 
            isLoading={isSearching} 
            loadMoreRef={ref}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        ) : (
          <>
            {(history.data?.length ?? 0) > 0 && (
              <RecentSearchesList
                recents={history.data || []}
                onSelect={handleSelectKeyword}
                onRemove={(k) => deleteHistory.mutate(k)}
                onClearAll={() => clearHistory.mutate()}
              />
            )}
            <Section title="인기 검색어" icon={TrendingUp} className="px-0">
              <PopularKeywordList
                keywords={popular.data}
                isLoading={popular.isLoading}
                onSelect={handleSelectKeyword}
              />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function RecentSearchesList({
  recents,
  onSelect,
  onRemove,
  onClearAll,
}: {
  recents: string[];
  onSelect: (k: string) => void;
  onRemove: (k: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-foreground font-bold text-base">
          <Clock className="w-4 h-4 text-muted-foreground" />
          최근 검색어
        </div>
        <button
          onClick={onClearAll}
          className="text-muted-foreground text-sm font-medium"
        >
          전체 삭제
        </button>
      </div>
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        {recents.map((keyword, index) => (
          <div
            key={keyword}
            className={`px-6 py-4 flex items-center justify-between ${
              index !== recents.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <button
              onClick={() => onSelect(keyword)}
              className="flex items-center gap-3 flex-1 text-left"
            >
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-foreground font-medium">{keyword}</span>
            </button>
            <button
              onClick={() => onRemove(keyword)}
              className="p-1 text-muted-foreground ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SearchResultsList({ 
  results, 
  isLoading, 
  loadMoreRef,
  hasNextPage,
  isFetchingNextPage 
}: { 
  results: StockSearchResult[]; 
  isLoading: boolean;
  loadMoreRef: (node?: Element | null) => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-3xl" />)}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        <div className="text-6xl mb-4 text-muted-foreground/30">🔍</div>
        <div className="text-muted-foreground font-bold">검색 결과가 없어요</div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        {results.map((stock, index) => (
          <Link key={stock.ticker} to={`/stock/${stock.ticker}`}>
            <motion.div
              whileTap={{ backgroundColor: "var(--color-secondary)" }}
              className={`px-6 py-5 flex items-center justify-between active:bg-accent transition-colors ${index !== results.length - 1 ? "border-b border-border" : ""}`}
            >
              <div className="flex items-center gap-4">
                <StockLogo name={stock.name} />
                <div>
                  <div className="text-foreground font-bold">{stock.name}</div>
                  <div className="text-muted-foreground text-xs font-medium">{stock.ticker} | {stock.marketType}</div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
      
      {/* 무한 스크롤 관찰 지점 */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isFetchingNextPage && (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        )}
        {!hasNextPage && results.length > 0 && (
          <span className="text-muted-foreground text-xs">마지막 검색 결과입니다.</span>
        )}
      </div>
    </div>
  );
}

function PopularKeywordList({ keywords, isLoading, onSelect }: { keywords: string[] | undefined; isLoading: boolean; onSelect: (keyword: string) => void }) {
  if (isLoading) {
    return (
       <div className="space-y-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}
       </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
      {keywords?.map((name: string, index: number) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className="w-full text-left active:bg-accent transition-colors"
        >
          <motion.div
            whileTap={{ backgroundColor: "var(--color-secondary)" }}
            className={`px-6 py-5 flex items-center justify-between ${index !== keywords.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-primary font-bold text-lg min-w-[20px]">{index + 1}</span>
              <span className="text-foreground font-bold">{name}</span>
            </div>
            <TrendingUp className="w-5 h-5 text-muted-foreground opacity-30" />
          </motion.div>
        </button>
      ))}
    </div>
  );
}
