import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

/** OAuth 콜백의 일회용 코드를 인증 정보로 교환합니다. */
export function useExchange() {
  return useMutation({
    mutationFn: (code: string) => authApi.exchange(code),
  });
}

/**
 * 서버 로그아웃 결과와 무관하게 현재 사용자의 인증 및 서버 캐시를 폐기합니다.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      queryClient.clear();
      clearAuth();
    },
  });
}
