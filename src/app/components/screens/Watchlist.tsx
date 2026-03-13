import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";

const groups = [
  { id: 1, name: "내 찜 목록", icon: "💚" },
  { id: 2, name: "고배당 ETF", icon: "💰" },
  { id: 3, name: "핫한 AI", icon: "🔥" },
];

const watchlistStocks = {
  1: [
    {
      symbol: "005930",
      name: "삼성전자",
      price: 72000,
      change: 2.1,
      isUp: true,
    },
    {
      symbol: "035420",
      name: "NAVER",
      price: 182000,
      change: -1.09,
      isUp: false,
    },
  ],
  2: [
    {
      symbol: "KODEX",
      name: "KODEX 고배당",
      price: 12500,
      change: 0.5,
      isUp: true,
    },
    {
      symbol: "TIGER",
      name: "TIGER 배당성장",
      price: 15300,
      change: 0.8,
      isUp: true,
    },
  ],
  3: [
    {
      symbol: "NVDA",
      name: "NVIDIA",
      price: 875.5,
      change: 3.2,
      isUp: true,
    },
    {
      symbol: "MSFT",
      name: "Microsoft",
      price: 420.3,
      change: 1.5,
      isUp: true,
    },
  ],
};

export function Watchlist() {
  const [activeGroup, setActiveGroup] = useState(1);
  const stocks = watchlistStocks[activeGroup as keyof typeof watchlistStocks] || [];

  return (
    <div className="min-h-full">
      {/* 헤더 */}
      <header className="bg-card px-6 pt-8 pb-6 border-b border-border">
        <div className="text-foreground" style={{ fontSize: '28px', fontWeight: 700 }}>
          내 관심 종목
        </div>
      </header>

      {/* 그룹 칩 */}
      <div className="px-6 py-6 bg-card border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap transition-all ${
                activeGroup === group.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <span className="text-xl">{group.icon}</span>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{group.name}</span>
            </button>
          ))}
          <button className="flex items-center gap-2 px-5 py-3 rounded-full whitespace-nowrap bg-secondary text-secondary-foreground">
            <Plus className="w-4 h-4" />
            <span style={{ fontSize: '15px', fontWeight: 600 }}>새 그룹</span>
          </button>
        </div>
      </div>

      {/* 종목 리스트 */}
      <div className="px-6 py-6">
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          {stocks.map((stock, index) => (
            <Link key={stock.symbol} to={`/stock/${stock.symbol}`}>
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
                    <div className="text-muted-foreground text-sm">{stock.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-foreground mb-1" style={{ fontSize: '16px', fontWeight: 600 }}>
                    {["NVDA", "MSFT"].includes(stock.symbol)
                      ? `$${stock.price}`
                      : `₩${stock.price.toLocaleString()}`}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      stock.isUp ? "text-[#FF4756]" : "text-[#3182F6]"
                    }`}
                  >
                    {stock.isUp ? "+" : ""}
                    {stock.change}%
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {stocks.length === 0 && (
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
