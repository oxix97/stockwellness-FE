# OAuth2 인증 기반 구축 및 소셜 로그인 연동 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OAuth2 공통 콜백 시스템을 구축하고 카카오 및 구글 로그인을 실제 서비스와 연동하여 JWT 인증을 완료합니다.

**Architecture:** `/auth/:provider/callback` 공통 라우트를 통해 모든 소셜 로그인 인가 코드를 처리하며, 기존 `apiClient`의 JWT 인터셉터와 Zustand 스토어를 활용하여 인증 상태를 관리합니다.

**Tech Stack:** React, React Router, Axios, Zustand, Sonner (Toast)

---

## Chunk 1: 기초 기반 및 라우팅 설정

### Task 1: API 타입 및 서비스 수정
**Files:**
- Modify: `src/types/api.ts`
- Modify: `src/api/auth.ts`

- [ ] **Step 1: LoginRequest 인터페이스 수정**
```typescript
export interface LoginRequest {
  code: string;
  state?: string;
  provider: "KAKAO" | "GOOGLE" | "NAVER";
}
```
- [ ] **Step 2: authApi.login 함수 수정**
  - `src/api/auth.ts`의 `login` 함수 시그니처가 `LoginRequest`를 따르도록 수정 (기존 email, nickname 필드 제거 확인).
- [ ] **Step 3: 커밋**
```bash
git add src/types/api.ts src/api/auth.ts
git commit -m "feat: update LoginRequest and authApi service"
```

### Task 2: 공통 콜백 컴포넌트 구현 (CSRF 검증 포함)
**Files:**
- Create: `src/app/components/screens/AuthCallback.tsx`

- [ ] **Step 1: 로직 작성 (State 검증 및 API 호출)**
```tsx
import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/auth";

export function AuthCallback() {
  const { provider } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const storedState = localStorage.getItem("oauth_state");

    // CSRF 검증
    if (state && state !== storedState) {
      toast.error("보안 검증에 실패했습니다. (State Mismatch)");
      navigate("/login");
      return;
    }

    if (!code || !provider) {
      toast.error("인증 정보가 올바르지 않습니다.");
      navigate("/login");
      return;
    }

    const login = async () => {
      try {
        const response = await authApi.login({
          code,
          state: state || undefined,
          provider: provider.toUpperCase() as any,
        });
        
        localStorage.removeItem("oauth_state"); // 검증 후 삭제
        setAuth(response);
        toast.success(`${response.nickname}님, 환영합니다!`);
        navigate("/");
      } catch (error) {
        console.error("Login failed:", error);
        toast.error("로그인 처리 중 오류가 발생했습니다.");
        navigate("/login");
      }
    };

    login();
  }, [provider, searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg font-medium">로그인 중입니다...</p>
      </div>
    </div>
  );
}
```
- [ ] **Step 2: 커밋**
```bash
git add src/app/components/screens/AuthCallback.tsx
git commit -m "feat: implement AuthCallback with CSRF state validation"
```

### Task 3: 라우트 등록
**Files:**
- Modify: `src/app/routes.tsx`
- Modify: `src/app/components/screens/index.ts`

- [ ] **Step 1: 컴포넌트 Export 추가**
  - `src/app/components/screens/index.ts`에 `AuthCallback` 추가.
- [ ] **Step 2: 라우트 추가**
```tsx
// src/app/routes.tsx 내 router 배열에 추가
{
  path: "/auth/:provider/callback",
  Component: AuthCallback,
},
```
- [ ] **Step 3: 커밋**
```bash
git add src/app/components/screens/index.ts src/app/routes.tsx
git commit -m "feat: register AuthCallback route"
```

---

## Chunk 2: 실제 연동 및 UI 수정

### Task 4: 로그인 페이지 버튼 연동 및 CSRF State 생성
**Files:**
- Modify: `src/app/components/screens/Login.tsx`

- [ ] **Step 1: handleSocialLogin 구현 (State 생성 포함)**
```tsx
const handleSocialLogin = (provider: "KAKAO" | "GOOGLE" | "NAVER") => {
  // CSRF 방지를 위한 랜덤 state 생성 및 저장
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem("oauth_state", state);
  
  // 백엔드 인가 엔드포인트로 이동 (state 포함)
  window.location.href = `/api/v1/auth/authorize/${provider.toLowerCase()}?state=${state}`;
};
```
- [ ] **Step 2: 커밋**
```bash
git add src/app/components/screens/Login.tsx
git commit -m "feat: implement social login with CSRF state generation"
```

### Task 5: 통합 테스트 및 예외 처리 강화
- [ ] **Step 1: 카카오 로그인 흐름 테스트**
- [ ] **Step 2: 구글 로그인 흐름 테스트**
- [ ] **Step 3: 에러 케이스(인가 코드 거부 등) 테스트 및 보완**
