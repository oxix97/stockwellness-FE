import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, BarChart2, Sprout, TrendingUp, CloudSun, ArrowUpRight, Leaf, LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/app/components/ui";
import { AppBrandMark, ContextHeader, GardenEmptyState, Section } from "@/app/components/shared";
import { useAuthStore } from "@/store/auth";
import { useMarketIndex } from "@/hooks/use-market-index";
import { MarketIndexSection } from "@/app/components/home/MarketIndexCard";
import { getMarketWeatherPresentation } from "@/app/components/home/market-weather-presentation";
import { StockSupplyRankingSection } from "@/app/components/home/StockSupplyRankingSection";
import { SectorRankingSection } from "@/app/components/home/SectorRankingSection";
import { NewListingsSection } from "@/app/components/home/NewListingsSection";
import { SectorBottomSheet, SectorData } from "@/app/components/home/SectorBottomSheet";

export function Home() {
  const navigate = useNavigate();
  const nickname = useAuthStore((state) => state.nickname);
  const { data: marketDashboard, isLoading, isError } = useMarketIndex();
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);
  const greeting = getMarketWeatherPresentation(marketDashboard?.weather, isLoading, isError);

  const heroCards = useMemo(() => {
    return [
      {
        kind: "mood" as const,
        title: "오늘의 시장 기분",
        value: greeting.text,
        description: greeting.description,
        icon: Leaf,
        accentClassName: "bg-primary/10 text-primary",
      },
      {
        kind: "signal" as const,
        title: "오늘의 해석",
        value: isError ? "시장 데이터 재확인 필요" : "섹터 흐름부터 확인",
        description: isError
          ? "일시적으로 시장 요약을 불러오지 못했습니다."
          : "지수보다 업종 온도 차이를 먼저 읽으면 홈 구성이 더 선명하게 보입니다.",
        icon: TrendingUp,
        accentClassName: "bg-primary/12 text-primary",
      },
      {
        kind: "signal" as const,
        title: "다음 행동",
        value: "신규 상장 확인",
        description: "새로 유입된 종목과 업종 맥락을 같이 보면서 다음 탐색 흐름을 정하세요.",
        icon: Sprout,
        accentClassName: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
      },
    ];
  }, [greeting.description, greeting.text, isError]);

  return (
    <div className="min-h-full pb-6">
      <div className="page-shell page-content pt-4 md:pt-6">
        <ContextHeader
          variant="market"
          layout="split"
          eyebrow="Daily Garden"
          title={
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="max-w-[15rem] text-[length:var(--mobile-hero-title-size)] font-bold leading-[1.08] tracking-tight min-[408px]:max-w-[17rem] md:max-w-[24rem] md:text-[32px]">
                {nickname ?? "투자자"}님,
                <br />
                {greeting.text} {greeting.emoji}
              </p>
            </motion.div>
          }
          description="오늘 시장의 공기와 자산 정원의 흐름을 한 번에 파악한 뒤, 다음 행동을 결정할 수 있도록 정리했습니다."
          actions={
            <div className="relative z-20 flex flex-col items-end gap-1.5">
              <button
                onClick={() => navigate("/more/notifications")}
                className="rounded-full border border-border/70 bg-card/80 p-2 text-muted-foreground transition-colors hover:bg-card"
              >
                <Bell className="h-5 w-5" />
              </button>
              <AppBrandMark compact className="hidden opacity-80 min-[408px]:flex" />
            </div>
          }
          ornament={
            <div className="absolute bottom-4 right-4 hidden rounded-2xl border border-border/50 bg-card/70 px-3 py-2 backdrop-blur-sm md:block">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <CloudSun className="h-3.5 w-3.5 text-primary" />
                오늘의 투자 컨텍스트
              </div>
              <p className="mt-1 text-xs text-muted-foreground">시장 온도와 섹터 흐름을 먼저 읽습니다.</p>
            </div>
          }
          footer={
            <div className="grid grid-cols-1 gap-2 min-[421px]:gap-2.5 md:grid-cols-3">
              {heroCards.map((card) => (
                <div key={card.title} className="rounded-[calc(var(--mobile-card-radius)-2px)] border border-border/60 bg-card/72 px-3 py-2.5 backdrop-blur-sm md:rounded-2xl md:py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {card.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = card.icon as LucideIcon;
                        return (
                          <div className={`rounded-xl p-1.5 ${card.accentClassName}`}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                        );
                      })()}
                      <p className="text-[14px] font-bold text-foreground min-[408px]:text-[15px]">{card.value}</p>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-primary/70" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-[1.45] text-muted-foreground">{card.description}</p>
                </div>
              ))}
            </div>
          }
        />
      </div>

      <Section
        title="시장 현황"
        subtitle="대표 지수 흐름을 먼저 확인하고 오늘의 투자 감도를 맞춥니다."
        icon={BarChart2}
        className="pt-6"
        rightContent={
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/search")}>
            시장 탐색
          </Button>
        }
      >
        <MarketIndexSection />
      </Section>

      <Section
        title="오늘의 주목 섹터"
        subtitle="강한 온도 변화가 생긴 업종을 먼저 골라볼 수 있게 구성했습니다."
        icon={TrendingUp}
      >
        <SectorRankingSection onSectorClick={setSelectedSector} />
      </Section>

      <StockSupplyRankingSection />

      <StockSupplyRankingSection direction="SELL" />

      <Section
        title="신규 상장"
        subtitle="정원에 새로 들어온 종목을 업종 맥락과 함께 확인합니다."
        icon={Sprout}
      >
        <NewListingsSection />
      </Section>

      {!isLoading && !isError && !marketDashboard?.indexes?.length && (
        <div className="page-shell page-content">
          <GardenEmptyState
            title="오늘의 시장 데이터를 준비하고 있어요"
            description="잠시 후 다시 확인하면 시장 현황과 수급 흐름이 자산 정원 형태로 정리됩니다."
            actionLabel="검색으로 이동"
            onAction={() => navigate("/search")}
          />
        </div>
      )}

      <SectorBottomSheet sector={selectedSector} onClose={() => setSelectedSector(null)} />
    </div>
  );
}
