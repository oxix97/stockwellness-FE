import { ReactNode, useState } from "react";
import { useNavigate } from "react-router";
import {
  User, Settings, HelpCircle, Bell, Palette, LogOut,
  Sun, Moon, Monitor, ChevronRight, Sparkles, ShieldCheck, Flower2, BadgePercent,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/app/components/ui";
import { AppBrandMark, ContextHeader, Section } from "@/app/components/shared";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useWithdraw, useUpdateProfile } from "@/hooks/use-member";
import { useAuthStore } from "@/store/auth";
import { calculateInvestorType } from "@/utils/calculate";

export function More() {
  const navigate = useNavigate();
  const { nickname, logout, joinedDate } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { holdings, valuation, health } = usePortfolio();
  const withdraw = useWithdraw();
  const investorType = calculateInvestorType(health.overallScore);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("로그아웃되었습니다.");
    navigate("/login");
  };

  const handleWithdraw = async () => {
    try {
      await withdraw.mutateAsync();
      logout();
      navigate("/login");
      toast.success("탈퇴되었습니다.");
    } catch {
      toast.error("탈퇴에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="min-h-full pb-8">
      <div className="page-shell page-content pt-4 md:pt-6">
        <ContextHeader
          variant="profile"
          layout="split"
          eyebrow="My Garden"
          title={
            <div>
              <p className="text-[length:var(--mobile-hero-title-size)] font-bold leading-tight tracking-tight text-foreground">
                {nickname ?? "투자자"}님의
                <br />
                투자 정원
              </p>
            </div>
          }
          description="프로필, 투자 성향, 앱 환경 설정을 한 화면에서 정리하고 관리할 수 있는 허브입니다."
          actions={
            <div className="flex flex-col items-end gap-2">
              <AppBrandMark compact />
              <div className="rounded-2xl border border-border/60 bg-card/72 px-3 py-2 text-right backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Identity</p>
                <p className={`mt-1 text-sm font-bold ${investorType.color}`}>{investorType.label}</p>
              </div>
            </div>
          }
          ornament={
            <div className="absolute bottom-4 right-4 flex gap-2">
              <div className="rounded-full border border-border/50 bg-card/76 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Flower2 className="h-3 w-3 text-primary" /> profile</span>
              </div>
            </div>
          }
          footer={
            <div className="grid grid-cols-2 gap-2 min-[408px]:grid-cols-3 min-[408px]:[&>*:last-child]:col-span-1 [&>*:last-child]:col-span-2">
              <MetricTile
                label="가입일"
                value={
                  joinedDate
                    ? new Date(joinedDate).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "—"
                }
              />
              <MetricTile label="보유 종목" value={`${holdings?.items?.length ?? "—"}개`} />
              <MetricTile
                label="총 수익률"
                value={
                  valuation?.totalReturnRate != null
                    ? `${valuation.totalReturnRate >= 0 ? "▲ " : "▼ "}${Math.abs(valuation.totalReturnRate).toFixed(1)}%`
                    : "—"
                }
                tone={
                  valuation?.totalReturnRate != null
                    ? valuation.totalReturnRate >= 0
                      ? "up"
                      : "down"
                    : "neutral"
                }
                icon={<BadgePercent className="h-3 w-3 text-primary/80" />}
              />
            </div>
          }
        />
      </div>

      <div className="page-shell page-content grid gap-5 pt-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-6">
          <Section
            title="투자 페르소나"
            subtitle="현재 포트폴리오 상태를 기반으로 내 투자 정체성을 정리합니다."
            icon={Sparkles}
            className="px-0 pb-0"
          >
            <div className="rounded-[28px] border border-border bg-card p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className={`text-base font-bold ${investorType.color}`}>{investorType.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    포트폴리오 건강 점수와 보유 구조를 기준으로 앱이 읽어낸 현재 투자 성향입니다.
                  </p>
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="계정 설정" subtitle="프로필과 알림 관련 설정을 관리합니다." icon={User} className="px-0 pb-0">
            <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
              <MenuItem icon={User} title="닉네임 변경" description="앱 전역에서 보이는 나의 표시 이름을 수정합니다." onClick={() => setShowNicknameModal(true)} />
              <MenuItem icon={Bell} title="알림 설정" description="리밸런싱, 관심 종목, 이벤트 알림을 관리합니다." onClick={() => navigate("/more/notifications")} isLast />
            </div>
          </Section>

          <Section title="환경 허브" subtitle="테마, 앱 환경, 지원 진입점을 같은 구조로 정리했습니다." icon={Palette} className="px-0 pb-0">
            <div className="space-y-3">
              <SettingsGroupCard
                icon={Palette}
                title="테마 설정"
                description="라이트, 다크, 시스템 모드를 같은 규칙으로 전환합니다."
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full">
                      <MenuItem
                        icon={Palette}
                        title="현재 테마"
                        description="앱 전체 색상 모드를 즉시 전환합니다."
                        trailing={
                          <span className="rounded-full border border-border/70 bg-secondary/70 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                            {theme === "dark" ? "다크" : theme === "light" ? "라이트" : "시스템"}
                          </span>
                        }
                        isLast
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36 rounded-xl">
                    <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 py-2.5 text-sm">
                      <Sun className="h-4 w-4" /> 라이트
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 py-2.5 text-sm">
                      <Moon className="h-4 w-4" /> 다크
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 py-2.5 text-sm">
                      <Monitor className="h-4 w-4" /> 시스템
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SettingsGroupCard>

              <SettingsGroupCard
                icon={Settings}
                title="앱 설정"
                description="추가 환경 설정과 실험 기능 진입점을 같은 형식으로 유지합니다."
              >
                <MenuItem
                  icon={Settings}
                  title="일반 설정"
                  description="앱 사용 환경과 이후 확장될 기능 설정을 모아둡니다."
                  onClick={() => toast.info("준비 중입니다.")}
                  isLast
                />
              </SettingsGroupCard>

              <SettingsGroupCard
                icon={HelpCircle}
                title="고객 지원"
                description="도움말, 문의, 제품 가이드를 같은 구조로 진입할 수 있게 정리했습니다."
              >
                <MenuItem
                  icon={HelpCircle}
                  title="도움 및 문의"
                  description="문의, 도움말, 제품 가이드 진입점입니다."
                  onClick={() => toast.info("준비 중입니다.")}
                  isLast
                />
              </SettingsGroupCard>
            </div>
          </Section>

          <Section title="계정" subtitle="로그아웃 및 탈퇴 관련 동작입니다." icon={LogOut} className="px-0">
            <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
              <MenuItem icon={LogOut} title="로그아웃" description="현재 계정 세션을 종료하고 로그인 화면으로 돌아갑니다." onClick={handleLogout} />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex w-full items-center justify-between px-4 py-4 text-left">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-4 w-4 rounded-full bg-red-500/12" />
                      <div>
                        <span className="block text-sm font-medium text-red-500">회원 탈퇴</span>
                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                          포트폴리오와 관심 종목 데이터를 포함한 계정 정보를 모두 삭제합니다.
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent className="mx-4 rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                      탈퇴 시 모든 포트폴리오와 관심 종목 데이터가 영구 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWithdraw} className="rounded-xl bg-red-500 hover:bg-red-600">
                      탈퇴하기
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Section>
        </div>
      </div>

      <p className="mt-6 mb-4 text-center text-xs text-muted-foreground">
        Stockwellness v1.0.0 · © 2026 Stockwellness
      </p>

      <NicknameEditModal
        open={showNicknameModal}
        currentNickname={nickname ?? ""}
        onClose={() => setShowNicknameModal(false)}
      />
    </div>
  );
}

function NicknameEditModal({
  open, currentNickname, onClose,
}: {
  open: boolean;
  currentNickname: string;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentNickname);
  const updateProfile = useUpdateProfile();

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      await updateProfile.mutateAsync(trimmed);
      toast.success("닉네임이 변경되었습니다.");
      onClose();
    } catch {
      toast.error("닉네임 변경에 실패했습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="mx-4 rounded-2xl">
        <DialogHeader>
          <DialogTitle>닉네임 변경</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="새 닉네임 입력"
            maxLength={20}
            className="h-11 w-full rounded-xl bg-secondary px-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-xl bg-secondary py-3 text-sm font-semibold text-foreground">
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={updateProfile.isPending || !value.trim()}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              {updateProfile.isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MenuItem({
  icon: Icon, title, description, onClick, trailing, isLast = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick?: () => void;
  trailing?: ReactNode;
  isLast?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between px-4 py-4 text-left ${!isLast ? "border-b border-border" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl bg-secondary/75 p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <span className="block text-sm font-medium text-foreground">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {trailing}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
      </div>
    </button>
  );
}

function SettingsGroupCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_18px_36px_-30px_rgba(15,23,42,0.35)]">
      <div className="border-b border-border/80 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "up" | "down";
  icon?: ReactNode;
}) {
  const toneClassName = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-foreground";

  return (
    <div className="rounded-[calc(var(--mobile-card-radius)-2px)] border border-border/60 bg-card/70 px-3 py-3 text-center md:rounded-2xl">
      <div className="flex items-center justify-center gap-1">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-1 text-sm font-bold tabular-nums ${toneClassName}`}>{value}</p>
    </div>
  );
}
