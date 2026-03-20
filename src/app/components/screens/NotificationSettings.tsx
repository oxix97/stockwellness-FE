import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import { Switch } from "@/app/components/ui";
import { toast } from "sonner";
import { apiClient } from "@/api/client";

interface NotifSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_SETTINGS: NotifSetting[] = [
  { id: "rebalancing", label: "AI 리밸런싱 알림", description: "포트폴리오 비중 이탈 시 알림", enabled: true },
  { id: "marketAlert", label: "시장 급변 알림", description: "지수 급등락 발생 시 알림", enabled: false },
  { id: "newListing", label: "신규 상장 알림", description: "관심 섹터 신규 상장 종목 알림", enabled: false },
];

/**
 * Task #85 — 알림 설정 페이지
 * 백엔드 PUT /v1/members/me/notifications 연동 준비
 */
export function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotifSetting[]>(DEFAULT_SETTINGS);

  const handleToggle = async (id: string, value: boolean) => {
    const updated = settings.map((s) => (s.id === id ? { ...s, enabled: value } : s));
    setSettings(updated);
    try {
      await apiClient.put("/v1/members/me/notifications", {
        [id]: value,
      });
    } catch {
      // 실패 시 토글 원복
      setSettings(settings);
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
        {settings.map((setting, i) => (
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
