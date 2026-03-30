import axios, { AxiosResponse } from "axios";
import { useAuthStore } from "@/store/auth";
import { SuccessEnvelope } from "@/types/api";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/** 401 에러 시 토큰 재발급 중인 상태를 나타내는 플래그 */
let isReissuing = false;
/** 재발급 중 도착한 요청들을 저장할 큐 */
let failedQueue: any[] = [];

/**
 * [테스트용] 내부 상태를 초기화합니다.
 */
export const _resetInternalState = () => {
  isReissuing = false;
  failedQueue = [];
};

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 요청 인터셉터: JWT 토큰이 존재하면 헤더에 추가
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 토큰 갱신 또는 글로벌 에러 처리
apiClient.interceptors.response.use(
  (response: AxiosResponse<SuccessEnvelope<any>>) => {
    // 서버의 공통 응답 구조(Envelope)에서 실제 데이터만 추출
    // response.data가 SuccessEnvelope 형태이므로 .data를 추출함
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러 처리: 토큰 만료
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isReissuing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isReissuing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const { data } = await axios.post("/api/v1/auth/reissue", {
            refreshToken,
          });
          const tokens = data.data;

          // Zustand store 및 localStorage 업데이트
          useAuthStore.getState().updateAccessToken(tokens.accessToken);
          localStorage.setItem("refreshToken", tokens.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          processQueue(null, tokens.accessToken);
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.clear();
          useAuthStore.getState().logout();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isReissuing = false;
        }
      } else {
        localStorage.clear();
        useAuthStore.getState().logout();
        window.location.href = "/login";
        return Promise.reject(error); // 에러를 거부해야 테스트에서 감지 가능
      }
    }

    // 403 에러 처리: 접근 권한 없음 (PortfolioAccessDeniedException)
    if (error.response?.status === 403) {
      const { toast } = await import("sonner");
      toast.error("접근 권한이 없습니다.");
    }

    return Promise.reject(error);
  }
);
