import { ReactNode } from "react";
import { motion } from "motion/react";

interface DashboardCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function DashboardCard({ children, className = "", onClick, hoverable = true }: DashboardCardProps) {
  return (
    <motion.div
      whileTap={onClick && hoverable ? { scale: 0.98 } : undefined}
      whileHover={onClick && hoverable ? { y: -2 } : undefined}
      onClick={onClick}
      className={`bg-card rounded-card p-6 shadow-sm border border-border transition-all ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}
