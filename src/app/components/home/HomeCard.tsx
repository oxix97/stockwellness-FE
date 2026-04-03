import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/app/components/ui/utils";
import { Skeleton } from "@/app/components/ui";

/**
 * 섹션별 대표 이모지 및 아이콘 반환 유틸리티 (고도화 버전)
 */
export const getSectorIcon = (name: string) => {
  const n = name.toLowerCase().replace(/\s/g, "");
  
  // IT / 기술 / 첨단산업
  if (n.includes("반도체") || n.includes("hbm") || n.includes("파운드리")) return "📟";
  if (n.includes("인공지능") || n.includes("ai") || n.includes("llm")) return "🤖";
  if (n.includes("로봇") || n.includes("협동로봇") || n.includes("자동화")) return "🦾";
  if (n.includes("우주") || n.includes("항공") || n.includes("위성")) return "🚀";
  if (n.includes("디스플레이") || n.includes("oled") || n.includes("패널")) return "🖥️";
  if (n.includes("소프트웨어") || n.includes("it서비스") || n.includes("보안")) return "💻";
  if (n.includes("메타버스") || n.includes("vr") || n.includes("ar")) return "🥽";
  if (n.includes("양자") || n.includes("퀀텀")) return "⚛️";

  // 에너지 / 자원 / 소재
  if (n.includes("2차전지") || n.includes("배터리") || n.includes("리튬") || n.includes("에너지저장")) return "🔋";
  if (n.includes("태양광") || n.includes("풍력") || n.includes("신재생")) return "🌱";
  if (n.includes("원자력") || n.includes("SMR")) return "☢️";
  if (n.includes("철강") || n.includes("금속") || n.includes("비철")) return "⛓️";
  if (n.includes("화학") || n.includes("정유") || n.includes("에너지")) return "⛽";
  if (n.includes("기계") || n.includes("중장비") || n.includes("건설")) return "🏗️";

  // 바이오 / 헬스케어
  if (n.includes("제약") || n.includes("바이오") || n.includes("백신")) return "🧪";
  if (n.includes("헬스케어") || n.includes("의료기기") || n.includes("디지털헬스")) return "🏥";
  if (n.includes("유전자") || n.includes("항암")) return "🧬";

  // 금융 / 서비스 / 기타
  if (n.includes("은행") || n.includes("금융") || n.includes("지주")) return "🏦";
  if (n.includes("증권") || n.includes("투자") || n.includes("보험")) return "📉";
  if (n.includes("엔터") || n.includes("음반") || n.includes("드라마") || n.includes("미디어")) return "🎬";
  if (n.includes("게임") || n.includes("e스포츠")) return "🎮";
  if (n.includes("유통") || n.includes("면세") || n.includes("백화점")) return "🛍️";
  if (n.includes("식품") || n.includes("음식료") || n.includes("주류")) return "🥫";
  if (n.includes("자동차") || n.includes("완성차") || n.includes("부품")) return "🚗";
  if (n.includes("조선") || n.includes("해운") || n.includes("운송")) return "🚢";
  if (n.includes("항공") || n.includes("여행") || n.includes("숙박")) return "✈️";

  return "📊";
};

interface HomeCardProps extends HTMLMotionProps<"button"> {
  title: string;
  icon?: ReactNode;
  badge?: ReactNode;
  value?: ReactNode;
  description?: ReactNode;
  onTap?: () => void;
}

/**
 * Task #74 — 홈 화면 가로 스크롤 카드 공통 컴포넌트
 */
export function HomeCard({
  title,
  icon,
  badge,
  value,
  description,
  onTap,
  className,
  ...props
}: HomeCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className={cn(
        "w-full min-w-[240px] bg-card rounded-2xl p-4 shadow-sm border border-border",
        "flex flex-col justify-between h-[150px] text-left transition-all duration-200",
        "hover:border-primary/20 hover:bg-accent/5",
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between w-full">
        <span className="text-3xl flex-shrink-0">{icon}</span>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>
      <div className="w-full overflow-hidden">
        <p className="text-foreground font-bold text-base truncate">{title}</p>
        <div className="flex flex-col gap-0.5 mt-0.5">
          {value && (
            <div className="text-sm font-semibold tabular-nums">
              {value}
            </div>
          )}
          {description && (
            <div className="text-[11px] text-muted-foreground truncate">
              {description}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/**
 * 카드 형태의 스켈레톤 로더
 */
export function HomeCardSkeleton() {
  return (
    <div className="min-w-[240px] h-[150px] bg-card rounded-2xl p-4 border border-border flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-1/2 rounded-full" />
      </div>
    </div>
  );
}
