import { Navigate, useLocation } from "react-router";
import { useAuthStore } from "@/store/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * 로그인 상태를 확인하여 인증되지 않은 사용자를 로그인 페이지로 리다이렉트합니다.
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();

  if (!accessToken) {
    // 현재 시도한 경로를 state로 넘겨 로그인 후 다시 돌아올 수 있게 함
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
