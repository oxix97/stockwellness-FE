import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { Search as SearchIcon, TrendingUp, Clock, X, Loader2, Leaf, ArrowUpRight } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { motion } from "motion/react";
import { useSearch } from "@/hooks/use-search";
import { Button, Skeleton } from "@/app/components/ui";
import { ContextHeader, GardenEmptyState, Section, StockLogo, AdUnit } from "@/app/components/shared";
import { StockSearchResult } from "@/types/api";
import { injectAds } from "@/utils/array-inject";

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
    clearHistory,
  } = useSearch(initialKeyword, initialSectorCode, initialSectorName);

  const { data: searchResults, isLoading: isSearching, fetchNextPage, hasNextPage, isFetchingNextPage } = autocomplete;
  const { ref, inView } = useInView();

  const results = searchResults?.pages.flatMap((page) => page.content) || [];
  const searchMode = keyword.length >= 2 || ((sectorCode || sectorName) && keyword.length >= 0);
  const suggestedPaths = useMemo(() => (popular.data ?? []).slice(0, 5), [popular.data]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleClearSector = () => {
    setSectorCode("");
    setSectorName("");
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("sectorCode");
    newParams.delete("sectorName");
    setSearchParams(newParams);
  };

  const handleSelectKeyword = (nextKeyword: string) => {
    setKeyword(nextKeyword);
  };

  return (
    <div className="min-h-full pb-6">
      <div className="page-shell page-content pt-4 md:pt-6">
        <ContextHeader
          variant="search"
          layout="split"
          title={<p className="max-w-[15rem] text-[length:var(--mobile-hero-title-size)] font-bold leading-[1.08] tracking-tight min-[408px]:max-w-[17rem]">찾고 싶은 종목과 테마를 바로 탐색해보세요</p>}
          description="종목명, 티커, 업종 흐름을 한 번에 좁혀가며 탐색할 수 있습니다."
          footer={
            <div className="space-y-3">
              <div className="relative group">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={initialSectorName ? `${initialSectorName} 내 종목 검색` : "종목명 또는 종목코드 검색"}
                  className="h-13 w-full rounded-[calc(var(--mobile-card-radius)-2px)] border border-border bg-card/90 pl-12 pr-10 text-[15px] font-semibold text-foreground outline-none transition-all focus:border-primary/35 focus:ring-2 focus:ring-primary/20 min-[408px]:h-14 md:rounded-2xl"
                />
                {keyword.length > 0 && (
                  <button
                    onClick={() => setKeyword("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {(sectorCode || sectorName) && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1.5 text-xs font-semibold text-foreground">
                    <Leaf className="h-3.5 w-3.5 text-primary" />
                    <span>업종: {sectorName || sectorCode}</span>
                    <button onClick={handleClearSector} className="text-muted-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          }
        />
      </div>

      <div className="page-shell page-content py-6">
        {searchMode ? (
          <div className="space-y-6">
            {suggestedPaths.length > 0 && (
              <Section title="추천 검색어" subtitle="자주 찾는 종목이나 테마로 바로 이동할 수 있습니다." icon={TrendingUp} className="px-0 py-0">
                <div className="flex flex-wrap gap-2">
                  {suggestedPaths.map((pathKeyword) => (
                    <button
                      key={pathKeyword}
                      onClick={() => handleSelectKeyword(pathKeyword)}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
                    >
                      {pathKeyword}
                    </button>
                  ))}
                </div>
              </Section>
            )}
            <SearchResultsList
              results={results}
              isLoading={isSearching}
              loadMoreRef={ref}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
            <div className="space-y-6">
              {(history.data?.length ?? 0) > 0 ? (
                <RecentSearchesList
                  recents={history.data || []}
                  onSelect={handleSelectKeyword}
                  onRemove={(nextKeyword) => deleteHistory.mutate(nextKeyword)}
                  onClearAll={() => clearHistory.mutate()}
                />
              ) : (
                <GardenEmptyState
                  title="탐색 기록이 아직 없어요"
                  description="검색을 시작하면 최근 살펴본 종목을 이 영역에서 빠르게 다시 열 수 있습니다."
                />
              )}
            </div>

            <div className="space-y-6">
              <Section title="인기 검색어" subtitle="다른 사용자가 주목하는 종목 흐름입니다." icon={TrendingUp} className="px-0">
                <PopularKeywordList
                  keywords={popular.data}
                  isLoading={popular.isLoading}
                  onSelect={handleSelectKeyword}
                />
              </Section>
            </div>
          </div>
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
    <Section
      title="최근 탐색"
      subtitle="방금 살펴본 종목으로 다시 돌아갈 수 있습니다."
      icon={Clock}
      className="px-0 pb-0"
      rightContent={
        <Button variant="ghost" size="sm" className="text-xs" onClick={onClearAll}>
          전체 삭제
        </Button>
      }
    >
      <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
        {recents.map((keyword, index) => (
          <div
            key={keyword}
            className={`flex items-center justify-between px-5 py-4 ${index !== recents.length - 1 ? "border-b border-border" : ""}`}
          >
            <button onClick={() => onSelect(keyword)} className="flex flex-1 items-center gap-3 text-left">
              <div className="rounded-full bg-secondary p-2 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium text-foreground">{keyword}</span>
            </button>
            <button onClick={() => onRemove(keyword)} className="rounded-full p-2 text-muted-foreground hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SearchResultsList({
  results,
  isLoading,
  loadMoreRef,
  hasNextPage,
  isFetchingNextPage,
}: {
  results: StockSearchResult[];
  isLoading: boolean;
  loadMoreRef: (node?: Element | null) => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}) {
  const items = useMemo(() => injectAds(results), [results]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-[28px]" />)}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <GardenEmptyState
        title="아직 맞는 종목을 찾지 못했어요"
        description="검색어를 조금 바꾸거나 업종 필터를 해제하면 더 넓은 자산 정원을 탐색할 수 있습니다."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
        {items.map((item, index) => {
          if ("isAd" in item) {
            return (
              <div key={`ad-${index}`} className={`px-5 py-4 ${index !== items.length - 1 ? "border-b border-border" : ""}`}>
                <AdUnit type="search-in-feed" className="my-2" />
              </div>
            );
          }

          const stock = item;
          return (
            <Link key={stock.ticker} to={`/stock/${stock.ticker}`}>
              <motion.div
                whileTap={{ backgroundColor: "var(--color-secondary)" }}
                className={`flex items-center justify-between gap-4 px-5 py-4 active:bg-accent transition-colors md:py-5 ${index !== items.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <StockLogo name={stock.name} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate font-bold text-foreground">{stock.name}</div>
                      <span className="rounded-full border border-border/60 bg-secondary/70 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {stock.marketType}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{stock.ticker}</span>
                      <span>•</span>
                      <span>watchable</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">가격, 수급 흐름, 상세 지표를 바로 확인할 수 있어요.</p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div ref={loadMoreRef} className="flex h-10 items-center justify-center">
        {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
        {!hasNextPage && results.length > 0 && <span className="text-xs text-muted-foreground">마지막 검색 결과입니다.</span>}
      </div>
    </div>
  );
}

function PopularKeywordList({
  keywords,
  isLoading,
  onSelect,
}: {
  keywords: string[] | undefined;
  isLoading: boolean;
  onSelect: (keyword: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
      {keywords?.map((name, index) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className="w-full text-left active:bg-accent transition-colors"
        >
          <motion.div
            whileTap={{ backgroundColor: "var(--color-secondary)" }}
            className={`flex items-center justify-between px-5 py-4 ${index !== keywords.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-center gap-4">
              <span className="min-w-[20px] text-lg font-bold text-primary">{index + 1}</span>
              <span className="font-bold text-foreground">{name}</span>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground opacity-40" />
          </motion.div>
        </button>
      ))}
    </div>
  );
}
