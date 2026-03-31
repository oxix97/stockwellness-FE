import { useNavigate } from "react-router";
import { Skeleton } from "@/app/components/ui";
import { useStock } from "@/hooks/use-stock";
import { NewListingStock } from "@/types/api";

/**
 * Task #70 — 신규 상장 종목 카드 리스트
 */
export function NewListingsSection() {
  const { data, isLoading } = useStock().newListings;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((stock) => (
        <NewListingCard key={stock.ticker} stock={stock} />
      ))}
    </div>
  );
}

function NewListingCard({ stock }: { stock: NewListingStock }) {
  return (
    <div
      className="w-full bg-card rounded-xl p-4 border border-border flex items-center justify-between text-left"
    >
      <div>
        <p className="text-foreground font-semibold text-sm">{stock.name}</p>
        <p className="text-muted-foreground text-xs mt-0.5">
          {stock.ticker} · {stock.marketType}
          {stock.sectorName ? ` · ${stock.sectorName}` : ""}
        </p>
      </div>
      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
        신규상장
      </span>
    </div>
  );
}
