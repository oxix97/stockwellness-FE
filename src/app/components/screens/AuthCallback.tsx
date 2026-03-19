import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { portfolioApi } from "@/api/portfolio";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;       // memberId
  email?: string;
  nickname?: string; // JWT에 포함되지 않을 수 있음
  joinedDate?: string;
}

/**
 * 백엔드 소셜 로그인 성공 후 리다이렉트 되는 페이지.
 * URL 파라미터에서 토큰을 추출하여 스토어에 저장합니다.
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setPortfolioId = useAuthStore((state) => state.setPortfolioId);

  useEffect(() => {
    const processAuth = async () => {
      const accessToken = searchParams.get("accessToken");
      const refreshToken = searchParams.get("refreshToken");
      const error = searchParams.get("error");

      if (error) {
        toast.error(`로그인 중 오류가 발생했습니다: ${error}`);
        navigate("/login");
        return;
      }

      if (!accessToken || !refreshToken) {
        toast.error("인증 정보가 누락되었습니다. 다시 시도해주세요.");
        navigate("/login");
        return;
      }

      try {
        // 1. 토큰에서 유저 정보 파싱
        const decoded: JwtPayload = jwtDecode(accessToken);

        // 2. 인증 스토어 업데이트
        setAuth({
          memberId: Number(decoded.sub),
          email: decoded.email || "",
          nickname: decoded.nickname || "사용자",
          accessToken,
          refreshToken,
          joinedDate: decoded.joinedDate || "",
        });

        // 3. 포트폴리오 정보 동적 동기화
        try {
          const portfolios = await portfolioApi.getMyPortfolios();
          if (portfolios && portfolios.length > 0) {
            setPortfolioId(String(portfolios[0].id));
          } else {
            console.warn("No portfolios found for user. Please create one.");
            // 포트폴리오가 없는 경우 빈 상태로 시작 (하드코딩된 '1' 등을 사용하지 않음)
            setPortfolioId(null);
          }
        } catch (portfolioError) {
          console.warn("Failed to fetch portfolios on login (might be a new user):", portfolioError);
          setPortfolioId(null);
        }

        toast.success(`${decoded.nickname || "사용자"}님, 환영합니다!`);
        navigate("/");
      } catch (e) {
        console.error("Token parsing error:", e);
        toast.error("인증 처리 중 오류가 발생했습니다.");
        navigate("/login");
      }
    };

    processAuth();
  }, [searchParams, navigate, setAuth, setPortfolioId]);

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
