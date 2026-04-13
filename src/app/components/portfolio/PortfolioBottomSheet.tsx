import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/app/components/ui/drawer";
import { Button } from "@/app/components/ui/button";
import { X } from "lucide-react";
import { DiversificationWidget } from "./widgets/DiversificationWidget";
import { RebalancingWidget } from "./widgets/RebalancingWidget";
import { SimulationWidget } from "./widgets/SimulationWidget";
import { CorrelationWidget } from "./widgets/CorrelationWidget";

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
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="relative border-b border-border pb-4">
          <DrawerTitle className="text-center text-base font-bold">
            {getTitle()}
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
