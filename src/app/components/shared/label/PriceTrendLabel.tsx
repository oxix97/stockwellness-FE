import { motion } from "motion/react";
import { formatPercent } from "@/utils/format";
import { getTrendClassName, getTrendTone } from "@/utils/trend";

interface PriceTrendLabelProps {
  change: number;
  returnRate: number;
  className?: string;
  showIcon?: boolean;
}

export function PriceTrendLabel({ change, returnRate, className = "", showIcon = true }: PriceTrendLabelProps) {
  const status = getTrendTone(change);
  const colorClass = getTrendClassName(change);
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
