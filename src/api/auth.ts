import { apiClient } from "./client";
import { LoginRequest, LoginResponse, ReissueRequest, ReissueResponse } from "@/types/api";

/**
 * 인증 및 사용자 계정 관련 API 호출 객체
 */
export const authApi = {
  /**
   * 지원용 로그인 API를 호출합니다.
   * 브라우저 기본 OAuth 완료 경로는 백엔드 redirect -> /auth/callback 소비 플로우를 사용합니다.
   * @param params 로그인 식별 정보 (email, nickname, loginType)
   * @returns 로그인 성공 시 사용자 정보 및 토큰 세트
   */
  login: async (params: LoginRequest): Promise<LoginResponse> => {
    const data = await apiClient.post("/v1/auth/login", params);
    return data as unknown as LoginResponse;
  },

  /**
   * 로그아웃을 수행하고 로컬 스토리지를 비웁니다.
   */
  logout: async (): Promise<void> => {
    await apiClient.post("/v1/auth/logout");
    localStorage.clear();
  },

  /**
   * 만료된 액세스 토큰을 리프레시 토큰을 사용하여 재발급합니다.
   * @param params 리프레시 토큰
   * @returns 새 토큰 세트
   */
  reissue: async (params: ReissueRequest): Promise<ReissueResponse> => {
    const data = await apiClient.post("/v1/auth/reissue", params);
    return data as unknown as ReissueResponse;
  },
};
