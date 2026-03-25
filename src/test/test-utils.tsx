import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, render } from "@testing-library/react";
import type { RenderHookOptions, RenderOptions } from "@testing-library/react";
import { useAuthStore } from "@/store/auth";

/**
 * retry: false QueryClient 생성 — 테스트에서 재시도 없이 즉시 실패 처리
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

/**
 * QueryClientProvider 래퍼 팩토리
 * renderHook / render 의 wrapper 옵션에 사용한다.
 */
export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient ?? createTestQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * QueryClientProvider를 포함한 renderHook 래퍼
 */
export function renderHookWithQuery<TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper"> & { queryClient?: QueryClient }
) {
  const { queryClient, ...rest } = options ?? {};
  return renderHook(hook, { wrapper: createWrapper(queryClient), ...rest });
}

/**
 * QueryClientProvider를 포함한 render 래퍼
 */
export function renderWithQuery(ui: React.ReactElement, options?: Omit<RenderOptions, "wrapper"> & { queryClient?: QueryClient }) {
  const { queryClient, ...rest } = options ?? {};
  return render(ui, { wrapper: createWrapper(queryClient), ...rest });
}

/**
 * Zustand auth store에 인증 상태를 주입한다.
 */
export function setAuthState(overrides?: Partial<Parameters<ReturnType<typeof useAuthStore.getState>["setAuth"]>[0] & { portfolioId: string }>) {
  const store = useAuthStore.getState();
  store.setAuth({
    memberId: overrides?.memberId ?? 1,
    email: overrides?.email ?? "test@example.com",
    nickname: overrides?.nickname ?? "테스터",
    accessToken: overrides?.accessToken ?? "mock-access-token",
    refreshToken: overrides?.refreshToken ?? "mock-refresh-token",
    joinedDate: overrides?.joinedDate ?? "2026-01-01T00:00:00",
  });
  if (overrides?.portfolioId !== undefined) {
    store.setPortfolioId(overrides.portfolioId);
  }
}

/**
 * auth store를 초기 상태로 되돌린다.
 */
export function clearAuthState() {
  useAuthStore.getState().logout();
}
