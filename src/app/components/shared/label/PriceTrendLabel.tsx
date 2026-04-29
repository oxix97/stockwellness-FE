import { motion } from "motion/react";
import { SignedValueLabel } from "./SignedValueLabel";

interface PriceTrendLabelProps {
  change: number;
  returnRate: number;
  className?: string;
  showIcon?: boolean;
}

export function PriceTrendLabel({ change, returnRate, className = "", showIcon = true }: PriceTrendLabelProps) {
  const label = change > 0 ? "가격 상승률" : change < 0 ? "가격 하락률" : "가격 보합률";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-1 font-bold ${className}`}
    >
      <SignedValueLabel value={returnRate} format="percent" showArrow={showIcon} ariaLabelPrefix={label} />
    </motion.div>
  );
}
