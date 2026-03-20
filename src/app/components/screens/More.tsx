import { useNavigate } from "react-router";
import { User, Settings, HelpCircle, Shield, Bell, Palette, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { PageHeader } from "@/app/components/shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { usePortfolio } from "@/hooks/use-portfolio";

export function More() {
  const navigate = useNavigate();
  const { nickname, logout, joinedDate } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { holdings, valuation } = usePortfolio();

  const handleLogout = () => {
    logout();
    toast.success("로그아웃되었습니다.");
    navigate("/login");
  };

  const menuItems = [
    { id: 1, icon: User, title: "내 프로필", description: "투자 성향 및 개인정보 관리" },
    { id: 2, icon: Shield, title: "위험 성향 설정", description: "내 투자 성향 진단 및 설정" },
    { id: 3, icon: Bell, title: "알림 설정", description: "주가 알림 및 리포트 수신 설정" },
    { 
      id: 4, 
      icon: Palette, 
      title: "테마 설정", 
      description: `현재 테마: ${theme === "dark" ? "다크" : theme === "light" ? "라이트" : "시스템"}`,
      isThemeToggle: true 
    },
    { id: 5, icon: Settings, title: "앱 설정", description: "일반 설정 및 계정 관리" },
    { id: 6, icon: HelpCircle, title: "고객 지원", description: "FAQ 및 1:1 문의" },
  ];

  return (
    <div className="min-h-full pb-20">
      <PageHeader title="전체" />

      {/* 프로필 카드 */}
      <div className="px-6 py-8">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl p-8 border border-primary/20 shadow-sm">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <div>
              <div className="text-foreground mb-1 font-bold text-2xl">
                {nickname || "투자자"}님
              </div>
              <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold inline-block">
                안정형 투자자
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-primary/10">
            <MetricItem
              label="가입일"
              value={
                joinedDate
                  ? new Date(joinedDate).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit" }).replace(". ", ".").replace(".", "").slice(0, 7)
                  : "2024.01"
              }
            />
            <MetricItem label="보유 종목" value={`${holdings?.items?.length ?? "-"}개`} />
            <MetricItem
              label="총 수익률"
              value={
                valuation?.totalReturnRate != null
                  ? `${valuation.totalReturnRate >= 0 ? "+" : ""}${valuation.totalReturnRate.toFixed(1)}%`
                  : "-"
              }
              highlight
            />
          </div>
        </div>
      </div>

      {/* 메뉴 항목 */}
      <div className="px-6 pb-8">
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            
            if (item.isThemeToggle) {
              return (
                <DropdownMenu key={item.id}>
                  <DropdownMenuTrigger asChild>
                    <button className={`w-full px-6 py-5 flex items-center gap-4 text-left active:bg-accent transition-colors ${index !== menuItems.length - 1 ? "border-b border-border" : ""}`}>
                      <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="text-foreground mb-1 font-bold">{item.title}</div>
                        <div className="text-muted-foreground text-xs font-medium">{item.description}</div>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-2xl">
                    <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 py-3">
                      <Sun className="w-4 h-4" /> 라이트 모드
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 py-3">
                      <Moon className="w-4 h-4" /> 다크 모드
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 py-3">
                      <Monitor className="w-4 h-4" /> 시스템 설정
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <button
                key={item.id}
                className={`w-full px-6 py-5 flex items-center gap-4 text-left active:bg-accent transition-colors ${
                  index !== menuItems.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-foreground mb-1 font-bold">
                    {item.title}
                  </div>
                  <div className="text-muted-foreground text-xs font-medium">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="w-full px-6 py-6 flex items-center gap-4 text-left text-destructive hover:bg-destructive/5 transition-colors"
          >
            <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <LogOut className="w-6 h-6 text-destructive" />
            </div>
            <div className="font-bold">로그아웃</div>
          </button>
          </div>
          </div>

          {/* 버전 정보 */}
          <div className="px-6 pb-8 text-center">
          <div className="text-muted-foreground text-sm font-medium">
          Stockwellness v1.0.0
          </div>
          <div className="text-muted-foreground text-xs mt-2 opacity-60">
          © 2026 Stockwellness. All rights reserved.
          </div>
          </div>
    </div>
  );
}

function MetricItem({ label, value, highlight }: any) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] mb-1 font-bold uppercase tracking-wider">{label}</div>
      <div className={`${highlight ? "text-[#FF4756]" : "text-foreground"} font-bold text-base`}>
        {value}
      </div>
    </div>
  );
}
