import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Switch } from "@/app/components/ui";
import { toast } from "sonner";
import { memberApi } from "@/api/member";
import { useNotificationSettings } from "@/hooks/use-member";

interface NotifSetting {
  id: "rebalancing" | "marketAlert" | "newListing";
  label: string;
  description: string;
  enabled: boolean;
}

const SETTING_META: Omit<NotifSetting, "enabled">[] = [
  { id: "rebalancing", label: "AI 리밸런싱 알림", description: "포트폴리오 비중 이탈 시 알림" },
  { id: "marketAlert", label: "시장 급변 알림", description: "지수 급등락 발생 시 알림" },
  { id: "newListing", label: "신규 상장 알림", description: "관심 섹터 신규 상장 종목 알림" },
];

export function NotificationSettings() {
  const navigate = useNavigate();
  const { data: serverSettings, isLoading } = useNotificationSettings();
  const [settings, setSettings] = useState<NotifSetting[]>([]);

  // 서버 응답으로 초기값 세팅
  useEffect(() => {
    if (serverSettings) {
      setSettings(
        SETTING_META.map((meta) => ({
          ...meta,
          enabled: serverSettings[meta.id],
        }))
      );
    }
  }, [serverSettings]);

  const handleToggle = async (id: string, value: boolean) => {
    const prev = settings;
    setSettings((s) => s.map((item) => (item.id === id ? { ...item, enabled: value } : item)));
    try {
      await memberApi.updateNotifications({ [id]: value });
    } catch {
      setSettings(prev);
      toast.error("설정 저장에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-1" aria-label="뒤로가기">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-foreground font-semibold">알림 설정</span>
      </div>

      {/* 설정 목록 */}
      <div className="mx-4 mt-4 bg-card rounded-2xl border border-border overflow-hidden">
        {isLoading
          ? SETTING_META.map((meta, i) => (
              <div
                key={meta.id}
                className={`flex items-center justify-between px-4 py-4 ${
                  i < SETTING_META.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="space-y-1.5">
                  <div className="h-3.5 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-6 w-11 bg-muted rounded-full animate-pulse" />
              </div>
            ))
          : settings.map((setting, i) => (
              <div
                key={setting.id}
                className={`flex items-center justify-between px-4 py-4 ${
                  i < settings.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div>
                  <p className="text-foreground font-medium text-sm">{setting.label}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{setting.description}</p>
                </div>
                <Switch
                  checked={setting.enabled}
                  onCheckedChange={(v) => handleToggle(setting.id, v)}
                />
              </div>
            ))}
      </div>
    </div>
  );
}
