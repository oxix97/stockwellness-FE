import { apiClient } from "./client";
import { LoginRequest, LoginResponse, ReissueRequest, ReissueResponse } from "@/types/api";

/**
 * 인증 및 사용자 계정 관련 API 호출 객체
 */
export const authApi = {
  /**
   * 사용자 로그인을 수행합니다. (OAuth2)
   * @param params 로그인 정보 (인가 코드, 상태 값, 제공자)
   * @returns 로그인 성공 시 사용자 정보 및 토큰 세트
   */
  login: async (params: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post("/v1/auth/login", params);
    return data;
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
    const { data } = await apiClient.post("/v1/auth/reissue", params);
    return data;
  },
};
