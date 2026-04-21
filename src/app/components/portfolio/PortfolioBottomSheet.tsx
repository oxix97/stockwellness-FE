import {
  Drawer,
  DrawerContent,
} from "@/app/components/ui/drawer";
import { DiversificationWidget } from "./widgets/DiversificationWidget";
import { RebalancingWidget } from "./widgets/RebalancingWidget";
import { SimulationWidget } from "./widgets/SimulationWidget";
import { CorrelationWidget } from "./widgets/CorrelationWidget";
import { useViewportType } from "@/app/components/ui/use-mobile";
import { DrawerSheetHeader } from "@/app/components/shared/DrawerSheetHeader";

export type AnalysisType =
  | "valuation"
  | "diversification"
  | "rebalancing"
  | "backtest"
  | "correlation";

interface PortfolioBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  type: AnalysisType | null;
}

export function PortfolioBottomSheet({
  isOpen,
  onClose,
  type,
}: PortfolioBottomSheetProps) {
  const viewport = useViewportType();
  const isDesktop = viewport === "desktop";

  const getTitle = () => {
    switch (type) {
      case "valuation":
        return "포트폴리오 평가 상세";
      case "diversification":
        return "분산도 분석";
      case "rebalancing":
        return "리밸런싱 가이드";
      case "backtest":
        return "성과 시뮬레이션";
      case "correlation":
        return "종목 간 상관관계";
      default:
        return "상세 분석";
    }
  };

  return (
    <Drawer
      open={isOpen}
      direction={isDesktop ? "right" : "bottom"}
      onOpenChange={(open) => !open && onClose()}
    >
      <DrawerContent className={isDesktop ? "h-full w-full max-w-xl" : "max-h-[85vh]"}>
        <DrawerSheetHeader title={getTitle()} />

        <div className="overflow-y-auto p-4 scrollbar-hide">
          {type === "diversification" && <DiversificationWidget />}
          {type === "rebalancing" && <RebalancingWidget />}
          {type === "backtest" && <SimulationWidget />}
          {type === "correlation" && <CorrelationWidget />}
          {type === "valuation" && (
            <div className="py-20 text-center text-muted-foreground text-sm">
              준비 중인 기능입니다.
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
