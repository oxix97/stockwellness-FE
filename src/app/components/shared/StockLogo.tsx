import { motion } from "motion/react";

interface StockLogoProps {
  /** 종목명 또는 표시할 텍스트 */
  name: string;
  /** 종목 티커 (선택 사항) */
  ticker?: string;
  /** 로고 크기 설정 (sm: 32px, md: 48px, lg: 64px) */
  size?: "sm" | "md" | "lg";
  /** 추가 스타일 클래스 */
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs rounded-lg",
  md: "w-12 h-12 text-lg rounded-2xl",
  lg: "w-16 h-16 text-2xl rounded-3xl",
};

/**
 * 주식 종목 로고 또는 이니셜 아바타 컴포넌트
 */
export function StockLogo({ name, size = "md", className = "" }: StockLogoProps) {
  const initial = name.charAt(0);
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`
        ${sizeClasses[size]} 
        bg-gradient-to-br from-primary/20 to-primary/5 
        flex items-center justify-center 
        font-bold text-primary border border-primary/10
        shadow-sm
        ${className}
      `}
    >
      {initial}
    </motion.div>
  );
}
