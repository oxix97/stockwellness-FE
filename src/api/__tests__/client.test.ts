import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";

// apiClient를 가져오기 전 store mock 설정
vi.mock("@/store/auth", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

import { apiClient, _resetInternalState } from "../client";
import { useAuthStore } from "@/store/auth";

const mockGetState = useAuthStore.getState as ReturnType<typeof vi.fn>;

describe("apiClient 요청 인터셉터", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    _resetInternalState();
  });

  it("accessToken 있으면 Authorization 헤더 추가", async () => {
    mockGetState.mockReturnValue({ accessToken: "test-token" });

    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const config = { headers: {} as Record<string, string> };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBe("Bearer test-token");
  });

  it("accessToken 없으면 Authorization 헤더 미추가", async () => {
    mockGetState.mockReturnValue({ accessToken: null });

    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;
    const config = { headers: {} as Record<string, string> };
    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBeUndefined();
  });
});

describe("apiClient 응답 인터셉터 — 봉투 언래핑", () => {
  it("response.data.data 가 있으면 data.data 반환", () => {
    const responseInterceptor = (apiClient.interceptors.response as any).handlers[0].fulfilled;
    const response = { data: { data: { id: 1, name: "test" }, status: 200 } };
    const result = responseInterceptor(response);

    expect(result).toEqual({ id: 1, name: "test" });
  });

  it("response.data.data 가 null이면 data.data(null) 반환", () => {
    const responseInterceptor = (apiClient.interceptors.response as any).handlers[0].fulfilled;
    const response = { data: { data: null, status: 200 } };
    const result = responseInterceptor(response);

    expect(result).toBeNull();
  });

  it("response.data.data 가 없으면 data 전체 반환", () => {
    const responseInterceptor = (apiClient.interceptors.response as any).handlers[0].fulfilled;
    const response = { data: [1, 2, 3] };
    const result = responseInterceptor(response);

    expect(result).toEqual([1, 2, 3]);
  });
});

// ── 401 처리 공통 설정 ────────────────────────────────────────
function setup401Suite() {
  let originalAdapter: any;
  let originalLocation: Location;
  let mockUpdateAccessToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    originalLocation = window.location;
    const mockLocation = {
      ...originalLocation,
      href: "",
      assign: vi.fn(),
      replace: vi.fn(),
    };
    vi.stubGlobal("location", mockLocation);

    mockUpdateAccessToken = vi.fn();
    mockGetState.mockReturnValue({
      accessToken: "at-old",
      updateAccessToken: mockUpdateAccessToken,
      logout: vi.fn(),
    });

    localStorage.setItem("refreshToken", "rt-old");

    // 재시도 요청의 네트워크 계층을 가로채는 커스텀 어댑터
    originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = async () => ({
      data: { data: "retried-data" },
      status: 200,
      headers: {},
      config: { headers: {} as any },
      statusText: "OK",
    }) as any;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    vi.unstubAllGlobals();
    localStorage.clear();
    _resetInternalState();
    vi.restoreAllMocks();
  });

  return { getMockUpdateAccessToken: () => mockUpdateAccessToken };
}

describe("apiClient 응답 인터셉터 — 401 + refreshToken 없음", () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    originalLocation = window.location;
    const mockLocation = {
      ...originalLocation,
      href: "",
      assign: vi.fn(),
      replace: vi.fn(),
    };
    vi.stubGlobal("location", mockLocation);
    mockGetState.mockReturnValue({ accessToken: "old-token", updateAccessToken: vi.fn(), logout: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    _resetInternalState();
  });

  it("401 + refreshToken 없으면 /login 리다이렉트", async () => {
    localStorage.removeItem("refreshToken");
    const errorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    const error = {
      response: { status: 401 },
      config: { _retry: false, headers: {} },
    };

    await errorInterceptor(error).catch(() => {});

    expect(window.location.href).toBe("/login");
  });
});

describe("apiClient 응답 인터셉터 — 재발급 성공", () => {
  const { getMockUpdateAccessToken } = setup401Suite();

  it("재발급 성공 시 updateAccessToken 호출 + refreshToken 교체 + 원래 요청 재시도", async () => {
    vi.spyOn(axios, "post").mockResolvedValueOnce({
      data: { data: { accessToken: "at-new", refreshToken: "rt-new" } },
    });

    const errorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;
    const error = {
      response: { status: 401 },
      config: { _retry: false, headers: {} as Record<string, string> },
    };

    const result = await errorInterceptor(error);

    expect(axios.post).toHaveBeenCalledWith("/api/v1/auth/reissue", { refreshToken: "rt-old" });
    expect(getMockUpdateAccessToken()).toHaveBeenCalledWith("at-new");
    expect(localStorage.getItem("refreshToken")).toBe("rt-new");
    expect(error.config.headers.Authorization).toBe("Bearer at-new");
    expect(result).toBe("retried-data");
  });

  it("재발급 성공 후 isRefreshing 초기화 — 이후 401에 재발급 재시도 가능", async () => {
    vi.spyOn(axios, "post")
      .mockResolvedValueOnce({ data: { data: { accessToken: "at-1", refreshToken: "rt-1" } } })
      .mockResolvedValueOnce({ data: { data: { accessToken: "at-2", refreshToken: "rt-2" } } });

    const errorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;
    const makeError = () => ({
      response: { status: 401 },
      config: { _retry: false, headers: {} as Record<string, string> },
    });

    await errorInterceptor(makeError());
    await errorInterceptor(makeError());

    // 각각 독립적으로 재발급 호출
    expect(axios.post).toHaveBeenCalledTimes(2);
  });
});

describe("apiClient 응답 인터셉터 — 동시 401 큐잉", () => {
  setup401Suite();

  it("동시 401 3건 — /reissue 1번만 호출", async () => {
    let resolveReissue!: (val: any) => void;
    vi.spyOn(axios, "post").mockReturnValueOnce(
      new Promise((res) => { resolveReissue = res; }) as any
    );

    const errorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;
    const makeError = () => ({
      response: { status: 401 },
      config: { _retry: false, headers: {} as Record<string, string> },
    });

    // 3개 동시 401 (await 없이 시작)
    const p1 = errorInterceptor(makeError());
    const p2 = errorInterceptor(makeError());
    const p3 = errorInterceptor(makeError());

    // 재발급 완료 전: axios.post는 1번만 호출됨
    expect(axios.post).toHaveBeenCalledTimes(1);

    resolveReissue({ data: { data: { accessToken: "at-new", refreshToken: "rt-new" } } });
    await Promise.all([p1, p2, p3]);

    // 재발급 완료 후에도 여전히 1번
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  it("동시 401 3건 — 모든 요청 새 토큰으로 Authorization 헤더 업데이트", async () => {
    let resolveReissue!: (val: any) => void;
    vi.spyOn(axios, "post").mockReturnValueOnce(
      new Promise((res) => { resolveReissue = res; }) as any
    );

    const errorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    const e1 = { response: { status: 401 }, config: { _retry: false, headers: {} as Record<string, string> } };
    const e2 = { response: { status: 401 }, config: { _retry: false, headers: {} as Record<string, string> } };
    const e3 = { response: { status: 401 }, config: { _retry: false, headers: {} as Record<string, string> } };

    const p1 = errorInterceptor(e1);
    const p2 = errorInterceptor(e2);
    const p3 = errorInterceptor(e3);

    resolveReissue({ data: { data: { accessToken: "at-new", refreshToken: "rt-new" } } });
    await Promise.all([p1, p2, p3]);

    expect(e1.config.headers.Authorization).toBe("Bearer at-new");
    expect(e2.config.headers.Authorization).toBe("Bearer at-new");
    expect(e3.config.headers.Authorization).toBe("Bearer at-new");
  });

  it("재발급 실패 시 대기 요청 모두 거부 + /login 리다이렉트", async () => {
    let rejectReissue!: (err: any) => void;
    vi.spyOn(axios, "post").mockReturnValueOnce(
      new Promise((_, rej) => { rejectReissue = rej; }) as any
    );

    const errorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;
    const makeError = () => ({
      response: { status: 401 },
      config: { _retry: false, headers: {} as Record<string, string> },
    });

    const p1 = errorInterceptor(makeError());
    const p2 = errorInterceptor(makeError());
    const p3 = errorInterceptor(makeError());

    rejectReissue(new Error("RT 만료"));

    const results = await Promise.allSettled([p1, p2, p3]);

    results.forEach((r) => expect(r.status).toBe("rejected"));
    expect(window.location.href).toBe("/login");
  });

  it("재발급 실패 후 isRefreshing 초기화 — 이후 401에 재발급 재시도 가능", async () => {
    let rejectReissue!: (err: any) => void;
    vi.spyOn(axios, "post")
      .mockReturnValueOnce(new Promise((_, rej) => { rejectReissue = rej; }) as any)
      .mockResolvedValueOnce({ data: { data: { accessToken: "at-new", refreshToken: "rt-new" } } });

    const errorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;
    const makeError = () => ({
      response: { status: 401 },
      config: { _retry: false, headers: {} as Record<string, string> },
    });

    // 첫 번째 재발급 실패
    const p1 = errorInterceptor(makeError());
    rejectReissue(new Error("RT 만료"));
    await p1.catch(() => {});

    localStorage.setItem("refreshToken", "rt-new-session");

    // 두 번째 401 — isRefreshing이 초기화되었으므로 재발급 재시도
    await errorInterceptor(makeError()).catch(() => {});

    expect(axios.post).toHaveBeenCalledTimes(2);
  });
});
