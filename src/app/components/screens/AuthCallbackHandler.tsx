import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { usePortfolioSync } from "@/hooks/use-portfolio";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;       // memberId
  email?: string;
  nickname?: string;
}

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  A003: "로그인 정보가 만료되었습니다. 다시 시도해주세요.",
  A004: "유효하지 않은 로그인 정보입니다. 다시 시도해주세요.",
  A005: "세션이 유효하지 않습니다. 다시 로그인해주세요.",
  A006: "세션 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
  A007: "소셜 로그인에 실패했습니다. 다시 시도해주세요.",
};

/**
 * 백엔드 소셜 로그인 성공 후 리다이렉트 되는 핸들러 컴포넌트.
 * URL 파라미터에서 인증 결과를 추출하여 스토어와 초기 화면 상태를 설정합니다.
 */
export function AuthCallbackHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { syncPortfolio } = usePortfolioSync();

  useEffect(() => {
    const processAuth = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const errorCode = searchParams.get("errorCode");

      if (errorCode) {
        toast.error(CALLBACK_ERROR_MESSAGES[errorCode] ?? "로그인 처리에 실패했습니다. 다시 시도해주세요.");
        navigate("/login", { replace: true });
        return;
      }

      if (!accessToken || !refreshToken) {
        toast.error("인증 정보가 누락되었습니다. 다시 시도해주세요.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        const decoded: JwtPayload = jwtDecode(accessToken);
        if (!decoded.sub) {
          throw new Error("missing-sub");
        }

        setAuth({
          memberId: Number(decoded.sub),
          email: decoded.email || "",
          nickname: decoded.nickname || "사용자",
          accessToken,
          refreshToken,
          joinedDate: null,
        });

        const portfolioId = await syncPortfolio();

        toast.success(`${decoded.nickname || "사용자"}님, 환영합니다!`);

        const redirectPath = sessionStorage.getItem("redirect_after_login") || "/";
        sessionStorage.removeItem("redirect_after_login");

        navigate(portfolioId ? redirectPath : "/portfolio", { replace: true });
      } catch {
        toast.error("인증 처리 중 오류가 발생했습니다.");
        navigate("/login", { replace: true });
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
