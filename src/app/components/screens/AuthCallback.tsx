import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

/**
 * 소셜 로그인 인가 코드를 받아 백엔드에 전달하고 인증을 완료하는 컴포넌트
 */
export function AuthCallback() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const storedState = localStorage.getItem("oauth_state");

    // OAuth2 오류 처리
    if (error) {
      toast.error(`로그인 중 오류가 발생했습니다: ${error}`);
      navigate("/login");
      return;
    }

    // CSRF 검증 (state가 존재하는 경우에만)
    if (state && state !== storedState) {
      toast.error("보안 검증에 실패했습니다. 세션이 만료되었을 수 있습니다.");
      navigate("/login");
      return;
    }

    // 필수 파라미터 확인
    if (!code || !provider) {
      toast.error("인증 정보가 올바르지 않습니다.");
      navigate("/login");
      return;
    }

    const login = async () => {
      try {
        const response = await authApi.login({
          code,
          state: state || undefined,
          provider: provider.toUpperCase() as "KAKAO" | "GOOGLE" | "NAVER",
        });
        
        // 검증 완료 후 상태 제거
        localStorage.removeItem("oauth_state");
        
        // 전역 스토어 및 토큰 저장
        setAuth(response);
        toast.success(`${response.nickname}님, 환영합니다!`);
        
        // 홈으로 이동
        navigate("/");
      } catch (err) {
        console.error("Social login failed:", err);
        toast.error("로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
        navigate("/login");
      }
    };

    login();
  }, [provider, searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        {/* 간단한 로딩 스피너 UI */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">소셜 로그인 처리 중입니다...</p>
        <p className="text-muted-foreground mt-2">잠시만 기다려 주세요.</p>
      </div>
    </div>
  );
}
