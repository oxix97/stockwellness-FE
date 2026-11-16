# 에러 처리 가이드

---

## 에러 흐름

```
API 호출 실패
      ↓
Axios 인터셉터 → ApiError 클래스로 변환
      ↓
TanStack Query error 객체
      ↓
컴포넌트 isError 분기
      ├── 복구 가능  → sonner 토스트
      └── 심각한 에러 → ErrorBoundary
```

---

## ApiError 클래스 (`src/types/api.ts`)

```ts
export class ApiError extends Error {
  status: number;
  code: string;       // 서버 비즈니스 코드 (예: 'E001')
  errors: unknown[];  // 필드별 에러 목록

  constructor(message: string, status: number, code = '', errors: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}
```

### 인터셉터에서 변환

> **이 섹션의 범위**: ApiError 클래스로 변환 — 에러 처리 부분만 다룸
> **401 토큰 재발급 흐름** (pendingQueue, isRefreshing) → `@docs/auth.md`
> 두 로직은 같은 `client.ts` 파일의 단일 response 인터셉터 안에 함께 존재함

```ts
// src/api/client.ts — response 에러 처리
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    // 401은 위에서 토큰 재발급 처리 — 여기서는 그 외 에러만 처리
    if (error.response) {
      const { status, data } = error.response;
      throw new ApiError(
        data?.message ?? '알 수 없는 오류가 발생했습니다.',
        status,
        data?.code ?? '',
        data?.errors ?? []
      );
    }
    // 네트워크 에러 (서버 응답 없음)
    throw new ApiError('네트워크 연결을 확인해주세요.', 0);
  }
);
```

---

## ErrorBoundary (`src/app/components/shared/ErrorBoundary.tsx`)

```tsx
import { Component, type ReactNode } from 'react';

interface Props {
  fallback?: ReactNode;
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <p className="text-sm text-muted-foreground">오류가 발생했습니다.</p>
          <button
            className="text-sm text-[#2EBE7A]"
            onClick={() => this.setState({ hasError: false })}
          >
            다시 시도
          </button>
        </div>
      )
    );
  }
}
```

### 사용 위치

```tsx
// 라우트 레벨 (전체 화면 에러)
<ErrorBoundary fallback={<ErrorScreen />}>
  <PortfolioScreen />
</ErrorBoundary>

// 위젯 레벨 (부분 에러 — 다른 위젯은 정상 유지)
<ErrorBoundary fallback={<ChartErrorFallback />}>
  <PortfolioChart id={id} />
</ErrorBoundary>
```

---

## sonner 토스트 사용

```ts
import { toast } from 'sonner';

// mutation onError에서 사용
onError: (error) => {
  const msg = error instanceof ApiError ? error.message : '오류가 발생했습니다.';
  toast.error(msg);
}

// 성공 알림
onSuccess: () => {
  toast.success('포트폴리오가 생성되었습니다.');
}
```

---

## Form 서버 에러 연동 (RHF + Zod)

```ts
// mutation에서 서버 필드 에러를 폼에 바인딩
mutate(values, {
  onError: (error) => {
    if (error instanceof ApiError && error.errors.length > 0) {
      // 서버가 필드별 에러를 errors 배열로 내려줄 때
      (error.errors as { field: string; message: string }[]).forEach(({ field, message }) => {
        form.setError(field as keyof FormValues, { message });
      });
    } else {
      toast.error(error instanceof ApiError ? error.message : '오류가 발생했습니다.');
    }
  },
});
```

---

## QueryClient retry 전략

```ts
// src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // 4xx 클라이언트 에러는 재시도 안 함
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        // 네트워크/서버 에러는 1회 재시도
        return failureCount < 1;
      },
    },
  },
});
```

---

## HTTP 상태 코드별 처리 가이드

| 상태 코드 | 처리 방식 |
|---|---|
| 400 | 필드 에러 → RHF `setError` 또는 toast |
| 401 | 인터셉터에서 토큰 재발급 자동 처리 |
| 403 | toast 에러 또는 접근 불가 화면 |
| 404 | 해당 화면에서 빈 상태 UI 표시 |
| 500+ | toast 에러 + ErrorBoundary |
| 0 (네트워크) | toast "네트워크 연결 확인" |
