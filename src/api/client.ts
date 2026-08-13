import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth";
import { ErrorEnvelope, ReissueResponse, SuccessEnvelope } from "@/types/api";

type UnwrappedApiClient = Omit<AxiosInstance, "get" | "post" | "put" | "patch" | "delete"> & {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
};

const axiosClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiClient = axiosClient as UnwrappedApiClient;

/** 401 에러 시 토큰 재발급 중인 상태를 나타내는 플래그 */
let isReissuing = false;
/** 재발급 중 도착한 요청들을 저장할 큐 */
type FailedQueueItem = {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let failedQueue: FailedQueueItem[] = [];

/**
 * [테스트용] 내부 상태를 초기화합니다.
 */
export const _resetInternalState = () => {
  isReissuing = false;
  failedQueue = [];
};

const processQueue = (error: unknown, token: string | null = null) => {
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
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 토큰 갱신 또는 글로벌 에러 처리
const unwrapSuccessResponse = (response: AxiosResponse<SuccessEnvelope<unknown>>) =>
  response.data?.data !== undefined ? response.data.data : response.data;

axiosClient.interceptors.response.use(
  unwrapSuccessResponse as unknown as (response: AxiosResponse) => AxiosResponse,
  async (error: AxiosError<ErrorEnvelope>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 회원가입 필요 에러 처리 (A008)
    if (error.response?.data?.code === "A008") {
      toast.error("회원가입이 필요한 기능입니다. 로그인 페이지로 이동합니다.");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // 401 에러 처리: 토큰 만료
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isReissuing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isReissuing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const { data } = await axios.post<SuccessEnvelope<ReissueResponse>>("/api/v1/auth/reissue", {
            refreshToken,
          });
          const tokens = data.data;

          // Zustand store와 localStorage를 같은 토큰 세트로 유지
          useAuthStore.getState().updateTokens({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          });
          localStorage.setItem("accessToken", tokens.accessToken);
          localStorage.setItem("refreshToken", tokens.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          processQueue(null, tokens.accessToken);
          return axiosClient(originalRequest);
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
      toast.error("접근 권한이 없습니다.");
    }

    return Promise.reject(error);
  }
);
