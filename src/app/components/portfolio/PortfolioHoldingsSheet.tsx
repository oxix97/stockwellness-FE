import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { X } from "lucide-react";
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
        <DrawerHeader className="relative border-b border-border pb-4">
          <DrawerTitle className="text-center text-base font-bold">
            보유 종목 전체 ({portfolio?.items?.length ?? 0})
          </DrawerTitle>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

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
