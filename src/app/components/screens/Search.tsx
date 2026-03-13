import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Search as SearchIcon, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useStock } from "@/hooks/use-stock";
import { Skeleton } from "@/app/components/ui";
import { PageHeader, Section, StockLogo } from "@/app/components/shared";

export function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("keyword") || "");
  const { popular, useSearch } = useStock();
  const { data: searchResults, isLoading: isSearching } = useSearch(query);

  const results = searchResults?.content || [];

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
            className="w-full pl-12 pr-4 py-4 bg-secondary rounded-2xl border-0 focus:ring-2 focus:ring-primary outline-none transition-all font-bold"
          />
        </div>
      </div>

      <div className="px-6 py-6">
        {query.length >= 2 ? (
          <SearchResultsList results={results} isLoading={isSearching} />
        ) : (
          <Section title="인기 검색어" icon={TrendingUp} className="px-0">
             <PopularKeywordList 
               keywords={popular.data} 
               isLoading={popular.isLoading} 
               onSelect={setQuery} 
             />
          </Section>
        )}
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
