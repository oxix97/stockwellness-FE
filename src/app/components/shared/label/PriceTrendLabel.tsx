import { motion } from "motion/react";
import { getPriceStatus } from "@/utils/calculate";
import { formatPercent } from "@/utils/format";

interface PriceTrendLabelProps {
  change: number;
  returnRate: number;
  className?: string;
  showIcon?: boolean;
}

export function PriceTrendLabel({ change, returnRate, className = "", showIcon = true }: PriceTrendLabelProps) {
  const status = getPriceStatus(change);
  
  const colorClass = status === 'up' ? "text-up" : status === 'down' ? "text-down" : "text-muted-foreground";
  const icon = status === 'up' ? "🔺" : status === 'down' ? "🔻" : "";

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-1 font-bold ${colorClass} ${className}`}
    >
      <span>{formatPercent(returnRate)}</span>
      {showIcon && icon && <span>{icon}</span>}
    </motion.div>
  );
}
