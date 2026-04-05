import {create} from "zustand";
import {persist} from "zustand/middleware";

/**
 * 사용자 인증 상태 및 정보 인터페이스
 */
interface UserState {
    /** 사용자 ID (PK) */
    memberId: number | null;
    /** 이메일 */
    email: string | null;
    /** 사용자 닉네임 */
    nickname: string | null;
    /** 현재 선택된 포트폴리오 ID */
    portfolioId: string | null;
    /** 액세스 토큰 */
    accessToken: string | null;
    /** 리프레시 토큰 (BLOCKER 해결) */
    refreshToken: string | null;
    /** 가입일 (ISO-8601) */
    joinedDate: string | null;
    /**
     * 인증 정보를 설정합니다. (로그인 시 사용)
     * @param data 사용자 정보 및 토큰 세트
     */
    setAuth: (data: {
        memberId: number;
        email: string;
        nickname: string;
        accessToken: string;
        refreshToken: string;
        joinedDate: string;
    }) => void;
    /**
     * 활성 포트폴리오 ID를 설정합니다.
     * @param id 포트폴리오 ID (문자열 혹은 숫자)
     */
    setPortfolioId: (id: string | null) => void;
    /**
     * 액세스 토큰만 업데이트합니다.
     * @param accessToken 새 액세스 토큰
     */
    updateAccessToken: (accessToken: string) => void;
    /** 닉네임을 변경합니다. */
    setNickname: (nickname: string) => void;
    /**
     * 로그아웃을 수행하고 모든 상태를 초기화합니다.
     */
    logout: () => void;
}

/**
 * 전역 인증 상태 관리 스토어 (Zustand + Persist)
 */
export const useAuthStore = create<UserState>()(
    persist(
        (set) => ({
            memberId: null,
            email: null,
            nickname: null,
            portfolioId: null,
            accessToken: null,
            refreshToken: null,
            joinedDate: null,
            setAuth: (data) => {
                set({
                    memberId: data.memberId,
                    email: data.email,
                    nickname: data.nickname,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    joinedDate: data.joinedDate,
                });
                // Axios 인터셉터 등 React 외부 코드 접근용으로 유지하되, persist가 이미 관리함
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
            },
            setPortfolioId: (id) => set({ portfolioId: id }),
            updateAccessToken: (accessToken) => {
                set({ accessToken });
                localStorage.setItem("accessToken", accessToken);
            },
            setNickname: (nickname) => set({ nickname }),
            logout: () => {
                set({
                    memberId: null,
                    email: null,
                    nickname: null,
                    portfolioId: null,
                    accessToken: null,
                    refreshToken: null,
                    joinedDate: null,
                });
                localStorage.clear();
            },
        }),
        {
            name: "auth-storage",
        }
    )
);
