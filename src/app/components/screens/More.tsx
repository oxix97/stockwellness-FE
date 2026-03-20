import { useState } from "react";
import { useNavigate } from "react-router";
import {
  User, Settings, HelpCircle, Bell, Palette, LogOut,
  Sun, Moon, Monitor, ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/app/components/ui";
import { usePortfolio } from "@/hooks/use-portfolio";
import { apiClient } from "@/api/client";

/**
 * Task #84 ~ #87 — 마이 탭 완성
 * - 닉네임 변경 모달 (#84)
 * - 알림 설정 라우팅 (#85)
 * - 회원 탈퇴 AlertDialog (#86)
 * - 메뉴 항목 연결 (#87)
 */
export function More() {
  const navigate = useNavigate();
  const { nickname, logout, joinedDate, setAuth } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { holdings, valuation } = usePortfolio();
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("로그아웃되었습니다.");
    navigate("/login");
  };

  const handleWithdraw = async () => {
    try {
      await apiClient.delete("/v1/members/me");
      logout();
      navigate("/login");
      toast.success("탈퇴되었습니다.");
    } catch {
      toast.error("탈퇴에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className="min-h-full pb-6">
      {/* 프로필 카드 */}
      <div className="px-4 pt-4 pb-3">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-foreground font-bold text-lg">{nickname ?? "투자자"}님</p>
              <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-semibold">
                안정형 투자자
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-primary/10">
            <MetricItem
              label="가입일"
              value={
                joinedDate
                  ? new Date(joinedDate).toLocaleDateString("ko-KR", {
                      year: "numeric", month: "2-digit",
                    }).slice(0, 7)
                  : "—"
              }
            />
            <MetricItem label="보유 종목" value={`${holdings?.items?.length ?? "—"}개`} />
            <MetricItem
              label="총 수익률"
              value={
                valuation?.totalReturnRate != null
                  ? `${valuation.totalReturnRate >= 0 ? "+" : ""}${valuation.totalReturnRate.toFixed(1)}%`
                  : "—"
              }
              highlight={!!valuation?.totalReturnRate}
            />
          </div>
        </div>
      </div>

      {/* 계정 설정 */}
      <SectionTitle label="계정 설정" />
      <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
        {/* 닉네임 변경 */}
        <MenuItem
          icon={User}
          title="닉네임 변경"
          onClick={() => setShowNicknameModal(true)}
        />
        {/* 알림 설정 */}
        <MenuItem
          icon={Bell}
          title="알림 설정"
          onClick={() => navigate("/more/notifications")}
          isLast
        />
      </div>

      {/* 앱 설정 */}
      <SectionTitle label="앱 설정" />
      <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
        {/* 테마 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between px-4 py-3.5 border-b border-border text-left">
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground text-sm font-medium">테마 설정</span>
              </div>
              <span className="text-muted-foreground text-xs">
                {theme === "dark" ? "다크" : theme === "light" ? "라이트" : "시스템"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 rounded-xl">
            <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 py-2.5 text-sm">
              <Sun className="w-4 h-4" /> 라이트
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 py-2.5 text-sm">
              <Moon className="w-4 h-4" /> 다크
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 py-2.5 text-sm">
              <Monitor className="w-4 h-4" /> 시스템
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 앱 설정, 고객 지원 */}
        <MenuItem
          icon={Settings}
          title="앱 설정"
          onClick={() => toast.info("준비 중입니다.")}
        />
        <MenuItem
          icon={HelpCircle}
          title="고객 지원"
          onClick={() => toast.info("준비 중입니다.")}
          isLast
        />
      </div>

      {/* 로그아웃 */}
      <SectionTitle label="계정" />
      <div className="mx-4 bg-card rounded-2xl border border-border overflow-hidden">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border text-left"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground text-sm font-medium">로그아웃</span>
        </button>

        {/* 회원 탈퇴 — AlertDialog */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <span className="w-4 h-4" />
              <span className="text-red-500 text-sm font-medium">회원 탈퇴</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle>정말 탈퇴하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                탈퇴 시 모든 포트폴리오와 관심 종목 데이터가 영구 삭제됩니다.
                이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleWithdraw}
                className="bg-red-500 hover:bg-red-600 rounded-xl"
              >
                탈퇴하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* 버전 */}
      <p className="text-center text-muted-foreground text-xs mt-6 mb-4">
        Stockwellness v1.0.0 · © 2026 Stockwellness
      </p>

      {/* 닉네임 변경 모달 */}
      <NicknameEditModal
        open={showNicknameModal}
        currentNickname={nickname ?? ""}
        onClose={() => setShowNicknameModal(false)}
      />
    </div>
  );
}

// ── 닉네임 변경 모달 (#84) ─────────────────────────────────
function NicknameEditModal({
  open, currentNickname, onClose,
}: {
  open: boolean;
  currentNickname: string;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentNickname);
  const [saving, setSaving] = useState(false);
  const { setNickname } = useAuthStore();

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await apiClient.put("/v1/members/me", { nickname: trimmed });
      setNickname(trimmed);
      toast.success("닉네임이 변경되었습니다.");
      onClose();
    } catch {
      toast.error("닉네임 변경에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-2xl mx-4">
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
            className="w-full h-11 bg-secondary rounded-xl px-4 text-foreground placeholder:text-muted-foreground outline-none text-[15px]"
          />
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !value.trim()}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold text-sm disabled:opacity-40"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 공통 서브 컴포넌트 ─────────────────────────────────────
function SectionTitle({ label }: { label: string }) {
  return (
    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider px-4 pt-5 pb-2">
      {label}
    </p>
  );
}

function MenuItem({
  icon: Icon, title, onClick, isLast = false,
}: {
  icon: React.ElementType;
  title: string;
  onClick: () => void;
  isLast?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${
        !isLast ? "border-b border-border" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-foreground text-sm font-medium">{title}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50" />
    </button>
  );
}

function MetricItem({
  label, value, highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className={`font-bold text-sm ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
