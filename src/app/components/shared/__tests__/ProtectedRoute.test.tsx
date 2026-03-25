import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import { ProtectedRoute } from "../ProtectedRoute";
import { useAuthStore } from "@/store/auth";

// useAuthStore Mock
vi.mock("@/store/auth", () => ({
  useAuthStore: vi.fn((selector) => selector({ accessToken: null })),
}));

/**
 * 리다이렉트 시 전달된 state를 확인하기 위한 도우미 컴포넌트
 */
function StateChecker() {
  const location = useLocation();
  return <div data-testid="redirect-state">{JSON.stringify(location.state)}</div>;
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accessToken이 없으면 /login으로 리다이렉트되고 원래 경로를 state로 넘긴다", () => {
    // 1. 비로그인 상태 (accessToken null)
    (useAuthStore as any).mockImplementation((selector: any) => selector({ accessToken: null }));

    render(
      <MemoryRouter initialEntries={["/protected-page"]}>
        <Routes>
          <Route
            path="/protected-page"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">보호된 콘텐츠</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<StateChecker />} />
        </Routes>
      </MemoryRouter>
    );

    // 보호된 콘텐츠가 렌더링되지 않아야 함
    expect(screen.queryByTestId("protected-content")).toBeNull();
    
    // /login으로 이동했어야 함 (state.from에 /protected-page 정보 포함)
    const stateDisplay = screen.getByTestId("redirect-state");
    expect(stateDisplay.textContent).toContain("/protected-page");
  });

  it("accessToken이 있으면 자녀 컴포넌트를 정상적으로 렌더링한다", () => {
    // 2. 로그인 상태 (accessToken 존재)
    (useAuthStore as any).mockImplementation((selector: any) => selector({ accessToken: "valid-token" }));

    render(
      <MemoryRouter initialEntries={["/protected-page"]}>
        <Routes>
          <Route
            path="/protected-page"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">보호된 콘텐츠</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // 보호된 콘텐츠가 성공적으로 렌더링되어야 함
    expect(screen.getByTestId("protected-content")).toBeDefined();
    expect(screen.getByText("보호된 콘텐츠")).toBeDefined();
  });
});
