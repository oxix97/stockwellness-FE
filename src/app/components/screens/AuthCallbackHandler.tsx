import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { usePortfolioSync } from "@/hooks/use-portfolio";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;       // memberId
  email?: string;
  nickname?: string; // JWT에 포함되지 않을 수 있음
  joinedDate?: string;
}

/**
 * 백엔드 소셜 로그인 성공 후 리다이렉트 되는 핸들러 컴포넌트.
 * URL 파라미터에서 토큰(accessToken 또는 token)을 추출하여 스토어에 저장합니다.
 */
export function AuthCallbackHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { syncPortfolio } = usePortfolioSync();

  useEffect(() => {
    const processAuth = async () => {
      // 1. URL 파라미터 추출 (accessToken 또는 token 둘 다 지원)
      const accessToken = searchParams.get("accessToken") || searchParams.get("token");
      const refreshToken = searchParams.get("refreshToken");
      const error = searchParams.get("error");

      if (error) {
        toast.error(`로그인 중 오류가 발생했습니다: ${error}`);
        navigate("/login");
        return;
      }

      // 액세스 토큰이 없는 경우 처리
      if (!accessToken) {
        toast.error("인증 정보가 누락되었습니다. 다시 시도해주세요.");
        navigate("/login");
        return;
      }

      try {
        // 2. 토큰에서 유저 정보 파싱
        const decoded: JwtPayload = jwtDecode(accessToken);

        // 3. 인증 스토어 업데이트
        setAuth({
          memberId: Number(decoded.sub),
          email: decoded.email || "",
          nickname: decoded.nickname || "사용자",
          accessToken,
          // 리프레시 토큰이 없더라도 로그인은 가능하게 처리 (선택적)
          refreshToken: refreshToken || "",
          joinedDate: decoded.joinedDate || "",
        });

        // 4. 포트폴리오 정보 동적 동기화
        await syncPortfolio();

        toast.success(`${decoded.nickname || "사용자"}님, 환영합니다!`);

        // 5. 로그인 전 가려던 페이지로 복귀 (Login.tsx에서 저장함)
        const redirectPath = sessionStorage.getItem("redirect_after_login") || "/";
        sessionStorage.removeItem("redirect_after_login");
        
        navigate(redirectPath, { replace: true });
      } catch {
        toast.error("인증 처리 중 오류가 발생했습니다.");
        navigate("/login");
      }
    };

    processAuth();
  }, [searchParams, navigate, setAuth, syncPortfolio]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">로그인 완료 처리 중입니다...</p>
        <p className="text-muted-foreground mt-2">잠시만 기다려 주세요.</p>
      </div>
    </div>
  );
}
