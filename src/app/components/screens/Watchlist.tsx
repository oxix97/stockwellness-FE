import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Skeleton } from "@/app/components/ui";

export function Watchlist() {
  const { groups, useGroupItems } = useWatchlist();
  const [activeGroup, setActiveGroup] = useState<number | null>(null);

  // 첫 번째 그룹이 로드되면 기본 활성화
  useEffect(() => {
    if (groups.data && groups.data.length > 0 && activeGroup === null) {
      setActiveGroup(groups.data[0].id);
    }
  }, [groups.data, activeGroup]);

  const itemsQuery = useGroupItems(activeGroup);
  const stocks = itemsQuery.data?.items || [];

  return (
    <div className="min-h-full">
      {/* 헤더 */}
      <header className="bg-card px-6 pt-8 pb-6 border-b border-border">
        <div className="text-foreground" style={{ fontSize: '28px', fontWeight: 700 }}>
          {itemsQuery.data?.groupName || "내 관심 종목"}
        </div>
      </header>

      {/* 그룹 칩 */}
      <div className="px-6 py-6 bg-card border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {groups.isLoading ? (
            <div className="flex gap-2">
               {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-28 rounded-full" />)}
            </div>
          ) : (
            <>
              {groups.data?.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setActiveGroup(group.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap transition-all ${
                    activeGroup === group.id
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>{group.name}</span>
                </button>
              ))}
              <button className="flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap bg-secondary text-secondary-foreground">
                <Plus className="w-4 h-4" />
                <span style={{ fontSize: '15px', fontWeight: 600 }}>새 그룹</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 종목 리스트 */}
      <div className="px-6 py-6">
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          {itemsQuery.isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            stocks.map((stock, index) => (
              <Link key={stock.ticker} to={`/stock/${stock.ticker}`}>
                <div
                  className={`px-6 py-5 flex items-center justify-between ${
                    index !== stocks.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                      <span className="text-primary" style={{ fontSize: '18px', fontWeight: 700 }}>
                        {stock.name[0]}
                      </span>
                    </div>
                    <div>
                      <div className="text-foreground mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                        {stock.name}
                      </div>
                      <div className="text-muted-foreground text-sm">{stock.ticker}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-foreground mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                      {["NVDA", "MSFT", "AAPL"].includes(stock.ticker)
                        ? `$${stock.currentPrice}`
                        : `₩${stock.currentPrice.toLocaleString()}`}
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        stock.fluctuationRate >= 0 ? "text-[#FF4756]" : "text-[#3182F6]"
                      }`}
                    >
                      {stock.fluctuationRate >= 0 ? "+" : ""}
                      {stock.fluctuationRate}%
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {!itemsQuery.isLoading && stocks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-muted-foreground">
              아직 관심 종목이 없어요
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
