import type { Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUTH_STATE_PATH = path.resolve(__dirname, '../.auth-state.json');

export interface AuthState {
  accessToken: string;
  refreshToken: string;
  memberId: number;
  email: string;
  nickname: string;
  portfolioId: string | null;
  backendUrl: string;
}

export function readAuthState(): AuthState {
  if (!fs.existsSync(AUTH_STATE_PATH)) {
    throw new Error(
      '.auth-state.json 을 찾을 수 없습니다.\n' +
        'TEST_BACKEND=1 npm run test:e2e:local 로 실행하세요.'
    );
  }
  return JSON.parse(fs.readFileSync(AUTH_STATE_PATH, 'utf-8')) as AuthState;
}

/**
 * 페이지가 로드되기 전에 localStorage에 인증 상태를 주입한다.
 * 반드시 page.goto() 이전에 호출해야 한다.
 * portfolioId 오버라이드가 필요한 경우 두 번째 인자로 전달한다.
 */
export async function injectAuth(
  page: Page,
  overrides?: Partial<Pick<AuthState, 'portfolioId'>>
): Promise<AuthState> {
  const auth = readAuthState();
  const merged = { ...auth, ...overrides };

  await page.addInitScript((a) => {
    window.localStorage.setItem('accessToken', a.accessToken);
    window.localStorage.setItem('refreshToken', a.refreshToken);
    window.localStorage.setItem(
      'auth-storage',
      JSON.stringify({
        state: {
          memberId: a.memberId,
          email: a.email,
          nickname: a.nickname,
          portfolioId: a.portfolioId,
          accessToken: a.accessToken,
        },
        version: 0,
      })
    );
  }, merged);

  return merged;
}
