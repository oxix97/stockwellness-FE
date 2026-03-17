# OAuth2 인증 보안 및 안정성 강화 구현 계획

> **For agentic workers:** REQUIRED: Use superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 코드 리뷰 피드백을 반영하여 CSRF 보안을 강화하고, 런타임 타입 안전성을 확보하며, 코드 품질을 개선합니다.

**Architecture:** `AuthCallback` 컴포넌트의 가드 로직을 강화하고, `state` 검증의 엄격함을 높여 보안 취약점을 해결합니다.

**Tech Stack:** React, TypeScript, LocalStorage, Sonner (Toast)

---

## Chunk 1: 보안 및 타입 안전성 강화

### Task 1: AuthCallback 컴포넌트 로직 보완
**Files:**
- Modify: `src/app/components/screens/AuthCallback.tsx`

- [ ] **Step 1: 유효한 제공자 상수 정의 (컴포넌트 외부)**
- [ ] **Step 2: 모든 종료 시점에서 State 클린업 보장 로직 구현**
- [ ] **Step 3: 필수 파라미터(code), CSRF State, 제공자 가드 로직 강화**

```tsx
const VALID_PROVIDERS = ["GOOGLE", "KAKAO", "NAVER"] as const;
type ProviderType = (typeof VALID_PROVIDERS)[number];

export function AuthCallback() {
  // ... 생략 ...
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const storedState = localStorage.getItem("oauth_state");
    
    const fail = (message: string) => {
      toast.error(message);
      localStorage.removeItem("oauth_state");
      navigate("/login");
    };

    if (error) return fail(`로그인 중 오류가 발생했습니다: ${error}`);

    // 제공자 검증
    const upperProvider = provider?.toUpperCase();
    if (!upperProvider || !VALID_PROVIDERS.includes(upperProvider as any)) {
      return fail("유효하지 않은 인증 요청입니다.");
    }

    // CSRF State 검증
    if (!state || state !== storedState) {
      return fail("보안 검증에 실패했습니다. 다시 시도해 주세요.");
    }

    // 필수 코드 검증
    if (!code) {
      return fail("인증 코드가 누락되었습니다.");
    }

    const login = async () => {
      try {
        const response = await authApi.login({
          code,
          state,
          provider: upperProvider as ProviderType,
        });
        localStorage.removeItem("oauth_state");
        setAuth(response);
        toast.success(`${response.nickname}님, 환영합니다!`);
        navigate("/");
      } catch (err) {
        console.error("Login failed:", err);
        fail("로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
      }
    };

    login();
  }, [provider, searchParams, navigate, setAuth]);
  // ... 생략 ...
}
```

- [ ] **Step 4: 커밋**
```bash
git add src/app/components/screens/AuthCallback.tsx
git commit -m "security: strengthen parameter validation and state cleanup in AuthCallback"
```

---

## Chunk 2: 코드 품질 개선 및 정리

### Task 2: 인덱스 파일 정렬 정리
**Files:**
- Modify: `src/app/components/screens/index.ts`

- [ ] **Step 1: Export 구문 알파벳 순 정렬**
- [ ] **Step 2: 커밋**
```bash
git add src/app/components/screens/index.ts
git commit -m "style: sort exports alphabetically in screens index"
```

### Task 3: API 경로 구성 리팩토링
**Files:**
- Modify: `src/app/components/screens/Login.tsx`

- [ ] **Step 1: API 경로 구성을 더 명확하게 수정**
- [ ] **Step 2: 커밋**
```bash
git add src/app/components/screens/Login.tsx
git commit -m "refactor: clarify API path construction in Login screen"
```
