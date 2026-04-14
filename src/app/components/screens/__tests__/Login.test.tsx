import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { Login } from "../Login";
import { renderWithQuery } from "@/test/test-utils";

describe("Login Screen", () => {
  beforeEach(() => {
    sessionStorage.clear();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        href: "http://localhost:5173/login",
      },
    });
  });

  it("브랜드 히어로와 소셜 로그인 버튼을 렌더링한다", () => {
    renderWithQuery(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByText("Stockwellness")).toBeInTheDocument();
    expect(screen.getByText("카카오로 시작하기")).toBeInTheDocument();
    expect(screen.getByText("구글로 시작하기")).toBeInTheDocument();
    expect(screen.getByText("복잡한 주식 데이터를 한눈에 진단")).toBeInTheDocument();
  });

  it("보호 라우트에서 넘어온 경로를 저장한 뒤 OAuth 페이지로 이동한다", async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/login",
            state: { from: { pathname: "/portfolio" } },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "카카오로 시작하기" }));

    expect(sessionStorage.getItem("redirect_after_login")).toBe("/portfolio");
    expect(window.location.href).toBe("/oauth2/authorization/kakao");
  });

  it("직접 로그인 화면에 진입한 경우 기본 리다이렉트 경로를 홈으로 저장한다", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem("redirect_after_login", "/watchlist");

    renderWithQuery(
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "구글로 시작하기" }));

    expect(sessionStorage.getItem("redirect_after_login")).toBe("/");
    expect(window.location.href).toBe("/oauth2/authorization/google");
  });
});
