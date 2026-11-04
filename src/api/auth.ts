import { apiClient } from "./client";
import { LoginResponse, ReissueRequest, ReissueResponse } from "@/types/api";

/**
 * 인증 및 사용자 계정 관련 API 호출 객체
 */
export const authApi = {
  /** OAuth 콜백의 일회용 코드를 인증 정보로 교환합니다. */
  exchange: async (code: string): Promise<LoginResponse> => {
    const data = await apiClient.post<LoginResponse>("/v1/auth/exchange", { code });
    return data;
  },

  /** 서버 세션을 종료합니다. 로컬 상태 정리는 useLogout이 담당합니다. */
  logout: async (): Promise<void> => {
    await apiClient.post("/v1/auth/logout");
  },

  /**
   * 만료된 액세스 토큰을 리프레시 토큰을 사용하여 재발급합니다.
   * @param params 리프레시 토큰
   * @returns 새 토큰 세트
   */
  reissue: async (params: ReissueRequest): Promise<ReissueResponse> => {
    const data = await apiClient.post<ReissueResponse>("/v1/auth/reissue", params);
    return data;
  },
};
