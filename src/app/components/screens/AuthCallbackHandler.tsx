import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { usePortfolioSync } from "@/hooks/use-portfolio";
import { useExchange } from "@/hooks/use-auth";

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  A003: "로그인 정보가 만료되었습니다. 다시 시도해주세요.",
  A004: "유효하지 않은 로그인 정보입니다. 다시 시도해주세요.",
  A005: "세션이 유효하지 않습니다. 다시 로그인해주세요.",
  A006: "세션 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
  A007: "소셜 로그인에 실패했습니다. 다시 시도해주세요.",
};

/**
 * OAuth 콜백의 일회용 code를 교환한 뒤에만 인증 상태를 저장합니다.
 */
export function AuthCallbackHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const setPortfolioId = useAuthStore((state) => state.setPortfolioId);
  const queryClient = useQueryClient();
  const { syncPortfolio } = usePortfolioSync();
  const { mutateAsync: exchange } = useExchange();
  const processedCode = useRef<string | null>(null);

  useEffect(() => {
    const errorCode = searchParams.get("errorCode");
    if (errorCode) {
      toast.error(CALLBACK_ERROR_MESSAGES[errorCode] ?? "로그인 처리에 실패했습니다. 다시 시도해주세요.");
      navigate("/login", { replace: true });
      return;
    }

    if (processedCode.current) {
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      toast.error("로그인 처리에 실패했습니다. 다시 시도해주세요.");
      navigate("/login", { replace: true });
      return;
    }

    processedCode.current = code;
    const sanitizedParams = new URLSearchParams(searchParams);
    sanitizedParams.delete("code");
    setSearchParams(sanitizedParams, { replace: true });

    const processAuth = async () => {
      try {
        const login = await exchange(code);
        // A persisted query cache and portfolio ID belong to the previous member.
        // Remove both before publishing the new auth state so member-scoped hooks
        // cannot render or request the previous member's data during the switch.
        queryClient.clear();
        setPortfolioId(null);
        setAuth({
          memberId: login.memberId,
          email: login.email,
          nickname: login.nickname,
          accessToken: login.accessToken,
          refreshToken: login.refreshToken,
          joinedDate: login.joinedDate ?? null,
        });

        const portfolioId = await syncPortfolio();
        toast.success(`${login.nickname}님, 환영합니다!`);

        const redirectPath = sessionStorage.getItem("redirect_after_login") || "/";
        sessionStorage.removeItem("redirect_after_login");
        navigate(portfolioId ? redirectPath : "/portfolio", { replace: true });
      } catch {
        toast.error("로그인 처리에 실패했습니다. 다시 시도해주세요.");
        navigate("/login", { replace: true });
      }
    };

    void processAuth();
  }, [exchange, navigate, queryClient, searchParams, setAuth, setPortfolioId, setSearchParams, syncPortfolio]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-lg font-medium">로그인 완료 처리 중입니다...</p>
        <p className="text-muted-foreground mt-2">잠시만 기다려 주세요.</p>
      </div>
    </div>
  );
}
