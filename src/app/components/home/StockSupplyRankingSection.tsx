import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Zap } from "lucide-react";
import { Section } from "@/app/components/shared";
import { HomeBadge } from "./HomeListItem";
import { HomeCard, HomeCardSkeleton } from "./HomeCard";
import { useStockSupplyRanking } from "@/hooks/use-stock";
import { StockSupplyRankingItem, TradeDirection } from "@/types/api";
import { formatPercent } from "@/utils/format";
import { getTrendClassName } from "@/utils/trend";
import { getHomeCardTone } from "./home-card-tone";

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
  const tone = getHomeCardTone(direction === "BUY" ? "up" : "down");

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
            {formatPercent(item.fluctuationRate).replace(" ", "")}
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
  const tone = getHomeCardTone(direction === "BUY" ? "up" : "down");

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
  const tone = getHomeCardTone(direction === "BUY" ? "up" : "down");

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
