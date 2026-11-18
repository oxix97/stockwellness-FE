import {
  Drawer,
  DrawerContent,
} from "@/app/components/ui/drawer";
import { DrawerSheetHeader } from "@/app/components/shared/DrawerSheetHeader";
import { usePortfolioDetails } from "@/hooks/use-portfolio";
import { formatCurrency } from "@/utils/format";
import { SignedValueLabel } from "@/app/components/shared/label/SignedValueLabel";

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
          {portfolio?.items?.map((item) => {
            const priceLabel = getHoldingPriceDescription(item.priceStatus, item.priceAsOfDate);
            return (
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
                  <p
                    className={`mt-1 text-[11px] ${
                      item.priceStatus === "MISSING"
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {priceLabel}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-bold text-sm tabular-nums">
                    {item.currentValue == null ? "—" : `₩${formatCurrency(item.currentValue)}`}
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      평단 ₩{formatCurrency(item.purchasePrice)}
                    </span>
                    {item.returnRate == null ? (
                      <span
                        className="text-[11px] font-bold text-muted-foreground tabular-nums"
                        aria-label={`${item.name || item.symbol} 수익률 평가할 수 없음`}
                      >
                        —
                      </span>
                    ) : (
                      <SignedValueLabel
                        value={item.returnRate}
                        format="percent"
                        className="text-[11px] font-bold"
                        ariaLabelPrefix={`${item.name || item.symbol} 수익률`}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
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

function getHoldingPriceDescription(
  priceStatus: "AVAILABLE" | "STALE" | "MISSING" | undefined,
  priceAsOfDate: string | null | undefined,
): string {
  if (priceStatus === "MISSING") return "가격 정보를 확인할 수 없습니다";
  const eodDate = priceAsOfDate ? formatEodDate(priceAsOfDate) : null;
  if (priceStatus === "STALE") {
    return eodDate ? `${eodDate} 종가 · 이전 영업일` : "이전 영업일 종가";
  }
  return eodDate ? `${eodDate} 종가` : "종가 기준일 확인 불가";
}

function formatEodDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : date.replace(/-/g, ".");
}
