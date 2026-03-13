import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

/** 유효한 소셜 로그인 제공자 목록 */
const VALID_PROVIDERS = ["GOOGLE", "KAKAO", "NAVER"] as const;
type ProviderType = (typeof VALID_PROVIDERS)[number];

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

    /** 인증 실패 시 처리 및 클린업 */
    const fail = (message: string) => {
      toast.error(message);
      localStorage.removeItem("oauth_state");
      navigate("/login");
    };

    // 1. OAuth2 오류 응답 처리
    if (error) {
      return fail(`로그인 중 오류가 발생했습니다: ${error}`);
    }

    // 2. 제공자(Provider) 유효성 검사
    const upperProvider = provider?.toUpperCase();
    if (!upperProvider || !VALID_PROVIDERS.includes(upperProvider as any)) {
      return fail("유효하지 않은 인증 요청입니다.");
    }

    // 3. CSRF State 검증 (Strict Check)
    if (!state || state !== storedState) {
      return fail("보안 검증에 실패했습니다. 다시 시도해 주세요.");
    }

    // 4. 필수 인가 코드 검증
    if (!code) {
      return fail("인증 코드가 누락되었습니다.");
    }

    const login = async () => {
      try {
        const response = await authApi.login({
          code,
          state,
          provider: upperProvider as ProviderType,
        });
        
        // 성공 시 클린업 및 상태 업데이트
        localStorage.removeItem("oauth_state");
        setAuth(response);
        toast.success(`${response.nickname}님, 환영합니다!`);
        navigate("/");
      } catch (err) {
        console.error("Login failed:", err);
        fail("로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    };

    login();
  }, [provider, searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">소셜 로그인 처리 중입니다...</p>
        <p className="text-muted-foreground mt-2">잠시만 기다려 주세요.</p>
      </div>
    </div>
  );
}
