import {
  Drawer,
  DrawerContent,
} from "@/app/components/ui/drawer";
import { DrawerSheetHeader } from "@/app/components/shared/DrawerSheetHeader";
import { usePortfolioDetails } from "@/hooks/use-portfolio";
import { formatCurrency, formatPercent } from "@/utils/format";

interface PortfolioHoldingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PortfolioHoldingsSheet({ isOpen, onClose }: PortfolioHoldingsSheetProps) {
  const { data: portfolio, isLoading } = usePortfolioDetails();

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerSheetHeader title={`보유 종목 전체 (${portfolio?.items?.length ?? 0})`} />

        <div className="overflow-y-auto p-4 divide-y divide-border scrollbar-hide">
          {portfolio?.items?.map((item) => (
            <div
              key={item.symbol}
              className="py-4 flex justify-between items-center"
            >
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-foreground font-bold text-sm truncate">
                  {item.name || item.symbol}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium uppercase">
                    {item.assetType}
                  </span>
                  <p className="text-muted-foreground text-[11px]">
                    {item.symbol} · {item.quantity}주
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-foreground font-bold text-sm tabular-nums">
                  ₩{formatCurrency(item.currentValue ?? 0)}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    평단 ₩{formatCurrency(item.purchasePrice)}
                  </span>
                  <span
                    className={`text-[11px] font-bold tabular-nums ${
                      (item.returnRate ?? 0) >= 0 ? "text-up" : "text-down"
                    }`}
                  >
                    {formatPercent(item.returnRate ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {(portfolio?.items?.length ?? 0) === 0 && !isLoading && (
            <div className="py-20 text-center text-muted-foreground text-sm">
              보유 종목이 없습니다.
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
