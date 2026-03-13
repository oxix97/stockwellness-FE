import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/api/auth";

export function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSocialLogin = (type: "GOOGLE" | "KAKAO" | "NAVER") => {
    // CSRF 방지를 위한 랜덤 state 생성 및 저장
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("oauth_state", state);

    // 백엔드 인가 엔드포인트로 이동
    // 예: /api/v1/auth/authorize/kakao?state=xyz
    const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
    window.location.href = `${apiBase}/v1/auth/authorize/${type.toLowerCase()}?state=${state}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-24 pb-12">
      <div className="flex-1">
        <div className="text-primary font-bold text-4xl mb-6">Stockwellness</div>
        <div className="text-foreground font-bold text-3xl leading-snug">
          내 자산을 위한<br />
          건강한 투자 습관 시작하기
        </div>
        <div className="text-muted-foreground mt-4 text-lg">
          복잡한 주식 데이터를 한눈에 진단해 드려요.
        </div>
      </div>

      <div className="space-y-4">
        <SocialButton 
          type="KAKAO" 
          label="카카오로 시작하기" 
          bgColor="#FEE500" 
          textColor="#191919"
          onClick={() => handleSocialLogin("KAKAO")}
        />
        <SocialButton 
          type="NAVER" 
          label="네이버로 시작하기" 
          bgColor="#03C75A" 
          textColor="#FFFFFF"
          onClick={() => handleSocialLogin("NAVER")}
        />
        <SocialButton 
          type="GOOGLE" 
          label="구글로 시작하기" 
          bgColor="#FFFFFF" 
          textColor="#191919"
          border
          onClick={() => handleSocialLogin("GOOGLE")}
        />
      </div>

      <div className="mt-8 text-center">
        <div className="text-muted-foreground text-sm">
          계속 진행하면 <span className="underline">이용약관</span> 및 <span className="underline">개인정보 처리방침</span>에 동의한 것으로 간주됩니다.
        </div>
      </div>
    </div>
  );
}

function SocialButton({ label, bgColor, textColor, border, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-transform active:scale-95 ${
        border ? "border border-border" : ""
      }`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <span>{label}</span>
    </button>
  );
}
