import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { Search as SearchIcon, TrendingUp, Clock, X } from "lucide-react";
import { motion } from "motion/react";
import { useStock } from "@/hooks/use-stock";
import { Skeleton } from "@/app/components/ui";
import { PageHeader, Section, StockLogo } from "@/app/components/shared";

const RECENT_SEARCHES_KEY = "recent-searches";
const MAX_RECENT = 10;

function loadRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecents(items: string[]) {
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
}

export function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("keyword") || "");
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecents);
  const { popular, useSearch } = useStock();
  const { data: searchResults, isLoading: isSearching } = useSearch(query);

  const results = searchResults?.pages.flatMap(page => page.content) || [];

  const addRecent = useCallback((keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((k) => k !== trimmed)].slice(0, MAX_RECENT);
      saveRecents(next);
      return next;
    });
  }, []);

  const removeRecent = useCallback((keyword: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((k) => k !== keyword);
      saveRecents(next);
      return next;
    });
  }, []);

  const clearAllRecents = useCallback(() => {
    saveRecents([]);
    setRecentSearches([]);
  }, []);

  // 검색어가 2자 이상으로 안정될 때 최근 검색어에 저장
  useEffect(() => {
    if (query.length < 2) return;
    const timer = setTimeout(() => addRecent(query), 800);
    return () => clearTimeout(timer);
  }, [query, addRecent]);

  const handleSelectKeyword = (keyword: string) => {
    setQuery(keyword);
    addRecent(keyword);
  };

  return (
    <div className="min-h-full pb-20">
      <PageHeader title="검색" />

      <div className="px-6 py-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
        <div className="relative group">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="종목명 또는 종목코드 검색"
            className="w-full pl-12 pr-10 py-4 bg-secondary rounded-2xl border-0 focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
          />
          {query.length > 0 && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {query.length >= 2 ? (
          <SearchResultsList results={results} isLoading={isSearching} />
        ) : (
          <>
            {recentSearches.length > 0 && (
              <RecentSearchesList
                recents={recentSearches}
                onSelect={handleSelectKeyword}
                onRemove={removeRecent}
                onClearAll={clearAllRecents}
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

function SearchResultsList({ results, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-3xl" />)}
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
    <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
      {results.map((stock: any, index: number) => (
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
  );
}

function PopularKeywordList({ keywords, isLoading, onSelect }: any) {
  if (isLoading) {
    return (
       <div className="p-4 space-y-4">
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
