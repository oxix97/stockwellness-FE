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
    /**
     * 인증 정보를 설정합니다. (로그인 시 사용)
     * @param data 사용자 정보 및 토큰 세트
     */
    setAuth: (data: {
        memberId: number;
        email: string;
        nickname: string;
        accessToken: string;
        refreshToken: string
    }) => void;
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
            portfolioId: "1", // 현재는 기본값으로 설정, 실제로는 로그인 후 가져와야 함
            accessToken: null,
            setAuth: (data) => {
                set({
                    memberId: data.memberId,
                    email: data.email,
                    nickname: data.nickname,
                    accessToken: data.accessToken,
                });
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("refreshToken", data.refreshToken);
            },
            logout: () => {
                set({
                    memberId: null,
                    email: null,
                    nickname: null,
                    accessToken: null,
                });
                localStorage.clear();
            },
        }),
        {
            name: "auth-storage",
        }
    )
);
