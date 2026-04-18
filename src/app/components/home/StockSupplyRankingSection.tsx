import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Zap } from "lucide-react";
import { Section } from "@/app/components/shared";
import { HomeBadge } from "./HomeListItem";
import { HomeCard, HomeCardSkeleton } from "./HomeCard";
import { useStockSupplyRanking } from "@/hooks/use-stock";
import { StockSupplyRankingItem, TradeDirection } from "@/types/api";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

function formatAmount(value: number) {
  if (!Number.isFinite(value)) {
    return "-";
  }

  if (value === 0) {
    return "0원";
  }

  const absValue = Math.abs(value);
  
  // 백엔드 데이터(value)가 '백만원' 단위 (ex: 203727 = 2,037억)
  // 100백만원(=1억원) 이상일 경우 억 단위로 표시
  if (absValue >= 100) {
    const inBillion = absValue / 100; 
    return `${inBillion.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억원`;
  }
  
  return `${absValue.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}백만원`;
}

function formatEffectiveDate(date: string) {
  return date.replaceAll("-", ".");
}

function formatCurrentPrice(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatFluctuationRate(value: number) {
  if (value === 0) {
    return "0.00%";
  }

  const sign = value > 0 ? "▲" : "▼";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function getTrendClassName(value: number) {
  if (value > 0) {
    return "text-up";
  }

  if (value < 0) {
    return "text-down";
  }

  return "text-muted-foreground";
}

function getSectionTitle(direction: TradeDirection) {
  return direction === "BUY" ? "기관·외국인 순매수금액 상위" : "기관·외국인 순매도금액 상위";
}

function getRankingTitle(direction: TradeDirection, channel: "institution" | "foreign") {
  if (direction === "BUY") {
    return channel === "institution" ? "기관 순매수금액 상위 TOP 10" : "외국인 순매수금액 상위 TOP 10";
  }

  return channel === "institution" ? "기관 순매도금액 상위 TOP 10" : "외국인 순매도금액 상위 TOP 10";
}

function getEmptyTitle(direction: TradeDirection, channel: "institution" | "foreign") {
  if (direction === "BUY") {
    return channel === "institution" ? "기관 순매수 데이터 없음" : "외국인 순매수 데이터 없음";
  }

  return channel === "institution" ? "기관 순매도 데이터 없음" : "외국인 순매도 데이터 없음";
}

function getNetAmountLabel(direction: TradeDirection) {
  return direction === "BUY" ? "순매수금액" : "순매도금액";
}

function getTone(direction: TradeDirection) {
  if (direction === "BUY") {
    return {
      headerDotClassName: "bg-gradient-to-r from-red-500 to-orange-400 dark:from-red-400 dark:to-orange-300",
      headerUnderlineClassName:
        "from-red-500/50 via-orange-400/40 to-transparent dark:from-red-400/55 dark:via-orange-300/35",
      sectionBadgeClassName:
        "border border-red-200/60 bg-red-500/10 text-red-600 dark:border-red-400/20 dark:bg-red-500/15 dark:text-red-300",
      topBadgeClassName:
        "border border-red-200/60 bg-red-500/12 text-red-600 dark:border-red-400/20 dark:bg-red-500/18 dark:text-red-200",
      channelBadgeClassName:
        "border border-orange-200/60 bg-orange-100/70 text-orange-700 dark:border-orange-400/15 dark:bg-orange-400/10 dark:text-orange-200",
      cardClassName:
        "min-w-[var(--mobile-scroll-card-width)] h-[calc(var(--mobile-scroll-card-height)-2px)] border-red-100/80 hover:border-red-300/40 lg:min-w-0 dark:border-red-400/10 dark:hover:border-red-400/25 dark:bg-card",
      decoration: (
        <>
          {/* Breathing Glow */}
          <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-red-400/20 blur-2xl animate-healing-breath dark:bg-red-400/25" />
          <div className="absolute left-0 top-0 h-20 w-full bg-gradient-to-br from-red-500/12 via-orange-400/8 to-transparent dark:from-red-400/16 dark:via-orange-300/10" />
          
          {/* Edge Highlight */}
          <div className="absolute left-0 top-0 h-px w-24 bg-gradient-to-r from-red-500/40 via-red-400/10 to-transparent" />
          <div className="absolute left-0 top-0 w-px h-16 bg-gradient-to-b from-red-500/40 via-red-400/10 to-transparent" />
          
          <div className="absolute left-4 top-4 h-px w-14 rotate-[-24deg] bg-gradient-to-r from-transparent via-red-300/50 to-transparent dark:via-red-300/35" />
        </>
      ),
    };
  }

  return {
    headerDotClassName: "bg-gradient-to-r from-sky-500 to-blue-500 dark:from-sky-400 dark:to-blue-300",
    headerUnderlineClassName:
      "from-sky-500/50 via-blue-400/40 to-transparent dark:from-sky-400/55 dark:via-blue-300/35",
    sectionBadgeClassName:
      "border border-blue-200/60 bg-blue-500/10 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/15 dark:text-blue-300",
    topBadgeClassName:
      "border border-blue-200/60 bg-blue-500/12 text-blue-600 dark:border-blue-400/20 dark:bg-blue-500/18 dark:text-blue-200",
    channelBadgeClassName:
      "border border-sky-200/60 bg-sky-100/70 text-sky-700 dark:border-sky-400/15 dark:bg-sky-400/10 dark:text-sky-200",
      cardClassName:
        "min-w-[var(--mobile-scroll-card-width)] h-[calc(var(--mobile-scroll-card-height)-2px)] border-sky-100/90 hover:border-sky-300/40 lg:min-w-0 dark:border-sky-400/10 dark:hover:border-sky-400/25 dark:bg-card",
    decoration: (
      <>
        {/* Breathing Glow */}
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl animate-healing-breath dark:bg-sky-400/25" />
        <div className="absolute right-0 top-0 h-20 w-full bg-gradient-to-bl from-sky-500/12 via-blue-400/8 to-transparent dark:from-sky-400/16 dark:via-blue-300/10" />
        
        {/* Edge Highlight */}
        <div className="absolute right-0 top-0 h-px w-24 bg-gradient-to-l from-sky-500/40 via-sky-400/10 to-transparent" />
        <div className="absolute right-0 top-0 w-px h-16 bg-gradient-to-b from-sky-500/40 via-sky-400/10 to-transparent" />

        <div className="absolute right-4 top-4 h-px w-16 bg-gradient-to-r from-transparent via-sky-300/50 to-transparent dark:via-sky-300/35" />
        <div className="absolute right-6 top-8 h-px w-10 bg-gradient-to-r from-transparent via-blue-200/40 to-transparent dark:via-blue-200/30" />
      </>
    ),
  };
}

function RankingCard({
  item,
  rank,
  channel,
  direction,
  onItemClick,
}: {
  item: StockSupplyRankingItem;
  rank: number;
  channel: "institution" | "foreign";
  direction: TradeDirection;
  onItemClick: (ticker: string) => void;
}) {
  const tone = getTone(direction);

  return (
    <HomeCard
      onTap={() => onItemClick(item.ticker)}
      title={item.stockName}
      surfaceDecoration={tone.decoration}
      badge={
        <div className="flex gap-1">
          <HomeBadge opacity={30} className={tone.topBadgeClassName}>TOP {rank}</HomeBadge>
          <HomeBadge opacity={10} className={tone.channelBadgeClassName}>
            {channel === "institution" ? "기관" : "외국인"}
          </HomeBadge>
        </div>
      }
      displayValue={
        <div className="flex items-center gap-2 tabular-nums">
          <span className="text-foreground">{formatCurrentPrice(item.currentPrice)}</span>
          <span className={getTrendClassName(item.fluctuationRate)}>
            {formatFluctuationRate(item.fluctuationRate)}
          </span>
        </div>
      }
      description={
        <div className="flex items-center gap-1 tabular-nums text-xs">
          <span className="text-muted-foreground">{getNetAmountLabel(direction)}</span>
          <span className={getTrendClassName(item.netBuyingAmount)}>
            {direction === "BUY" ? "▲ " : "▼ "}
            {formatAmount(item.netBuyingAmount)}
          </span>
        </div>
      }
      className={tone.cardClassName}
    />
  );
}

function EmptyRankingCard({
  direction,
  channel,
}: {
  direction: TradeDirection;
  channel: "institution" | "foreign";
}) {
  const tone = getTone(direction);

  return (
    <HomeCard
      title={getEmptyTitle(direction, channel)}
      surfaceDecoration={tone.decoration}
      displayValue={<span className="text-muted-foreground">데이터 준비 중</span>}
      description="다른 채널 수급 데이터는 계속 확인할 수 있어요."
      className={tone.cardClassName}
    />
  );
}

function RankingCarousel({
  title,
  direction,
  channel,
  items,
  onItemClick,
}: {
  title: string;
  direction: TradeDirection;
  channel: "institution" | "foreign";
  items: StockSupplyRankingItem[];
  onItemClick: (ticker: string) => void;
}) {
  const tone = getTone(direction);

  return (
    <div className="space-y-3">
      <div className="px-1">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${tone.headerDotClassName}`} />
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <HomeBadge opacity={10} className={tone.sectionBadgeClassName}>
            {channel === "institution" ? "기관" : "외국인"}
          </HomeBadge>
        </div>
        <div className={`mt-2 h-px w-24 bg-gradient-to-r ${tone.headerUnderlineClassName}`} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="responsive-scroll-row"
      >
        {items.length === 0 ? (
          <EmptyRankingCard direction={direction} channel={channel} />
        ) : (
          items.map((item, index) => (
            <RankingCard
              key={`${channel}-${item.ticker}`}
              item={item}
              rank={index + 1}
              channel={channel}
              direction={direction}
              onItemClick={onItemClick}
            />
          ))
        )}
      </motion.div>
    </div>
  );
}

export function StockSupplyRankingSection({
  direction = "BUY",
}: {
  direction?: TradeDirection;
}) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useStockSupplyRanking({
    direction,
    limit: 10,
  });

  if (isLoading) {
    return (
      <Section
        title={getSectionTitle(direction)}
        icon={Zap}
        rightContent={<span className="text-xs font-semibold text-muted-foreground">기준일 -</span>}
      >
        <div className="space-y-3">
          <div className="px-1 text-base font-bold text-foreground">{getRankingTitle(direction, "institution")}</div>
          <div className="responsive-scroll-row">
            {[1, 2, 3].map((index) => (
              <HomeCardSkeleton key={`institution-${index}`} />
            ))}
          </div>
          <div className="px-1 pt-2 text-base font-bold text-foreground">{getRankingTitle(direction, "foreign")}</div>
          <div className="responsive-scroll-row">
            {[1, 2, 3].map((index) => (
              <HomeCardSkeleton key={`foreign-${index}`} />
            ))}
          </div>
        </div>
      </Section>
    );
  }

  if (isError) {
    return (
      <Section title={getSectionTitle(direction)} icon={Zap}>
        <div className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          수급 랭킹을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.
        </div>
      </Section>
    );
  }

  if (!data || data.effectiveDate === null) {
    return (
      <Section title={getSectionTitle(direction)} icon={Zap}>
        <div className="rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          수급 데이터가 없습니다.
        </div>
      </Section>
    );
  }

  const showFallback = data.requestedDate !== null && data.requestedDate !== data.effectiveDate;

  return (
    <Section
      title={getSectionTitle(direction)}
      icon={Zap}
      rightContent={
        <span className="text-xs font-semibold text-muted-foreground">
          기준일 {formatEffectiveDate(data.effectiveDate)}
        </span>
      }
    >
      <div className="space-y-5">
        {showFallback && (
          <p className="px-1 text-xs text-muted-foreground">
            요청일 데이터가 없어 가장 가까운 기준일로 표시 중입니다.
          </p>
        )}

        <RankingCarousel
          title={getRankingTitle(direction, "institution")}
          direction={direction}
          channel="institution"
          items={data.institutionItems}
          onItemClick={(ticker) => navigate(`/stock/${ticker}`)}
        />

        <RankingCarousel
          title={getRankingTitle(direction, "foreign")}
          direction={direction}
          channel="foreign"
          items={data.foreignItems}
          onItemClick={(ticker) => navigate(`/stock/${ticker}`)}
        />
      </div>
    </Section>
  );
}
