import axios from "axios";

export const apiClient = axios.create({
    baseURL: "/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// 요청 인터셉터: JWT 토큰이 존재하면 헤더에 추가
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 응답 인터셉터: 토큰 갱신 또는 글로벌 에러 처리
apiClient.interceptors.response.use(
    (response) => {
        // 서버의 공통 응답 구조(Envelope)에서 실제 데이터만 추출
        // 만약 data 필드가 존재하면 그 안의 값을 반환하고, 아니면 response.data 전체를 반환
        return response.data?.data !== undefined ? response.data.data : response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // 401 에러 처리: 토큰 만료
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem("refreshToken");

            if (refreshToken) {
                try {
                    const {data} = await axios.post("/api/v1/auth/reissue", {
                        refreshToken,
                    });
                    const tokens = data.data;
                    localStorage.setItem("accessToken", tokens.accessToken);
                    localStorage.setItem("refreshToken", tokens.refreshToken);
                    originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // 갱신 실패 시 사용자 로그아웃
                    localStorage.clear();
                    window.location.href = "/login";
                }
            } else {
                localStorage.clear();
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);
