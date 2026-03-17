import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string; // memberId
  email: string;
  nickname: string;
  // ... 기타 클레임들
}

/**
 * 백엔드 소셜 로그인 성공 후 리다이렉트 되는 페이지.
 * URL 파라미터에서 토큰을 추출하여 스토어에 저장합니다.
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
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
      // 1. 토큰에서 유저 정보 파싱 (혹은 백엔드 응답 형식에 맞춰 하드코딩/수정)
      // 주의: 백엔드에서 생성하는 JWT 페이로드 구조에 따라 수정이 필요할 수 있습니다.
      const decoded: JwtPayload = jwtDecode(accessToken);

      // 2. 인증 스토어 업데이트
      setAuth({
        memberId: Number(decoded.sub), // 이 부분은 백엔드 토큰 구조에 맞춰 조정 필요
        email: decoded.email || "",
        nickname: decoded.nickname || "사용자",
        accessToken,
        refreshToken,
      });

      toast.success(`${decoded.nickname || "사용자"}님, 환영합니다!`);
      navigate("/");
    } catch (e) {
      console.error("Token parsing error:", e);
      toast.error("인증 처리 중 오류가 발생했습니다.");
      navigate("/login");
    }
  }, [searchParams, navigate, setAuth]);

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
